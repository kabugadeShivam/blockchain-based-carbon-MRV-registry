# Blockchain-Based Blue Carbon Registry and MRV System

**SIH25038 · Clean & Green Technology · Software**

A hybrid MRV platform inspired directly by the submitted SIH idea: NGOs/Panchayats submit evidence, automated digital intelligence checks the submission, authorized verifiers perform on-ground human validation, and blockchain preserves a tamper-evident audit trail for approved registry units.

## PDF idea → implementation

| SIH proposal element | Project implementation |
|---|---|
| NGO/Panchayat submission | NGO dashboard + project/MRV submission APIs |
| Transparent records | Blockchain evidence/review hashes |
| Automated digital intelligence | GPS/timestamp/evidence checks + deterministic MRV calculator |
| Human validation | Verifier work queue with approve/reject + comments |
| Carbon issuance | ERC-1155 verified registry units in the blockchain demo |
| Admin management | Admin control centre + notifications model |
| GPS/timestamp evidence | Browser GPS capture + evidence hashing |
| Low bandwidth | Mobile-first UI + offline/mobile sync blueprint |
| Multilingual support | Language field and mobile-app integration point |
| KYC + OTP | Backend demo endpoints; production SMS/KYC provider is an integration point |
| Future IoT | Soil-moisture and salinity sensor adapter specification |

## Architecture

- **Web:** React + Vite + responsive UI
- **Backend:** Node.js + Express (matches the SIH proposal)
- **Digital intelligence:** Python/FastAPI service for MRV calculations and validation experiments
- **Blockchain:** Solidity 0.8.24 + Hardhat + OpenZeppelin AccessControl/ERC-1155
- **Evidence:** off-chain files; SHA-256 proof and review hash anchored on-chain
- **Data:** JSON demo persistence, replaceable by PostgreSQL/PostGIS
- **Mobile:** React Native/Expo blueprint under `mobile/`

## Core workflow

`Register → Evidence/GPS/timestamp → Digital checks → Measure → Calculate → Submit MRV → Human verifier → Approve/Reject → Blockchain audit → Verified registry units`

## Roles

1. **NGO/Panchayat:** create projects, capture evidence, submit MRV.
2. **Verifier:** review evidence, validate on-ground, approve/reject and comment.
3. **Admin:** manage operational workflow and authorized roles.

## Local development

See [`docs/SETUP.md`](docs/SETUP.md).

See [`docs/PDF_ALIGNMENT.md`](docs/PDF_ALIGNMENT.md) for the detailed mapping to the submitted six-page SIH proposal.

## Scientific boundary

This is a demonstration registry, **not a carbon-credit certification system**. The prototype's carbon calculation is illustrative. Real MRV needs an appropriate approved methodology, defensible field/remote-sensing measurements, uncertainty treatment, permanence/additionality assessment where applicable, and independent verification. Blockchain proves provenance of recorded inputs/outcomes; it does not prove that the underlying science or field measurement is correct.
