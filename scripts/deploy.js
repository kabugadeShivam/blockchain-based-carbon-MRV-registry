import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const Registry = await ethers.getContractFactory("BlueCarbonRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`BlueCarbonRegistry deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
