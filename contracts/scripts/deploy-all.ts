import { deployImplementation } from "./deploy-implementation";
import { deployFactory } from "./deploy-factory";

async function main() {
  console.log("🚀 Starting Complete Deployment Process...\n");
  console.log("=" .repeat(60));
  
  try {
    // Step 1: Deploy Implementation
    console.log("STEP 1: Deploying Implementation Contract");
    console.log("=" .repeat(60));
    const { implementationAddress } = await deployImplementation();
    
    console.log("\n" + "=" .repeat(60));
    console.log("STEP 2: Deploying Factory Contract");
    console.log("=" .repeat(60));
    
    // Step 2: Deploy Factory (will automatically use the implementation we just deployed)
    const { factoryAddress, deploymentInfo } = await deployFactory();
    
    console.log("\n" + "=" .repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=" .repeat(60));
    console.log(`📦 Implementation: ${implementationAddress}`);
    console.log(`🏭 Factory: ${factoryAddress}`);
    console.log(`🌐 Network: ${deploymentInfo.network.name} (${deploymentInfo.network.chainId})`);
    console.log(`👤 Deployer: ${deploymentInfo.deployer}`);
    console.log(`📅 Timestamp: ${deploymentInfo.timestamp}`);
    
    console.log("\n📋 Contract Addresses for Frontend:");
    console.log("=" .repeat(40));
    console.log(`FACTORY_ADDRESS="${factoryAddress}"`);
    console.log(`IMPLEMENTATION_ADDRESS="${implementationAddress}"`);
    console.log(`CHAIN_ID=${deploymentInfo.network.chainId}`);
    
    return {
      implementationAddress,
      factoryAddress,
      deploymentInfo
    };
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ All deployments completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Deployment process failed:", error);
      process.exit(1);
    });
}

export { main as deployAll };
