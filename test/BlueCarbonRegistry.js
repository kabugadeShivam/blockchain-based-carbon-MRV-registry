import { expect } from "chai";
import { ethers } from "hardhat";

describe("BlueCarbonRegistry compatibility suite", function () {
  async function deploy() {
    const [admin, owner, verifier, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BlueCarbonRegistry");
    const registry = await Factory.deploy(); await registry.waitForDeployment();
    await registry.setNGO(owner.address, true); await registry.setVerifier(verifier.address, true);
    return { registry, admin, owner, verifier, outsider };
  }
  it("registers a project and anchors evidence hash", async function () {
    const {registry,owner}=await deploy();
    await registry.connect(owner).registerProject("Navi Mumbai Mangrove Pilot","Mangrove","18.99,73.08","sha256:project-demo");
    const project=await registry.projects(1); expect(project.owner).to.equal(owner.address); expect(project.evidenceHash).to.equal("sha256:project-demo");
  });
  it("allows verifier approval and minting", async function () {
    const {registry,owner,verifier}=await deploy();
    await registry.connect(owner).registerProject("Mangrove Pilot","Mangrove","18.99,73.08","sha256:project");
    await registry.connect(owner).submitMRV(1,"sha256:mrv",100); await registry.connect(verifier).verifyMRV(1,80);
    expect(await registry.balanceOf(owner.address,1)).to.equal(80); const record=await registry.mrvRecords(1); expect(record.status).to.equal(1);
  });
  it("prevents non-verifiers from approving MRV", async function () {
    const {registry,owner,outsider}=await deploy(); await registry.connect(owner).registerProject("Test","Mangrove","0,0","hash"); await registry.connect(owner).submitMRV(1,"mrv-hash",10); await expect(registry.connect(outsider).verifyMRV(1,10)).to.be.reverted;
  });
  it("allows a credit holder to retire credits", async function () {
    const {registry,owner,verifier}=await deploy(); await registry.connect(owner).registerProject("Test","Mangrove","0,0","hash"); await registry.connect(owner).submitMRV(1,"mrv-hash",10); await registry.connect(verifier).verifyMRV(1,10); await registry.connect(owner).retireCredits(1,4,"Corporate offset retirement"); expect(await registry.balanceOf(owner.address,1)).to.equal(6);
  });
});
