import fs, { promises as fsAsync } from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, Deployment } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import path from "path";
import { Log } from "ethers";

const FILE = path.join(__dirname, "../contract-deployment.json");

// export contract deployment to `contract-deployment.json` file
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;

  const networkName = deployments.getNetworkName();
  const url = "url" in hre.network.config ? hre.network.config.url : "http://localhost:9945";

  // short circuit for local network
  if (networkName === "localhost") return;

  const contracts: {
    [name: string]: Deployment | { address: string };
  } = await deployments.all();

  const namedAccounts = await getNamedAccounts();
  const { chainId } = await ethers.provider.getNetwork();

  const content = fs.existsSync(FILE) ? await fsAsync.readFile(FILE, "utf-8") : "";
  const parsed = content ? JSON.parse(content) : {};
  parsed[networkName] = {
    chainId: parseInt(chainId.toString()),
    url,
    namedAccounts,
    contracts: Object.entries(contracts).reduce(
      (acc, [name, deployment]) => ({ ...acc, [name]: deployment.address }),
      {}
    ),
  };

  console.log("update %s", FILE);

  await fsAsync.writeFile(FILE, JSON.stringify(parsed, null, 2));

  // splitter
  console.log("\n\n");
};
export default func;
func.runAtTheEnd = true;
func.tags = ["export-json"];
