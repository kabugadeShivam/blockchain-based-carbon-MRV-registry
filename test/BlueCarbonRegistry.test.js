import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("BlueCarbonRegistry", function () {
  async function deployFixture() {
    const [owner, farmer, verifier, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("BlueCarbonRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    return { registry, owner, farmer, verifier, other };
  }

  it("registers a project", async function () {
    const { registry, farmer } = await deployFixture();
    await expect(registry.connect(farmer).registerProject("Demo Mangrove", "Mangrove", "Maharashtra", "sha256:baseline"))
      .to.emit(registry, "ProjectRegistered");

    const project = await registry.projects(1);
    expect(project.name).to.equal("Demo Mangrove");
    expect(project.owner).to.equal(farmer.address);
  });

  it("submits and verifies an MRV record and mints verified units", async function () {
    const { registry, owner, farmer } = await deployFixture();
    await registry.connect(farmer).registerProject("Demo Mangrove", "Mangrove", "Maharashtra", "sha256:baseline");
    await registry.connect(farmer).submitMRV(1, "sha256:mrv-2026", 120);

    await registry.connect(owner).verifyMRV(1, 100);
    const record = await registry.mrvRecords(1);
    expect(record.verified).to.equal(true);
    expect(record.verifiedCredits).to.equal(100);
    expect(await registry.balanceOf(farmer.address, 1)).to.equal(100);
  });

  it("allows verified credits to be retired", async function () {
    const { registry, owner, farmer } = await deployFixture();
    await registry.connect(farmer).registerProject("Demo Seagrass", "Seagrass", "Goa", "sha256:baseline");
    await registry.connect(farmer).submitMRV(1, "sha256:mrv", 50);
    await registry.connect(owner).verifyMRV(1, 40);

    await expect(registry.connect(farmer).retireCredits(1, 10, "Demo retirement"))
      .to.emit(registry, "CreditsRetired");
    expect(await registry.balanceOf(farmer.address, 1)).to.equal(30);
  });
});
