import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [projects, setProjects] = useState([]);
  const [mrv, setMrv] = useState([]);
  const [form, setForm] = useState({ name: "Demo Mangrove", ecosystem: "Mangrove", location: "Maharashtra", area_hectares: 10 });
  const [message, setMessage] = useState("");

  async function refresh() {
    try {
      const [p, m] = await Promise.all([
        fetch(`${API}/api/projects`).then(r => r.json()),
        fetch(`${API}/api/mrv`).then(r => r.json())
      ]);
      setProjects(p);
      setMrv(m);
    } catch {
      setMessage("Backend is not running. Start FastAPI on port 8000.");
    }
  }

  useEffect(() => { refresh(); }, []);

  async function registerProject(e) {
    e.preventDefault();
    const res = await fetch(`${API}/api/projects`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, area_hectares: Number(form.area_hectares) })
    });
    if (!res.ok) return setMessage("Project registration failed.");
    setMessage("Project registered successfully.");
    refresh();
  }

  const totalArea = projects.reduce((sum, p) => sum + Number(p.area_hectares || 0), 0);
  const totalIndicative = mrv.reduce((sum, x) => sum + Number(x.indicative_carbon_tonnes || x.carbon_tonnes || 0), 0);

  return <div className="page">
    <header>
      <div><span className="eyebrow">SIH25038 · CLEAN & GREEN</span><h1>BlueCarbon MRV Registry</h1><p>Evidence-first monitoring, reporting and verification for blue-carbon projects.</p></div>
      <div className="badge">Blockchain anchored</div>
    </header>

    <section className="stats">
      <div><small>Projects</small><strong>{projects.length}</strong></div>
      <div><small>Registered area</small><strong>{totalArea.toFixed(1)} ha</strong></div>
      <div><small>MRV records</small><strong>{mrv.length}</strong></div>
      <div><small>Indicative carbon</small><strong>{totalIndicative.toFixed(1)} tCO₂e</strong></div>
    </section>

    <main>
      <section className="card">
        <h2>Register a project</h2>
        <form onSubmit={registerProject}>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Project name" />
          <select value={form.ecosystem} onChange={e => setForm({...form, ecosystem: e.target.value})}><option>Mangrove</option><option>Seagrass</option><option>Salt Marsh</option><option>Tidal Wetland</option></select>
          <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Location" />
          <input type="number" min="0.1" step="0.1" value={form.area_hectares} onChange={e => setForm({...form, area_hectares: e.target.value})} placeholder="Area (ha)" />
          <button type="submit">Register project</button>
        </form>
        {message && <p className="notice">{message}</p>}
      </section>

      <section className="card">
        <h2>Registry</h2>
        {projects.length === 0 ? <p className="muted">No projects yet.</p> : <div className="table">{projects.map(p => <div className="row" key={p.id}><span>#{p.id} <b>{p.name}</b><small>{p.ecosystem} · {p.location}</small></span><span>{p.area_hectares} ha</span><span className="status">{p.status}</span></div>)}</div>}
      </section>

      <section className="card full">
        <h2>MRV evidence trail</h2>
        <p className="muted">Raw evidence remains off-chain. The blockchain stores the proof/hash and verification outcome.</p>
        {mrv.length === 0 ? <p className="muted">Submit an MRV record through the API or blockchain workflow to see it here.</p> : mrv.map(x => <div className="mrv" key={x.id}><b>MRV #{x.id}</b><span>Project {x.project_id}</span><span>{x.status}</span><span>{x.indicative_carbon_tonnes || x.carbon_tonnes} tCO₂e</span></div>)}
      </section>
    </main>
    <footer>Prototype only · Carbon estimates require approved methodology and independent verification.</footer>
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
