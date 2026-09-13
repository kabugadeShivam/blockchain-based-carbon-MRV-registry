from __future__ import annotations

import hashlib
import json
import secrets
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_FILE = DATA_DIR / "registry.json"

app = FastAPI(title="Blue Carbon Registry & Hybrid MRV API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_db() -> dict:
    if not DB_FILE.exists():
        return {"users": [], "projects": [], "mrv": [], "evidence": [], "notifications": [], "otp": {}}
    return json.loads(DB_FILE.read_text(encoding="utf-8"))


def save_db(data: dict) -> None:
    DB_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


class UserIn(BaseModel):
    name: str = Field(min_length=2)
    phone: str = Field(min_length=10, max_length=15)
    role: str = Field(pattern="^(NGO|VERIFIER|ADMIN)$")
    language: str = "en"


class ProjectIn(BaseModel):
    name: str = Field(min_length=2)
    ecosystem: str = Field(pattern="^(Mangrove|Seagrass|Salt Marsh|Tidal Wetland)$")
    location: str = Field(min_length=2)
    area_hectares: float = Field(gt=0)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    gps_accuracy_m: float | None = Field(default=None, ge=0)
    evidence_hash: str | None = None
    created_by: str = "demo-ngo"


class MRVIn(BaseModel):
    project_id: int
    reporting_year: int = Field(ge=2000)
    biomass_tonnes_per_hectare: float = Field(gt=0)
    soil_carbon_tonnes_per_hectare: float = Field(ge=0)
    permanence_factor: float = Field(gt=0, le=1)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    gps_accuracy_m: float | None = Field(default=None, ge=0)
    captured_at: str | None = None
    evidence_hash: str | None = None


class VerificationIn(BaseModel):
    verifier: str = "demo-verifier"
    decision: str = Field(pattern="^(APPROVE|REJECT)$")
    comments: str = Field(min_length=2)


@app.get("/health")
def health():
    return {"status": "ok", "service": "blue-carbon-hybrid-mrv-api", "version": "2.0.0"}


@app.get("/api/dashboard")
def dashboard():
    data = load_db()
    verified = [x for x in data["mrv"] if x.get("status") == "VERIFIED"]
    return {
        "projects": len(data["projects"]),
        "area_hectares": round(sum(float(p["area_hectares"]) for p in data["projects"]), 3),
        "mrv_submissions": len(data["mrv"]),
        "verified_mrv": len(verified),
        "verified_carbon_tonnes": round(sum(float(x.get("verified_carbon_tonnes", 0)) for x in verified), 3),
        "pending_verification": len([x for x in data["mrv"] if x.get("status") == "SUBMITTED"]),
    }


@app.post("/api/auth/request-otp")
def request_otp(phone: str):
    data = load_db()
    code = "123456"  # deterministic demo OTP; replace with an SMS provider in production
    data["otp"][phone] = {"code": code, "expires": now()}
    save_db(data)
    return {"sent": True, "demo_otp": code, "message": "Demo OTP generated. Production should use an SMS gateway."}


@app.post("/api/auth/verify-otp")
def verify_otp(phone: str, code: str):
    data = load_db()
    entry = data["otp"].get(phone)
    if not entry or entry["code"] != code:
        raise HTTPException(status_code=401, detail="Invalid OTP")
    return {"verified": True, "phone": phone}


@app.post("/api/users")
def create_user(user: UserIn):
    data = load_db()
    if any(u["phone"] == user.phone for u in data["users"]):
        raise HTTPException(status_code=409, detail="Phone already registered")
    record = {"id": secrets.token_hex(6), **user.model_dump(), "kyc_status": "PENDING", "created_at": now()}
    data["users"].append(record)
    save_db(data)
    return record


@app.get("/api/projects")
def projects():
    return load_db()["projects"]


@app.post("/api/projects")
def create_project(project: ProjectIn):
    data = load_db()
    new_id = max([p["id"] for p in data["projects"]], default=0) + 1
    record = {
        "id": new_id,
        **project.model_dump(),
        "status": "PENDING_VERIFICATION",
        "created_at": now(),
        "verification": {"status": "PENDING", "comments": ""},
    }
    data["projects"].append(record)
    data["notifications"].append({"type": "VERIFICATION_REQUEST", "project_id": new_id, "created_at": now()})
    save_db(data)
    return record


@app.post("/api/evidence/hash")
async def hash_evidence(file: UploadFile = File(...)):
    content = await file.read()
    digest = hashlib.sha256(content).hexdigest()
    data = load_db()
    evidence_id = max([e["id"] for e in data["evidence"]], default=0) + 1
    record = {
        "id": evidence_id,
        "filename": file.filename,
        "sha256": digest,
        "bytes": len(content),
        "captured_at": now(),
        "storage": "off-chain",
    }
    data["evidence"].append(record)
    save_db(data)
    return record


@app.post("/api/mrv/calculate")
def calculate_mrv(mrv: MRVIn):
    data = load_db()
    project = next((p for p in data["projects"] if p["id"] == mrv.project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    gross_carbon = project["area_hectares"] * (
        mrv.biomass_tonnes_per_hectare + mrv.soil_carbon_tonnes_per_hectare
    )
    indicative_tonnes = round(gross_carbon * mrv.permanence_factor, 3)
    ai_flags = []
    if mrv.evidence_hash is None:
        ai_flags.append("MISSING_EVIDENCE_HASH")
    if mrv.latitude is None or mrv.longitude is None:
        ai_flags.append("MISSING_GPS")
    if mrv.captured_at is None:
        ai_flags.append("MISSING_TIMESTAMP")
    return {
        "project_id": mrv.project_id,
        "reporting_year": mrv.reporting_year,
        "gross_carbon_tonnes": round(gross_carbon, 3),
        "indicative_carbon_tonnes": indicative_tonnes,
        "method": "area × (biomass + soil carbon) × permanence factor",
        "digital_intelligence": {"risk": "HIGH" if ai_flags else "LOW", "flags": ai_flags},
        "disclaimer": "Prototype estimate; use an approved methodology and verified field data for real MRV.",
    }


@app.post("/api/mrv")
def create_mrv(payload: MRVIn):
    data = load_db()
    project = next((p for p in data["projects"] if p["id"] == payload.project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    calc = calculate_mrv(payload)
    record = {
        "id": max([m["id"] for m in data["mrv"]], default=0) + 1,
        **payload.model_dump(),
        **{k: calc[k] for k in ["gross_carbon_tonnes", "indicative_carbon_tonnes"]},
        "status": "SUBMITTED",
        "verification": {"verifier": "", "decision": "", "comments": ""},
        "submitted_at": now(),
    }
    data["mrv"].append(record)
    data["notifications"].append({"type": "MRV_SUBMITTED", "mrv_id": record["id"], "created_at": now()})
    save_db(data)
    return record


@app.get("/api/mrv")
def list_mrv():
    return load_db()["mrv"]


@app.post("/api/mrv/{mrv_id}/verify")
def verify_mrv(mrv_id: int, decision: VerificationIn):
    data = load_db()
    record = next((m for m in data["mrv"] if m["id"] == mrv_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="MRV record not found")
    if record["status"] != "SUBMITTED":
        raise HTTPException(status_code=409, detail="MRV already reviewed")
    record["verification"] = decision.model_dump()
    record["status"] = "VERIFIED" if decision.decision == "APPROVE" else "REJECTED"
    if decision.decision == "APPROVE":
        record["verified_carbon_tonnes"] = record["indicative_carbon_tonnes"]
    save_db(data)
    return record


@app.get("/api/notifications")
def notifications():
    return load_db()["notifications"][-50:]


@app.get("/api/health/evidence-check")
def evidence_check():
    data = load_db()
    checks = []
    for p in data["projects"]:
        checks.append({
            "project_id": p["id"],
            "gps": p.get("latitude") is not None and p.get("longitude") is not None,
            "evidence_hash": bool(p.get("evidence_hash")),
            "timestamp": bool(p.get("created_at")),
        })
    return {"checks": checks}
