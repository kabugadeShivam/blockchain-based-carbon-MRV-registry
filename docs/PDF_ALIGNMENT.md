# SIH25038 implementation alignment

This document maps the implementation to the submitted SIH idea PDF.

## 1. Our Idea: submit → validate → issue

**PDF:** NGOs/Panchayats submit project details/evidence; Verifiers and AI validate; verified work can receive tokenized carbon units.

**Implementation:**
- NGO role submits a project and evidence.
- Evidence is SHA-256 hashed off-chain before the proof is anchored.
- MRV calculations run through the API's digital-intelligence checks.
- Verifier role approves/rejects submissions with comments.
- Approved MRV records can issue ERC-1155 registry units on-chain.

## 2. Hybrid MRV

**PDF:** Automated digital intelligence + on-ground human validation.

**Implementation:**
- Automated checks flag missing GPS, timestamps and evidence hashes.
- Carbon calculation is deterministic and returns an indicative quantity.
- Human verifier remains the final approval authority.
- Blockchain preserves the evidence/review provenance.

## 3. Platform roles

**PDF roles:** User registration, NGO, Verifier, Admin.

**Implementation:**
- Web dashboard has NGO / VERIFIER / ADMIN workspaces.
- Backend has user role model and OTP demo endpoints.
- Verifier queue supports approve/reject + comments.
- Admin view exposes operational status and notifications.

## 4. Evidence and rural constraints

**PDF challenges/solutions:** missing geotags, incomplete/fake entries, low bandwidth, large uploads, onboarding and verification delays.

**Implementation:**
- GPS capture and GPS accuracy fields are first-class project/MRV fields.
- Evidence receives a cryptographic SHA-256 hash.
- Captured timestamps are stored with submissions.
- UI is mobile-friendly and keeps evidence payloads off-chain.
- Backend notification queue supports verifier workflow.

Offline upload packs, multilingual UI, SMS OTP provider integration and production KYC are planned integration points rather than falsely represented as complete production services.

## 5. IoT readiness

The PDF specifies future-ready soil-moisture and salinity sensors. The data model intentionally leaves room for sensor telemetry without making hardware a dependency of the software MVP.

## 6. Important scientific boundary

This repository demonstrates a registry and MRV workflow. It does **not** claim that a blockchain transaction proves the scientific correctness of a carbon estimate. Real carbon-credit issuance requires an approved methodology, defensible measurements, uncertainty treatment, permanence/additionality assessment where applicable, and independent verification.
