import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

// Make sure that env var and hardhat network have the same chain id
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  console.log("deployer", deployer);

  await deploy("Verifier", {
    log: true,
    from: deployer,
    args: [],
  });

  await deploy("MockVerifier", {
    log: true,
    from: deployer,
    args: [],
  });
};
export default func;
