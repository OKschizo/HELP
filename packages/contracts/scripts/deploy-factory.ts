import hre from "hardhat";
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";

const { ethers } = hre;

interface DeploymentConfig {
  platformFeeReceiver: string;
  platformFeeBps: number; // Basis points (100 = 1%, 250 = 2.5%, etc.)
  implementationAddress?: string; // Optional, will prompt if not provided
}

async function main() {
  console.log("🚀 Starting Factory Contract Deployment...\n");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Load deployment configuration
  let config: DeploymentConfig;
  
  try {
    const configPath = join(__dirname, "../deploy-config.json");
    const configFile = readFileSync(configPath, "utf8");
    config = JSON.parse(configFile);
    console.log("📋 Loaded deployment configuration from deploy-config.json");
  } catch (error) {
    console.log("⚠️  No deploy-config.json found, using default configuration");
    config = {
      platformFeeReceiver: deployerAddress, // Default to deployer
      platformFeeBps: 250 // 2.5% default platform fee
    };
  }

  // Validate configuration
  if (!ethers.isAddress(config.platformFeeReceiver)) {
    throw new Error(`Invalid platform fee receiver address: ${config.platformFeeReceiver}`);
  }

  if (config.platformFeeBps > 1000) {
    throw new Error(`Platform fee too high: ${config.platformFeeBps} bps (max 1000 = 10%)`);
  }

  console.log(`💼 Platform Fee Receiver: ${config.platformFeeReceiver}`);
  console.log(`💰 Platform Fee: ${config.platformFeeBps / 100}%\n`);

  // Get implementation address
  let implementationAddress = config.implementationAddress;
  
  if (!implementationAddress) {
    // Try to find the latest implementation deployment
    try {
      const deploymentsDir = join(__dirname, "../deployments");
      if (existsSync(deploymentsDir)) {
        const files = require("fs").readdirSync(deploymentsDir)
          .filter((f: string) => f.startsWith(`implementation-${network.chainId}`))
          .sort()
          .reverse();
        
        if (files.length > 0) {
          const latestFile = join(deploymentsDir, files[0]);
          const deployment = JSON.parse(readFileSync(latestFile, "utf8"));
          implementationAddress = deployment.contracts.implementation.address;
          console.log(`📦 Found implementation from previous deployment: ${implementationAddress}`);
        }
      }
    } catch (error) {
      console.log("⚠️  Could not find previous implementation deployment");
    }
  }

  if (!implementationAddress) {
    throw new Error("Implementation address not found. Please deploy the implementation contract first or specify it in deploy-config.json");
  }

  // Verify implementation contract exists
  const implementationCode = await ethers.provider.getCode(implementationAddress);
  if (implementationCode === "0x") {
    throw new Error(`No contract found at implementation address: ${implementationAddress}`);
  }

  console.log(`🔗 Using Implementation: ${implementationAddress}\n`);

  // Deploy Factory Contract
  console.log("🏭 Deploying HyperLaunch721FactoryV2...");
  
  const FactoryFactory = await ethers.getContractFactory("HyperLaunch721FactoryV2");
  const factory = await FactoryFactory.deploy(
    implementationAddress,
    config.platformFeeReceiver,
    config.platformFeeBps
  );
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log(`✅ Factory deployed to: ${factoryAddress}`);

  // Get deployment transaction details
  const deployTx = factory.deploymentTransaction();
  if (deployTx) {
    console.log(`📋 Transaction Hash: ${deployTx.hash}`);
    console.log(`⛽ Gas Used: ${deployTx.gasLimit.toString()}`);
  }

  // Verify deployment by calling view functions
  console.log("\n🔍 Verifying deployment...");
  const factoryImplementation = await factory.implementation();
  const factoryOwner = await factory.owner();
  const factoryFeeReceiver = await factory.platformFeeReceiver();
  const factoryFeeBps = await factory.platformFeeBps();

  console.log(`   Implementation: ${factoryImplementation}`);
  console.log(`   Owner: ${factoryOwner}`);
  console.log(`   Fee Receiver: ${factoryFeeReceiver}`);
  console.log(`   Fee BPS: ${factoryFeeBps}`);

  // Save deployment info
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: network.chainId.toString()
    },
    deployer: deployerAddress,
    contracts: {
      factory: {
        address: factoryAddress,
        transactionHash: deployTx?.hash || "unknown"
      },
      implementation: {
        address: implementationAddress
      }
    },
    configuration: {
      platformFeeReceiver: config.platformFeeReceiver,
      platformFeeBps: config.platformFeeBps
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
  const filename = `factory-${network.chainId}-${Date.now()}.json`;
  const filepath = join(deploymentsDir, filename);
  writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`💾 Deployment info saved to: ${filepath}\n`);

  // Verification instructions
  console.log("🔍 To verify the contract on Etherscan, run:");
  console.log(`npx hardhat verify --network ${network.name} ${factoryAddress} "${implementationAddress}" "${config.platformFeeReceiver}" ${config.platformFeeBps}\n`);

  // Usage instructions
  console.log("🎯 Factory Contract Deployed Successfully!");
  console.log("📝 Next steps:");
  console.log("   1. Update your frontend application with the factory address");
  console.log("   2. Verify the contracts on Etherscan");
  console.log("   3. Test deployment functionality");
  console.log(`   4. Factory Address: ${factoryAddress}\n`);

  return {
    factoryAddress,
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

export { main as deployFactory };