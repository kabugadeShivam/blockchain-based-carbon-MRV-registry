import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: {
    version: "0.8.27",
    settings: { evmVersion: "cancun" }
  },
  networks: {
    hardhat: {},
    localhost: { type: "http", url: "http://127.0.0.1:8545" }
  }
};
