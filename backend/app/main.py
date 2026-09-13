from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_FILE = DATA_DIR / "registry.json"

app = FastAPI(title="Blue Carbon MRV API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_db() -> dict:
    if not DB_FILE.exists():
        return {"projects": [], "mrv": []}
    return json.loads(DB_FILE.read_text(encoding="utf-8"))


def save_db(data: dict) -> None:
    DB_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


class ProjectIn(BaseModel):
    name: str = Field(min_length=2)
    ecosystem: str
    location: str
    area_hectares: float = Field(gt=0)


class MRVIn(BaseModel):
    project_id: int
    reporting_year: int = Field(ge=2000)
    biomass_tonnes_per_hectare: float = Field(gt=0)
    soil_carbon_tonnes_per_hectare: float = Field(ge=0)
    permanence_factor: float = Field(gt=0, le=1)


@app.get("/health")
def health():
    return {"status": "ok", "service": "blue-carbon-mrv-api"}


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
        "status": "PENDING",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    data["projects"].append(record)
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
    return {
        "project_id": mrv.project_id,
        "reporting_year": mrv.reporting_year,
        "gross_carbon_tonnes": round(gross_carbon, 3),
        "indicative_carbon_tonnes": indicative_tonnes,
        "method": "area × (biomass + soil carbon) × permanence factor",
        "disclaimer": "Prototype estimate; use an approved methodology and verified field data for real MRV.",
    }


@app.post("/api/evidence/hash")
async def hash_evidence(file: UploadFile = File(...)):
    content = await file.read()
    digest = hashlib.sha256(content).hexdigest()
    return {"filename": file.filename, "sha256": digest, "bytes": len(content)}


@app.post("/api/mrv")
def create_mrv(payload: dict):
    data = load_db()
    if not any(p["id"] == payload.get("project_id") for p in data["projects"]):
        raise HTTPException(status_code=404, detail="Project not found")
    record = {
        "id": max([m["id"] for m in data["mrv"]], default=0) + 1,
        **payload,
        "status": "SUBMITTED",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    data["mrv"].append(record)
    save_db(data)
    return record


@app.get("/api/mrv")
def list_mrv():
    return load_db()["mrv"]
