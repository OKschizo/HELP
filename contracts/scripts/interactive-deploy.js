const { ethers } = require("ethers");
const { writeFileSync, existsSync, mkdirSync, readFileSync } = require("fs");
const { join } = require("path");
const readline = require("readline");

// Import contract artifacts directly
const HyperLaunchERC721_ImplV2_Simple = JSON.parse(
  readFileSync(join(__dirname, "../artifacts/contracts/HyperLaunchERC721_ImplV2_Simple.sol/HyperLaunchERC721_ImplV2_Simple.json"), "utf8")
);

const HyperLaunch721FactoryV2 = JSON.parse(
  readFileSync(join(__dirname, "../artifacts/contracts/HyperLaunch721FactoryV2.sol/HyperLaunch721FactoryV2.json"), "utf8")
);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Function to prompt for private key (hidden input)
function promptPrivateKey() {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write("🔑 Enter your deployment wallet private key (input will be hidden): ");
    
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let privateKey = '';
    
    stdin.on('data', (key) => {
      // Handle different key presses
      if (key === '\u0003') { // Ctrl+C
        process.exit();
      } else if (key === '\r' || key === '\n') { // Enter
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write('\n');
        resolve(privateKey);
      } else if (key === '\u007f') { // Backspace
        if (privateKey.length > 0) {
          privateKey = privateKey.slice(0, -1);
          stdout.write('\b \b');
        }
      } else {
        // Add character and show asterisk
        privateKey += key;
        stdout.write('*');
      }
    });
  });
}

// Validate private key format
function validatePrivateKey(key) {
  // Remove 0x prefix if present
  const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
  
  // Check if it's 64 hex characters
  if (cleanKey.length !== 64) {
    return false;
  }
  
  // Check if it's valid hex
  return /^[0-9a-fA-F]{64}$/.test(cleanKey);
}

// Clean private key (remove 0x prefix)
function cleanPrivateKey(key) {
  return key.startsWith('0x') ? key.slice(2) : key;
}

async function deployImplementation(wallet) {
  console.log("\n📦 Deploying HyperLaunchERC721_ImplV2_Simple...");
  
  const ImplementationFactory = new ethers.ContractFactory(
    HyperLaunchERC721_ImplV2_Simple.abi,
    HyperLaunchERC721_ImplV2_Simple.bytecode,
    wallet
  );
  
  const implementation = await ImplementationFactory.deploy();
  await implementation.waitForDeployment();
  const implementationAddress = await implementation.getAddress();
  
  console.log(`✅ Implementation deployed to: ${implementationAddress}`);
  
  const deployTx = implementation.deploymentTransaction();
  if (deployTx) {
    console.log(`📋 Transaction Hash: ${deployTx.hash}`);
  }
  
  return { implementationAddress, deployTx };
}

async function deployFactory(wallet, implementationAddress, config) {
  console.log("\n🏭 Deploying HyperLaunch721FactoryV2...");
  
  const FactoryFactory = new ethers.ContractFactory(
    HyperLaunch721FactoryV2.abi,
    HyperLaunch721FactoryV2.bytecode,
    wallet
  );
  
  const factory = await FactoryFactory.deploy(
    implementationAddress,
    config.platformFeeReceiver,
    config.platformFeeBps
  );
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log(`✅ Factory deployed to: ${factoryAddress}`);
  
  const deployTx = factory.deploymentTransaction();
  if (deployTx) {
    console.log(`📋 Transaction Hash: ${deployTx.hash}`);
  }
  
  return { factoryAddress, deployTx };
}

async function main() {
  console.log("🚀 Interactive Contract Deployment\n");
  console.log("=".repeat(50));
  
  try {
    // Get network selection
    console.log("📡 Available Networks:");
    console.log("1. HyperEVM Testnet (Chain ID: 998)");
    console.log("2. HyperEVM Mainnet (Chain ID: 999)");
    
    const networkChoice = await prompt("\nSelect network (1 for testnet, 2 for mainnet): ");
    
    let networkName;
    let rpcUrl;
    let chainId;
    
    if (networkChoice === "1") {
      networkName = "HyperEVM Testnet";
      rpcUrl = "https://rpc.hyperliquid-testnet.xyz/evm";
      chainId = 998;
    } else if (networkChoice === "2") {
      networkName = "HyperEVM Mainnet";
      rpcUrl = "https://rpc.hyperliquid.xyz/evm";
      chainId = 999;
    } else {
      throw new Error("Invalid network selection");
    }
    
    console.log(`\n📡 Selected: ${networkName} (Chain ID: ${chainId})`);
    
    // Get private key
    let privateKey;
    let isValidKey = false;
    
    while (!isValidKey) {
      privateKey = await promptPrivateKey();
      
      if (validatePrivateKey(privateKey)) {
        isValidKey = true;
        privateKey = cleanPrivateKey(privateKey);
      } else {
        console.log("❌ Invalid private key format. Please enter a 64-character hexadecimal private key.");
        console.log("   Example: 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      }
    }
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`\n👤 Deployer Address: ${wallet.address}`);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance === 0n) {
      throw new Error("Insufficient balance. Please fund your deployment wallet.");
    }
    
    // Get platform configuration
    console.log("\n💼 Platform Configuration:");
    const defaultFeeReceiver = wallet.address;
    const feeReceiver = await prompt(`Platform fee receiver address (default: ${defaultFeeReceiver}): `) || defaultFeeReceiver;
    const feeBpsInput = await prompt("Platform fee in basis points (default: 250 = 2.5%): ") || "250";
    const platformFeeBps = parseInt(feeBpsInput);
    
    if (platformFeeBps > 1000) {
      throw new Error("Platform fee cannot exceed 1000 basis points (10%)");
    }
    
    const config = {
      platformFeeReceiver: feeReceiver,
      platformFeeBps: platformFeeBps
    };
    
    console.log(`\n💰 Platform Fee: ${platformFeeBps / 100}% to ${feeReceiver}`);
    
    // Confirm deployment
    const confirm = await prompt("\n🚀 Ready to deploy? (y/N): ");
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log("❌ Deployment cancelled.");
      rl.close();
      return;
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("🚀 STARTING DEPLOYMENT");
    console.log("=".repeat(60));
    
    // Deploy Implementation
    const { implementationAddress, deployTx: implTx } = await deployImplementation(wallet);
    
    // Deploy Factory
    const { factoryAddress, deployTx: factoryTx } = await deployFactory(wallet, implementationAddress, config);
    
    // Save deployment info
    const deploymentInfo = {
      network: {
        name: networkName,
        chainId: chainId.toString(),
        rpcUrl: rpcUrl
      },
      deployer: wallet.address,
      contracts: {
        implementation: {
          address: implementationAddress,
          transactionHash: implTx?.hash || "unknown"
        },
        factory: {
          address: factoryAddress,
          transactionHash: factoryTx?.hash || "unknown"
        }
      },
      configuration: config,
      timestamp: new Date().toISOString(),
      blockNumber: await provider.getBlockNumber()
    };
    
    // Ensure deployments directory exists
    const deploymentsDir = join(__dirname, "../deployments");
    if (!existsSync(deploymentsDir)) {
      mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save to file
    const filename = `interactive-deployment-${chainId}-${Date.now()}.json`;
    const filepath = join(deploymentsDir, filename);
    writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log(`📦 Implementation: ${implementationAddress}`);
    console.log(`🏭 Factory: ${factoryAddress}`);
    console.log(`🌐 Network: ${networkName} (${chainId})`);
    console.log(`👤 Deployer: ${wallet.address}`);
    console.log(`💾 Deployment info saved to: ${filepath}`);
    
    console.log("\n📋 Contract Addresses for Frontend:");
    console.log("=".repeat(40));
    console.log(`FACTORY_ADDRESS="${factoryAddress}"`);
    console.log(`IMPLEMENTATION_ADDRESS="${implementationAddress}"`);
    console.log(`CHAIN_ID=${chainId}`);
    
    console.log("\n🔍 Verification Commands:");
    const networkFlag = chainId === 998 ? "hyperevmTestnet" : "hyperevm";
    console.log(`npx hardhat verify --network ${networkFlag} ${implementationAddress}`);
    console.log(`npx hardhat verify --network ${networkFlag} ${factoryAddress} "${implementationAddress}" "${config.platformFeeReceiver}" ${config.platformFeeBps}`);
    
    rl.close();
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    rl.close();
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Interactive deployment completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Interactive deployment failed:", error);
      process.exit(1);
    });
}
