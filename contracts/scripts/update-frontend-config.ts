import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

interface DeploymentInfo {
  network: {
    name: string;
    chainId: string;
  };
  contracts: {
    implementation?: {
      address: string;
    };
    factory?: {
      address: string;
    };
  };
  configuration?: {
    platformFeeReceiver: string;
    platformFeeBps: number;
  };
}

async function main() {
  console.log("🔄 Updating Frontend Configuration...\n");

  // Get network argument
  const networkArg = process.argv[2];
  if (!networkArg) {
    console.error("❌ Please specify a network: testnet or mainnet");
    console.error("Usage: npx hardhat run scripts/update-frontend-config.ts -- testnet");
    process.exit(1);
  }

  const chainId = networkArg === "mainnet" ? "999" : "998";
  console.log(`📡 Network: ${networkArg} (Chain ID: ${chainId})`);

  // Find deployment files
  const deploymentsDir = join(__dirname, "../deployments");
  if (!existsSync(deploymentsDir)) {
    throw new Error("No deployments directory found. Please deploy contracts first.");
  }

  const files = require("fs").readdirSync(deploymentsDir)
    .filter((f: string) => f.includes(`-${chainId}-`))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error(`No deployment files found for chain ID ${chainId}`);
  }

  // Find latest factory deployment
  let factoryDeployment: DeploymentInfo | null = null;
  let implementationAddress: string | null = null;

  for (const file of files) {
    const filepath = join(deploymentsDir, file);
    const deployment: DeploymentInfo = JSON.parse(readFileSync(filepath, "utf8"));
    
    if (file.startsWith("factory-") && !factoryDeployment) {
      factoryDeployment = deployment;
    }
    
    // Get implementation address from either factory or implementation deployment
    if (deployment.contracts.implementation?.address && !implementationAddress) {
      implementationAddress = deployment.contracts.implementation.address;
    }
  }

  if (!factoryDeployment?.contracts.factory) {
    throw new Error(`No factory deployment found for chain ID ${chainId}`);
  }

  if (!implementationAddress) {
    throw new Error(`No implementation address found for chain ID ${chainId}`);
  }

  const factoryAddress = factoryDeployment.contracts.factory.address;

  console.log("📋 Found deployments:");
  console.log(`   Factory: ${factoryAddress}`);
  console.log(`   Implementation: ${implementationAddress}`);
  console.log();

  // Update frontend contracts.ts file
  const contractsPath = join(__dirname, "../../apps/interface/lib/contracts.ts");
  
  if (!existsSync(contractsPath)) {
    throw new Error(`Frontend contracts file not found: ${contractsPath}`);
  }

  let contractsContent = readFileSync(contractsPath, "utf8");

  // Update FACTORY_ADDRESS
  const factoryAddressRegex = /export const FACTORY_ADDRESS = ['"`]0x[a-fA-F0-9]{40}['"`]/;
  const newFactoryLine = `export const FACTORY_ADDRESS = '${factoryAddress}'`;
  
  if (factoryAddressRegex.test(contractsContent)) {
    contractsContent = contractsContent.replace(factoryAddressRegex, newFactoryLine);
    console.log("✅ Updated FACTORY_ADDRESS");
  } else {
    // If pattern not found, try the TODO version
    const todoFactoryRegex = /export const FACTORY_ADDRESS = ['"`]0x0+['"`].*?TODO.*$/m;
    if (todoFactoryRegex.test(contractsContent)) {
      contractsContent = contractsContent.replace(todoFactoryRegex, newFactoryLine);
      console.log("✅ Updated FACTORY_ADDRESS (from TODO)");
    } else {
      console.log("⚠️  Could not find FACTORY_ADDRESS to update");
    }
  }

  // Write updated content
  writeFileSync(contractsPath, contractsContent);

  // Create/update deployment config file for the frontend
  const frontendConfigPath = join(__dirname, "../../apps/interface/lib/deployment-config.json");
  const deploymentConfig = {
    [chainId]: {
      network: factoryDeployment.network.name,
      chainId: parseInt(chainId),
      contracts: {
        factory: factoryAddress,
        implementation: implementationAddress
      },
      configuration: factoryDeployment.configuration,
      lastUpdated: new Date().toISOString()
    }
  };

  // Merge with existing config if it exists
  let existingConfig = {};
  if (existsSync(frontendConfigPath)) {
    try {
      existingConfig = JSON.parse(readFileSync(frontendConfigPath, "utf8"));
    } catch (error) {
      console.log("⚠️  Could not parse existing deployment config, creating new one");
    }
  }

  const mergedConfig = { ...existingConfig, ...deploymentConfig };
  writeFileSync(frontendConfigPath, JSON.stringify(mergedConfig, null, 2));

  console.log(`💾 Updated deployment config: ${frontendConfigPath}`);

  // Create environment variables file for easy copying
  const envVarsPath = join(__dirname, "../frontend-env-vars.txt");
  const envVars = `# Add these to your frontend environment variables
NEXT_PUBLIC_FACTORY_ADDRESS="${factoryAddress}"
NEXT_PUBLIC_IMPLEMENTATION_ADDRESS="${implementationAddress}"
NEXT_PUBLIC_CHAIN_ID="${chainId}"
NEXT_PUBLIC_NETWORK="${factoryDeployment.network.name}"

# Platform Configuration
NEXT_PUBLIC_PLATFORM_FEE_RECEIVER="${factoryDeployment.configuration?.platformFeeReceiver || ''}"
NEXT_PUBLIC_PLATFORM_FEE_BPS="${factoryDeployment.configuration?.platformFeeBps || 0}"
`;

  writeFileSync(envVarsPath, envVars);
  console.log(`📝 Created environment variables file: ${envVarsPath}`);

  console.log("\n" + "=" .repeat(60));
  console.log("🎉 FRONTEND CONFIGURATION UPDATED!");
  console.log("=" .repeat(60));
  console.log(`📦 Factory Address: ${factoryAddress}`);
  console.log(`🔧 Implementation Address: ${implementationAddress}`);
  console.log(`🌐 Network: ${factoryDeployment.network.name} (${chainId})`);
  
  console.log("\n📋 Next Steps:");
  console.log("1. ✅ Frontend contracts.ts updated");
  console.log("2. ✅ Deployment config created");
  console.log("3. ✅ Environment variables file created");
  console.log("4. 🔄 Restart your frontend development server");
  console.log("5. 🧪 Test contract deployment through your UI");

  if (factoryDeployment.configuration) {
    console.log("\n💰 Platform Configuration:");
    console.log(`   Fee Receiver: ${factoryDeployment.configuration.platformFeeReceiver}`);
    console.log(`   Fee Rate: ${factoryDeployment.configuration.platformFeeBps / 100}%`);
  }
}

// Execute update
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Frontend config update failed:", error);
      process.exit(1);
    });
}

export { main as updateFrontendConfig };
