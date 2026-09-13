# SIH25038 → implementation coverage

This repository maps the six-page SIH25038 proposal to runnable prototype workflows. The PDF is the source of the product requirements; implementation notes below distinguish functional prototype features from deployment adapters and future-ready hardware.

## Page 2 — Proposed solution

| PDF requirement | Implementation |
|---|---|
| Submit project evidence | Web NGO/Panchayat workflow + Expo/React Native field app |
| Validate data | GPS range/accuracy/timestamp checks, evidence SHA-256, digital MRV screening |
| Issue carbon credits | Solidity ERC-1155 registry units after verifier approval |
| Automated digital intelligence | Deterministic digital/AI-assisted screening flags in MRV workflow; this is a prototype heuristic, not a trained scientific model |
| On-ground human validation | Verifier approve/reject with mandatory comments and batch review |
| Transparent | Evidence/review/GPS proof hashes can be anchored on-chain |
| Reliable | Timestamped evidence, GPS accuracy, audit trail and cross-checkable metadata |
| Accessible | Responsive dashboard, mobile field app, multilingual EN/HI/MR UI, offline queue and image compression |

## Page 3 — Technical approach

The PDF names Next.js/React/Tailwind, Node.js, Solidity smart contracts, Polygon/Ethereum testnet, IPFS, React Native, future soil-moisture/salinity IoT, role-based access, OTP and KYC.

The runnable prototype uses React/Vite + Node.js + Solidity/Hardhat/OpenZeppelin. Polygon/Ethereum and IPFS are deployment adapters; Pinata can be configured through `PINATA_JWT`. The field-app folder is a runnable Expo/React Native workflow.

### User roles and actions

1. **User registration:** name, phone, role, language, OTP verification and KYC state.
2. **OTP login:** registered users receive a login OTP and a 12-hour session token; KYC must be VERIFIED.
3. **NGO/Panchayat:** register projects, capture GPS, upload/hash evidence, request verification, run MRV, monitor feedback/status, save offline packs.
4. **Verifier:** receive submissions, inspect digital checks and GPS/evidence metadata, approve/reject with comments, batch-process queues, generate printable reports.
5. **Admin:** monitor dashboards, manage KYC/user records, handle disputes, inspect audit trail and system notifications.
6. **IoT path:** soil-moisture, salinity and temperature telemetry simulator with threshold alerts; physical sensors remain future-ready as described by the PDF.

## Page 4 — Feasibility and viability

- Missing geotags/incomplete/fake entries → mandatory GPS coordinates, GPS accuracy, timestamps, SHA-256 evidence binding and automated validation.
- Low rural bandwidth/large uploads → client-side image compression for large images, 15 MB API guardrail, offline upload packs and sync when connectivity returns.
- NGO onboarding → training center, simple forms, multilingual UI and OTP/KYC workflow.
- Verification delays → status tracker, notifications, batch verification and printable reports.
- Centralized approval complexity → explicit role-based API authorization and on-chain role enforcement.
- Remote verification → verifier queue exposes GPS/evidence/digital-risk context before the human decision.

## Page 5 — Impact and benefits

The public registry and dashboard expose the proposal's intended target groups and outcomes:

- **NGOs/Panchayats:** streamlined submissions and transparent tracking.
- **Verifiers/Admins:** evidence-rich review, informed decisions and reports.
- **Social:** training and community-awareness pathway.
- **Economic:** sustainable livelihoods and carbon-finance pathway.
- **Environmental:** verified carbon-sequestration/provenance pathway and biodiversity context.
- **Integrated coastal resilience:** social, economic and environmental dimensions are represented in the dashboard/registry narrative.

## Page 6 — research/reference basis

The PDF lists NOAA, The Blue Carbon Initiative, Lovelock (2019), Macreadie et al. (2019), Hilmi et al. (2021), The Blue Carbon Handbook (2023), Ramsar Briefing Note No. 12, NOAA Blue Carbon Fast Facts and a Guardian seabed-carbon article. These references remain the proposal's research basis.

## Functional boundary

**Functional in prototype:** GPS capture/validation, timestamped evidence, SHA-256/GPS proof, offline queue, image compression, OTP registration/login, KYC state management, role-based API access, digital MRV screening, human/batch verification, reports, notifications, disputes, audit trail, IoT simulator, multilingual UI, training/onboarding, and blockchain GPS/MRV anchoring.

**Deployment adapters:** real SMS requires Twilio configuration; IPFS requires Pinata configuration; blockchain anchoring requires a deployed contract, MetaMask and appropriate on-chain roles; browser GPS requires HTTPS in deployed environments.

**Scientific boundary:** the carbon equation is intentionally illustrative. Real credits require an approved methodology, defensible measurements, uncertainty treatment, independent verification and applicable registry rules. Blockchain proves provenance of recorded data/outcomes; it does not prove that the underlying measurement is scientifically correct.
