# Blockchain-Based Blue Carbon Registry and MRV System

A demonstration platform for registering blue-carbon projects, recording Measurement-Reporting-Verification (MRV) evidence, calculating indicative carbon estimates, and anchoring tamper-evident evidence proofs on a blockchain.

## SIH
- Problem Statement: SIH25038
- Title: Blockchain-Based Blue Carbon Registry and MRV System
- Theme: Clean & Green Technology
- Category: Software

## Architecture
- Frontend: React + Vite + Tailwind CSS
- API: FastAPI + Python
- Database: PostgreSQL/PostGIS-ready data model
- Blockchain: Solidity + Hardhat
- Evidence: off-chain files with on-chain SHA-256/Keccak proof

## Important scope note
This project is an MVP/prototype. Carbon factors and calculated quantities are illustrative unless backed by an approved methodology and independently verified field data. The blockchain provides provenance and tamper evidence; it does not by itself prove that a carbon estimate is scientifically correct.

## Workflow
1. Register a blue-carbon site.
2. Capture baseline area/ecosystem information.
3. Upload monitoring evidence and calculate an indicative carbon estimate.
4. Submit an MRV record with an evidence hash.
5. Authorized verifier approves or rejects the MRV record.
6. Dashboard exposes project status, MRV history, carbon totals, and verification trail.

## Local development
See `docs/SETUP.md` for the complete Windows setup and demo workflow.
