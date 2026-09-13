import express from "express";
import cors from "cors";
import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "registry.json");
fs.mkdirSync(dataDir, { recursive: true });
const load = () => fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, "utf8")) : { users: [], projects: [], mrv: [], evidence: [], notifications: [] };
const save = db => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
const now = () => new Date().toISOString();

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
app.use(cors()); app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok", service: "blue-carbon-node-api" }));
app.get("/api/dashboard", (_, res) => {
  const db = load(); const verified = db.mrv.filter(x => x.status === "VERIFIED");
  res.json({ projects: db.projects.length, area_hectares: db.projects.reduce((s,p)=>s+Number(p.area_hectares),0), mrv_submissions: db.mrv.length, pending_verification: db.mrv.filter(x=>x.status==="SUBMITTED").length, verified_carbon_tonnes: verified.reduce((s,x)=>s+Number(x.verified_carbon_tonnes||0),0) });
});
app.get("/api/projects", (_, res) => res.json(load().projects));
app.post("/api/projects", (req, res) => {
  const db=load(), p=req.body; const id=Math.max(0,...db.projects.map(x=>x.id))+1;
  const record={id,...p,status:"PENDING_VERIFICATION",created_at:now(),verification:{status:"PENDING",comments:""}};
  db.projects.push(record); db.notifications.push({type:"VERIFICATION_REQUEST",project_id:id,created_at:now()}); save(db); res.status(201).json(record);
});
app.post("/api/evidence/hash", upload.single("file"), (req,res) => {
  if(!req.file) return res.status(400).json({detail:"File required"});
  const db=load(), id=Math.max(0,...db.evidence.map(x=>x.id))+1;
  const sha256=crypto.createHash("sha256").update(req.file.buffer).digest("hex");
  const record={id,filename:req.file.originalname,sha256,bytes:req.file.size,captured_at:now(),storage:"off-chain"}; db.evidence.push(record); save(db); res.json(record);
});
app.post("/api/mrv/calculate", (req,res) => {
  const db=load(), x=req.body, p=db.projects.find(y=>y.id===Number(x.project_id)); if(!p) return res.status(404).json({detail:"Project not found"});
  const gross=Number(p.area_hectares)*(Number(x.biomass_tonnes_per_hectare)+Number(x.soil_carbon_tonnes_per_hectare));
  const flags=[]; if(!x.evidence_hash) flags.push("MISSING_EVIDENCE_HASH"); if(x.latitude==null||x.longitude==null) flags.push("MISSING_GPS"); if(!x.captured_at) flags.push("MISSING_TIMESTAMP");
  res.json({project_id:Number(x.project_id),gross_carbon_tonnes:Number(gross.toFixed(3)),indicative_carbon_tonnes:Number((gross*Number(x.permanence_factor)).toFixed(3)),method:"area × (biomass + soil carbon) × permanence factor",digital_intelligence:{risk:flags.length?"HIGH":"LOW",flags}});
});
app.get("/api/mrv", (_,res)=>res.json(load().mrv));
app.post("/api/mrv", (req,res)=>{ const db=load(), x=req.body; if(!db.projects.some(p=>p.id===Number(x.project_id))) return res.status(404).json({detail:"Project not found"}); const gross=Number(db.projects.find(p=>p.id===Number(x.project_id)).area_hectares)*(Number(x.biomass_tonnes_per_hectare)+Number(x.soil_carbon_tonnes_per_hectare)); const id=Math.max(0,...db.mrv.map(y=>y.id))+1; const record={id,...x,gross_carbon_tonnes:Number(gross.toFixed(3)),indicative_carbon_tonnes:Number((gross*Number(x.permanence_factor)).toFixed(3)),status:"SUBMITTED",verification:{verifier:"",decision:"",comments:""},submitted_at:now()}; db.mrv.push(record); db.notifications.push({type:"MRV_SUBMITTED",mrv_id:id,created_at:now()}); save(db); res.status(201).json(record); });
app.post("/api/mrv/:id/verify", (req,res)=>{ const db=load(), x=db.mrv.find(y=>y.id===Number(req.params.id)); if(!x) return res.status(404).json({detail:"MRV record not found"}); if(x.status!=="SUBMITTED") return res.status(409).json({detail:"MRV already reviewed"}); const d=req.body; x.verification=d; x.status=d.decision==="APPROVE"?"VERIFIED":"REJECTED"; if(x.status==="VERIFIED") x.verified_carbon_tonnes=x.indicative_carbon_tonnes; save(db); res.json(x); });

app.listen(process.env.PORT || 3000, () => console.log(`Blue Carbon Node API running on ${process.env.PORT || 3000}`));
