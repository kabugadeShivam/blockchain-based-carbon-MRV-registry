import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: "0.8.24",
  networks: {
    hardhat: {},
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545"
    }
  }
};
