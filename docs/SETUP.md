# Local setup (Windows PowerShell)

## 1. Install dependencies

From the repository root:

```powershell
npm install
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
cd frontend
npm install
cd ..
```

## 2. Compile and test the smart contract

```powershell
npm run compile
npm test
```

The contract stores project registration and MRV evidence proofs on-chain. The prototype also demonstrates issuance/retirement of verified units through ERC-1155 tokens.

## 3. Start the local blockchain

Terminal 1:

```powershell
npm run node
```

Terminal 2:

```powershell
npm run deploy:local
```

Copy the deployed contract address for the frontend/blockchain integration.

## 4. Start the FastAPI backend

Terminal 3:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

Health check: `http://127.0.0.1:8000/health`

## 5. Start the dashboard

Terminal 4:

```powershell
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Demo flow

1. Register a project from the dashboard.
2. Use `POST /api/mrv/calculate` to generate an indicative estimate.
3. Use `POST /api/evidence/hash` to generate a SHA-256 evidence proof.
4. Submit the evidence hash and estimate to the smart contract.
5. The authorized verifier verifies the MRV record.
6. The dashboard can display the project/MRV history.

## Important limitation

This is an SIH prototype, not a certification system. Real carbon accounting must use an appropriate approved methodology, calibrated field/remote-sensing data, uncertainty treatment, permanence/additionality rules, and independent verification.
