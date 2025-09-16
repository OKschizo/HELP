import { ethers } from "hardhat";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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

async function verifyContract(
  networkName: string,
  contractAddress: string,
  constructorArgs: string[] = []
): Promise<boolean> {
  try {
    console.log(`🔍 Verifying contract at ${contractAddress}...`);
    
    const argsString = constructorArgs.length > 0 
      ? ` ${constructorArgs.map(arg => `"${arg}"`).join(" ")}`
      : "";
    
    const command = `npx hardhat verify --network ${networkName} ${contractAddress}${argsString}`;
    console.log(`   Command: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes("Already Verified")) {
      console.log(`   ⚠️  Warning: ${stderr}`);
    }
    
    if (stdout.includes("Successfully verified") || stdout.includes("Already Verified")) {
      console.log(`   ✅ Contract verified successfully`);
      return true;
    } else {
      console.log(`   ❌ Verification failed: ${stdout}`);
      return false;
    }
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ✅ Contract already verified`);
      return true;
    }
    console.log(`   ❌ Verification error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🔍 Starting Contract Verification...\n");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

  // Find deployment files
  const deploymentsDir = join(__dirname, "../deployments");
  if (!existsSync(deploymentsDir)) {
    throw new Error("No deployments directory found. Please deploy contracts first.");
  }

  const files = require("fs").readdirSync(deploymentsDir)
    .filter((f: string) => f.includes(`-${network.chainId}-`))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error(`No deployment files found for chain ID ${network.chainId}`);
  }

  // Find latest factory and implementation deployments
  let factoryDeployment: DeploymentInfo | null = null;
  let implementationDeployment: DeploymentInfo | null = null;

  for (const file of files) {
    const filepath = join(deploymentsDir, file);
    const deployment: DeploymentInfo = JSON.parse(readFileSync(filepath, "utf8"));
    
    if (file.startsWith("factory-") && !factoryDeployment) {
      factoryDeployment = deployment;
    }
    if (file.startsWith("implementation-") && !implementationDeployment) {
      implementationDeployment = deployment;
    }
  }

  console.log("📋 Found deployments:");
  if (implementationDeployment?.contracts.implementation) {
    console.log(`   Implementation: ${implementationDeployment.contracts.implementation.address}`);
  }
  if (factoryDeployment?.contracts.factory) {
    console.log(`   Factory: ${factoryDeployment.contracts.factory.address}`);
  }
  console.log();

  let verificationResults: { contract: string; success: boolean }[] = [];

  // Verify Implementation Contract
  if (implementationDeployment?.contracts.implementation) {
    const success = await verifyContract(
      network.name,
      implementationDeployment.contracts.implementation.address
    );
    verificationResults.push({
      contract: "Implementation",
      success
    });
  }

  // Verify Factory Contract
  if (factoryDeployment?.contracts.factory && factoryDeployment.configuration) {
    const implementationAddress = factoryDeployment.contracts.implementation?.address ||
      implementationDeployment?.contracts.implementation?.address;
    
    if (!implementationAddress) {
      console.log("❌ Cannot verify factory: implementation address not found");
    } else {
      const success = await verifyContract(
        network.name,
        factoryDeployment.contracts.factory.address,
        [
          implementationAddress,
          factoryDeployment.configuration.platformFeeReceiver,
          factoryDeployment.configuration.platformFeeBps.toString()
        ]
      );
      verificationResults.push({
        contract: "Factory",
        success
      });
    }
  }

  // Summary
  console.log("\n" + "=" .repeat(50));
  console.log("📊 VERIFICATION SUMMARY");
  console.log("=" .repeat(50));
  
  for (const result of verificationResults) {
    const status = result.success ? "✅ VERIFIED" : "❌ FAILED";
    console.log(`${result.contract}: ${status}`);
  }

  const allSuccessful = verificationResults.every(r => r.success);
  
  if (allSuccessful) {
    console.log("\n🎉 All contracts verified successfully!");
  } else {
    console.log("\n⚠️  Some contracts failed verification. Check the logs above.");
  }

  return verificationResults;
}

// Execute verification
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Verification failed:", error);
      process.exit(1);
    });
}

export { main as verifyContracts };
