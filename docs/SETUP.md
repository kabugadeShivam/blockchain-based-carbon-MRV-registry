# Local setup (Windows PowerShell)

This setup follows the SIH proposal: React web dashboard, Node.js backend, Solidity/Hardhat blockchain, off-chain evidence storage, role-based workflow, and a future-ready mobile/IoT layer.

## 1. Install root dependencies

From the repository root:

```powershell
npm install
npm run compile
npm test
```

## 2. Start the blockchain

Terminal 1:

```powershell
npm run node
```

Terminal 2:

```powershell
npm run deploy:local
```

The deployer account has the demo Admin, Verifier and NGO roles. For a real deployment, roles must be granted to separate controlled accounts.

## 3. Start the Node.js backend (PDF architecture)

Terminal 3:

```powershell
cd backend\node-server
npm install
npm run dev
```

Health check: `http://127.0.0.1:3000/health`

## 4. Start the React dashboard

Terminal 4:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## 5. Optional Python digital-intelligence service

The original Python service remains available for development/testing of the MRV calculation and automated evidence checks:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Set `VITE_API_URL=http://127.0.0.1:8000` if you intentionally want the dashboard to use that service instead of the Node API.

## Demo workflow matching the PDF

1. Switch to **NGO**.
2. Capture GPS coordinates and attach a timestamped photo/report.
3. Hash the evidence with SHA-256.
4. Register the project and request verification.
5. Run digital MRV checks and create an indicative carbon estimate.
6. Submit the MRV record.
7. Switch to **VERIFIER** and approve/reject with comments after human review.
8. Use MetaMask/local Hardhat to anchor the project and, when the smart-contract workflow is used, verify the MRV and issue ERC-1155 registry units.
9. Switch to **ADMIN** to demonstrate the operational control centre.

## Rural/low-bandwidth design principles

The proposal calls for offline upload packs, compressed evidence, mobile-first UX and multilingual support. The `mobile/README.md` defines the field-app contract and sync model; production React Native packaging can be added without changing the registry API.

## Scientific boundary

The calculation in this prototype is intentionally illustrative. It must not be presented as a certified carbon-credit methodology. Scientific MRV requires an appropriate methodology, defensible field/remote-sensing observations, uncertainty treatment, permanence/additionality considerations where applicable, and independent verification.
