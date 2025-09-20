require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    shardeum: {
      url: "https://api-unstable.shardeum.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8080,
    },
  },
};
