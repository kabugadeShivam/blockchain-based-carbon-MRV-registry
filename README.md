# Blockchain-Based Blue Carbon Registry and MRV System

A demonstration platform for registering blue-carbon projects, recording Measurement-Reporting-Verification (MRV) evidence, calculating indicative carbon estimates, and anchoring tamper-evident evidence proofs on a blockchain.

## SIH alignment
- **Problem Statement:** SIH25038
- **Title:** Blockchain-Based Blue Carbon Registry and MRV System
- **Theme:** Clean & Green Technology
- **Category:** Software

## Current MVP architecture
- **Frontend:** React + Vite, responsive custom CSS
- **API:** FastAPI + Python
- **Prototype persistence:** JSON file; designed to be replaceable with PostgreSQL/PostGIS
- **Blockchain:** Solidity 0.8.24 + Hardhat + OpenZeppelin ERC-1155/AccessControl
- **Evidence:** off-chain files with SHA-256 proof; registry records anchor evidence hashes on-chain
- **CI:** GitHub Actions for contract, backend and frontend checks

## Core capabilities
1. Register mangrove, seagrass, salt-marsh or tidal-wetland projects.
2. Calculate an **indicative** carbon estimate from area, biomass, soil carbon and a permanence factor.
3. Hash uploaded evidence using SHA-256.
4. Submit project/MRV evidence proofs to the blockchain.
5. Authorize verifiers and verify MRV records.
6. Demonstrate issuance and retirement of verified registry units using ERC-1155 token IDs.
7. Display project and MRV status in a web dashboard.

## End-to-end workflow

`Project registration → baseline evidence → measurement → indicative calculation → evidence hash → MRV submission → independent verifier → blockchain verification → audit trail`

## Important scope note
This is an SIH prototype, not a carbon-credit certification system. Carbon quantities shown by the demo are illustrative unless supported by an approved methodology, appropriate field/remote-sensing data, uncertainty treatment, permanence/additionality assessment and independent verification. Blockchain provides provenance/tamper evidence; it does not prove that an input measurement or carbon factor is scientifically correct.

## Local development
See [`docs/SETUP.md`](docs/SETUP.md) for the complete Windows PowerShell setup and demo workflow.
