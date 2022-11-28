require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

// require("@nomicfoundation/hardhat-toolbox");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const ALCHEMY_API_KEY = "GpSst7ri8w5BVXGcpdb-3DwJKpAqipfB";
const ALCHEMY_API_KEY_MAINNET = "9VDyCJ3i_lZgCpr9PGvNflZkkd7gzsum";

// Replace this private key with your Goerli account private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Beware: NEVER put real Ether into testing accounts
const PRIVATE_KEY = "36fa3c560e0d5d817d67680d021ea31a946e5d3a9f4ffe640c42e5bb1f92fa47";

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.7",
  defaultNetwork: "hardhat",
  mocha: {
    timeout: 100000000
  },
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 4,
    },
    ethereum: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY_MAINNET}`,
      accounts: [PRIVATE_KEY],
      chainId: 1,
    }
  }
};
