# Blockchain-Based Blue Carbon Registry and MRV System

**SIH25038 · Clean & Green Technology · Software**

A feature-complete software prototype based on the submitted SIH idea: **NGO/Panchayat → evidence → automated digital intelligence → on-ground human validation → verified registry units → transparent blockchain audit**.

## What is implemented

- NGO/Panchayat project registration and evidence submission
- Mangrove, Seagrass, Salt Marsh and Tidal Wetland project types
- GPS/geotag + GPS accuracy capture and timestamps
- SHA-256 evidence fingerprinting; raw files remain off-chain
- Hybrid MRV: automated digital checks + human verifier decision
- Illustrative carbon calculation with risk flags and scientific disclaimer
- Verifier approve/reject workflow with comments and feedback
- Batch-verification queue API
- User registration with NGO/Verifier/Admin roles
- Demo OTP flow and KYC status model
- Admin dashboard, audit trail, notifications and dispute workflow
- Low-bandwidth/offline upload-pack sync API
- React Native/Expo field-app starter
- Future-ready soil-moisture and salinity IoT telemetry API
- Responsive, mobile-first dashboard with EN/HI/MR language switch
- MetaMask + Solidity/OpenZeppelin ERC-1155 registry integration
- Public project registry and MRV history

## PDF coverage

The submitted PDF's Page 2 proposes **submit → validate → issue**, hybrid MRV, transparent records and accessible dashboards. Page 3 defines user registration, NGO/Verifier/Admin actions, React/Node/Solidity/React Native, IoT readiness, OTP and KYC. Page 4 identifies geotag/data-quality, bandwidth, onboarding and verification-delay challenges and proposes GPS/timestamped photos, offline packs, training/multilingual support and automated tracking/notifications. Page 5 targets NGOs/Panchayats and Verifiers/Admins and describes social, economic and environmental benefits. The implementation is mapped in `docs/PDF_ALIGNMENT.md`. fileciteturn68file0L23-L55

## Architecture

**Web:** React + Vite + responsive mobile-first UI  
**API:** Node.js + Express  
**Digital intelligence:** Python/FastAPI service retained for experimentation  
**Blockchain:** Solidity 0.8.24 + Hardhat + OpenZeppelin AccessControl/ERC-1155  
**Evidence:** off-chain storage + SHA-256 provenance  
**Mobile:** React Native/Expo field starter  
**Demo data:** JSON persistence; PostgreSQL/PostGIS/IPFS/Polygon can replace adapters for production

## Demo workflow

1. NGO switches to the NGO workspace.
2. Capture GPS and accuracy, attach evidence and hash it.
3. Create the project/request verification.
4. Enter MRV observations and run digital checks.
5. Submit MRV.
6. Verifier reviews and approves/rejects with comments.
7. Approved records can be represented by blockchain registry units.
8. Admin monitors notifications, disputes, audit events, batches and IoT telemetry.
9. Field users can save an offline pack and sync when connectivity returns.

## Important boundary

This is a hackathon/demo registry, **not a carbon-credit certification system**. The carbon equation is illustrative. Real MRV requires an appropriate approved methodology, defensible measurements, uncertainty treatment, permanence/additionality assessment where applicable and independent verification. Blockchain provides provenance of recorded inputs/outcomes; it does not prove scientific correctness.

## Research references from the supplied PDF

The PDF lists NOAA, the Blue Carbon Initiative, Lovelock (2019), Macreadie et al. (2019), Hilmi et al. (2021), the Blue Carbon Handbook (2023), Ramsar Briefing Note No. 12, NOAA Blue Carbon Fast Facts and a Guardian seabed-carbon article. fileciteturn68file1L70-L98

## Setup

See `docs/SETUP.md` for Windows PowerShell commands and `docs/PDF_ALIGNMENT.md` for the feature-by-feature mapping.
