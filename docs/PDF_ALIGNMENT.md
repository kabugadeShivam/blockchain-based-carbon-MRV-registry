# SIH25038 → implementation coverage

This repository is explicitly structured around the six-page SIH25038 proposal. The PDF's diagrams define the product workflow, roles, technology choices, rural constraints and impact; this document tracks those items.

## Page 2 — Proposed solution

- **Submit project evidence:** NGO/Panchayat web workflow + field-app workflow.
- **Validate data:** automated digital checks for evidence hash, GPS, timestamp and GPS accuracy, plus MRV calculation support.
- **Human validation:** verifier queue with approve/reject and comments.
- **Issue carbon credits:** Solidity registry supports verified ERC-1155 registry units after verifier approval.
- **Hybrid MRV:** digital intelligence and human/on-ground validation are deliberately separate decision layers.
- **Transparent:** evidence/review hashes can be anchored on-chain.
- **Reliable:** cross-checkable metadata and audit events.
- **Accessible:** responsive dashboard, mobile field app, offline queue and multilingual EN/HI/MR interface.

## Page 3 — Technical approach

The PDF names Next.js/React/Tailwind, Node.js, Solidity smart contracts, Polygon/Ethereum testnet, IPFS, React Native, future soil-moisture/salinity IoT, role-based access, OTP and KYC.

The runnable prototype implements the core web stack with **React/Vite + Node.js + Solidity/Hardhat/OpenZeppelin**, while keeping IPFS/Polygon and production KYC/SMS as deployment adapters. The field-app folder now contains a runnable Expo/React Native starter with GPS and offline sync.

Roles/actions covered:

1. **User registration:** user model + role selection + OTP demo API.
2. **NGO:** create projects, upload/hash evidence, request verification, run MRV, monitor status.
3. **Verifier:** review submissions, approve/reject with comments, queue batch verification.
4. **Admin:** dashboard, notifications, disputes, audit records, operational integrity and role-management hooks.

## Page 4 — Feasibility and viability

Challenges represented in the PDF are addressed as follows:

- Missing geotags/incomplete/fake entries → GPS, accuracy, timestamps, evidence hashing and automated checks.
- Low rural bandwidth/large uploads → offline upload packs, metadata-first API, mobile-first design and an evidence-size limit.
- NGO onboarding → simple forms, multilingual UI and OTP/KYC integration point.
- Verification delays → status tracker, notifications and batch-verification queue.
- Centralized approval complexity → explicit verifier/admin workflow plus immutable blockchain provenance for recorded outcomes.

## Page 5 — Impact and benefits

The platform exposes the proposal's target groups and intended outcomes:

- **NGOs/Panchayats:** streamlined submissions and transparent tracking.
- **Verifiers/Admins:** evidence-rich review and informed decisions.
- **Social:** community engagement/awareness pathway.
- **Economic:** sustainable livelihoods and carbon-finance pathway.
- **Environmental:** verified carbon sequestration and biodiversity outcomes.
- **Integrated coastal resilience:** combines social, economic and environmental benefits.

## Page 6 — research/reference basis

The PDF lists NOAA, the Blue Carbon Initiative, Lovelock (2019), Macreadie et al. (2019), Hilmi et al. (2021), the Blue Carbon Handbook (2023), Ramsar Briefing Note No. 12, NOAA Blue Carbon Fast Facts and a Guardian seabed-carbon article. Those references are retained in the project README/reference material. fileciteturn68file1L70-L98

## Scientific boundary

The proposal is a registry/MRV solution, not a scientific certification methodology. The prototype's carbon equation is intentionally illustrative. Real credits require an approved methodology, defensible measurements, uncertainty treatment and independent verification. Blockchain proves provenance of recorded data/outcomes; it does not prove that the underlying measurement is scientifically correct.
