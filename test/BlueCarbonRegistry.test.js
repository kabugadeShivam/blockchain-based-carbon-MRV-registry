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

  it("anchors mandatory project GPS proof to the project owner", async function () {
    const { registry, farmer, other } = await deployFixture();
    await registry.connect(farmer).registerProject("GPS Mangrove", "Mangrove", "Maharashtra", "sha256:evidence");
    await expect(registry.connect(farmer).anchorProjectGPS(1, 19000000, 73000000, 12000, (await ethers.provider.getBlock('latest')).timestamp, "sha256:gps-proof")).to.emit(registry,"GPSProofAnchored");
    const proof = await registry.projectGPS(1);
    expect(proof.latitudeE6).to.equal(19000000); expect(proof.longitudeE6).to.equal(73000000); expect(proof.accuracyMm).to.equal(12000); expect(proof.proofHash).to.equal("sha256:gps-proof");
    await expect(registry.connect(other).anchorProjectGPS(1, 19000000, 73000000, 12000, (await ethers.provider.getBlock('latest')).timestamp, "hash")).to.be.revertedWith("Not project owner");
  });

  it("supports verifier approval and mints verified registry units", async function () {
    const { registry, farmer, verifier } = await deployFixture();
    await registry.connect(farmer).registerProject("Demo Mangrove", "Mangrove", "Maharashtra", "sha256:baseline");
    await registry.connect(farmer).submitMRV(1, "sha256:mrv-2026", 120);
    await registry.connect(verifier).reviewMRV(1, true, 100, "sha256:verifier-report");
    const record = await registry.mrvRecords(1);
    expect(record.status).to.equal(1); expect(record.verifiedCredits).to.equal(100); expect(await registry.balanceOf(farmer.address,1)).to.equal(100);
  });

  it("anchors MRV GPS proof to the submitted record", async function () {
    const { registry, farmer, verifier } = await deployFixture();
    await registry.connect(farmer).registerProject("Demo Seagrass", "Seagrass", "Goa", "hash");
    await registry.connect(farmer).submitMRV(1, "mrv-hash", 50);
    const ts=(await ethers.provider.getBlock('latest')).timestamp;
    await expect(registry.connect(farmer).anchorMRVGPS(1, 15500000, 73500000, 8000, ts, "sha256:mrv-gps")).to.emit(registry,"MRVGPSProofAnchored");
    const proof=await registry.mrvGPS(1); expect(proof.latitudeE6).to.equal(15500000); expect(proof.proofHash).to.equal("sha256:mrv-gps");
    await expect(registry.connect(verifier).anchorMRVGPS(1,15500000,73500000,8000,ts,"sha256:mrv-gps-2")).to.not.be.reverted;
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
