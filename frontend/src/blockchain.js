import { ethers } from "ethers";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

export const REGISTRY_ABI = [
  "function registerProject(string name,string ecosystem,string location,string evidenceHash) returns (uint256)",
  "function submitMRV(uint256 projectId,string evidenceHash,uint256 estimatedCredits) returns (uint256)",
  "function projects(uint256) view returns (uint256 id,address owner,string name,string ecosystem,string location,string evidenceHash,uint256 createdAt,bool active)",
  "function mrvRecords(uint256) view returns (uint256 id,uint256 projectId,string evidenceHash,uint256 estimatedCredits,uint256 verifiedCredits,address submittedBy,address verifiedBy,uint256 submittedAt,uint256 verifiedAt,bool verified)",
  "function balanceOf(address account,uint256 id) view returns (uint256)"
];

export async function connectRegistry() {
  if (!window.ethereum) throw new Error("MetaMask is not installed.");
  if (!CONTRACT_ADDRESS) throw new Error("VITE_CONTRACT_ADDRESS is not configured.");
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  return { signer, account: await signer.getAddress(), contract: new ethers.Contract(CONTRACT_ADDRESS, REGISTRY_ABI, signer) };
}
