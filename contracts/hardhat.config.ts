import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";

import { config as dotenvConfig } from "dotenv";
dotenvConfig();

// TEST_PK_0 = 0xe9dbd00767eef0e147dce36d0c2ffffffb8ecba9edeaad63f5ce7aa738c2c3a6
const DEFAULT_MNEMONIC = process.env.MNEMONIC ?? "test test test test test test test test test test test test";
const CRONOS_TESTNET_MNEMONIC = process.env.CRONOS_TESTNET_MNEMONIC ?? DEFAULT_MNEMONIC;

const config: HardhatUserConfig = {
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },

  networks: {
    hardhat: {
      chainId: 33131,
      accounts: {
        mnemonic: DEFAULT_MNEMONIC,
        accountsBalance: "100" + "0".repeat(18), // 100 ETH
      },
    },

    "cronos:testnet": {
      url: "https://evm-t3.cronos.org",
      accounts: {
        mnemonic: CRONOS_TESTNET_MNEMONIC,
      },
    },
  },

  solidity: "0.8.19",
};

export default config;
