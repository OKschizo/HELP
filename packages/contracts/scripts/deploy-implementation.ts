import hre from "hardhat";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const { ethers } = hre;

async function main() {
  console.log("🚀 Starting Implementation Contract Deployment...\n");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy Implementation Contract
  console.log("📦 Deploying HyperLaunchERC721_ImplV2...");
  
  const ImplementationFactory = await ethers.getContractFactory("HyperLaunchERC721_ImplV2");
  const implementation = await ImplementationFactory.deploy();
  
  await implementation.waitForDeployment();
  const implementationAddress = await implementation.getAddress();
  
  console.log(`✅ Implementation deployed to: ${implementationAddress}`);

  // Get deployment transaction details
  const deployTx = implementation.deploymentTransaction();
  if (deployTx) {
    console.log(`📋 Transaction Hash: ${deployTx.hash}`);
    console.log(`⛽ Gas Used: ${deployTx.gasLimit.toString()}`);
  }

  // Save deployment info
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: network.chainId.toString()
    },
    deployer: deployerAddress,
    contracts: {
      implementation: {
        address: implementationAddress,
        transactionHash: deployTx?.hash || "unknown"
      }
    },
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  // Ensure deployments directory exists
  const deploymentsDir = join(__dirname, "../deployments");
  if (!existsSync(deploymentsDir)) {
    mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save to file
  const filename = `implementation-${network.chainId}-${Date.now()}.json`;
  const filepath = join(deploymentsDir, filename);
  writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`💾 Deployment info saved to: ${filepath}\n`);

  // Verification instructions
  console.log("🔍 To verify the contract on Etherscan, run:");
  console.log(`npx hardhat verify --network ${network.name} ${implementationAddress}\n`);

  return {
    implementationAddress,
    deploymentInfo
  };
}

// Execute deployment (ESM-safe)
// eslint-disable-next-line @typescript-eslint/no-floating-promises
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

export { main as deployImplementation };
