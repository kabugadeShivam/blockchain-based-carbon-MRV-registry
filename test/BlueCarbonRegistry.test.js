import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("BlueCarbonRegistry", function () {
  async function deployFixture() {
    const [admin, farmer, verifier, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("BlueCarbonRegistry");
    const registry = await Registry.deploy(); await registry.waitForDeployment();
    await registry.setNGO(farmer.address, true);
    await registry.setVerifier(verifier.address, true);
    return { registry, admin, farmer, verifier, other };
  }

  it("registers a project as an NGO and anchors evidence", async function () {
    const { registry, farmer } = await deployFixture();
    await expect(registry.connect(farmer).registerProject("Demo Mangrove", "Mangrove", "Maharashtra", "sha256:baseline")).to.emit(registry,"ProjectRegistered");
    const project = await registry.projects(1);
    expect(project.name).to.equal("Demo Mangrove"); expect(project.owner).to.equal(farmer.address); expect(project.evidenceHash).to.equal("sha256:baseline");
  });

  it("supports verifier approval and mints verified registry units", async function () {
    const { registry, farmer, verifier } = await deployFixture();
    await registry.connect(farmer).registerProject("Demo Mangrove", "Mangrove", "Maharashtra", "sha256:baseline");
    await registry.connect(farmer).submitMRV(1, "sha256:mrv-2026", 120);
    await registry.connect(verifier).reviewMRV(1, true, 100, "sha256:verifier-report");
    const record = await registry.mrvRecords(1);
    expect(record.status).to.equal(1); expect(record.verifiedCredits).to.equal(100); expect(await registry.balanceOf(farmer.address,1)).to.equal(100);
  });

  it("supports verifier rejection with a review proof", async function () {
    const { registry, farmer, verifier } = await deployFixture();
    await registry.connect(farmer).registerProject("Demo Seagrass", "Seagrass", "Goa", "hash");
    await registry.connect(farmer).submitMRV(1, "mrv-hash", 50);
    await registry.connect(verifier).rejectMRV(1, "sha256:rejection-report");
    const record = await registry.mrvRecords(1); expect(record.status).to.equal(2); expect(record.verifiedCredits).to.equal(0);
  });

  it("prevents non-verifiers from approving MRV", async function () {
    const { registry, farmer, other } = await deployFixture();
    await registry.connect(farmer).registerProject("Test", "Mangrove", "0,0", "hash");
    await registry.connect(farmer).submitMRV(1, "mrv-hash", 10);
    await expect(registry.connect(other).verifyMRV(1,10)).to.be.reverted;
  });

  it("allows verified credits to be retired", async function () {
    const { registry, farmer, verifier } = await deployFixture();
    await registry.connect(farmer).registerProject("Test", "Mangrove", "0,0", "hash");
    await registry.connect(farmer).submitMRV(1, "mrv-hash", 10);
    await registry.connect(verifier).verifyMRV(1,10);
    await expect(registry.connect(farmer).retireCredits(1,4,"Demo retirement")).to.emit(registry,"CreditsRetired");
    expect(await registry.balanceOf(farmer.address,1)).to.equal(6);
  });
});
