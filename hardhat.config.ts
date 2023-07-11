import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// require("@nomicfoundation/hardhat-toolbox");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
// task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
//   const accounts = await hre.ethers.getSigners();

//   for (const account of accounts) {
//     console.log(account.address);
//   }
// });

const ALCHEMY_API_KEY = "oUQT-cJU4z5oXuNFzM8Q2EbhUPpVlsNh";
const ALCHEMY_API_KEY_MAINNET = "9VDyCJ3i_lZgCpr9PGvNflZkkd7gzsum";

// Replace this private key with your Goerli account private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Beware: NEVER put real Ether into testing accounts
const PRIVATE_KEY = "";

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const config: HardhatUserConfig = {
  solidity: "0.8.7",
  defaultNetwork: "hardhat",
  mocha: {
    timeout: 100000000
  },
  networks: {
    hardhat: {
      gasPrice: 470000000000,
      chainId: 43112,
    },
    // goerli: {
    //   url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
    //   accounts: [PRIVATE_KEY],
    //   chainId: 5,
    // },
    // ethereum: {
    //   url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY_MAINNET}`,
    //   accounts: [PRIVATE_KEY],
    //   chainId: 1,
    // }
  }
}

export default config;

