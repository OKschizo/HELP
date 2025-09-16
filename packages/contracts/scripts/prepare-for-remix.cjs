const fs = require('fs');
const path = require('path');

function prepareContractsForRemix() {
  console.log('🎨 Preparing contracts for Remix IDE deployment...\n');
  
  const contractsDir = path.join(__dirname, '../contracts');
  const outputDir = path.join(__dirname, '../remix-contracts');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Contract files to copy (ONLY optimized versions)
  const contracts = [
    'HyperLaunchERC721_ImplV2_Optimized.sol',
    'HyperLaunch721FactoryV2_Optimized.sol'
  ];
  
  console.log('📁 Copying contract files...');
  
  contracts.forEach(contractFile => {
    const sourcePath = path.join(contractsDir, contractFile);
    const destPath = path.join(outputDir, contractFile);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied: ${contractFile}`);
    } else {
      console.log(`❌ Not found: ${contractFile}`);
    }
  });
  
  // Create deployment parameters file
  const deploymentParams = {
    compiler: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "paris",
        viaIR: true
      }
    },
    networks: {
      hyperevmTestnet: {
        name: "HyperEVM Testnet",
        rpcUrl: "https://rpc.hyperliquid-testnet.xyz/evm",
        chainId: 998,
        explorer: "https://explorer.hyperliquid-testnet.xyz"
      },
      hyperevmMainnet: {
        name: "HyperEVM Mainnet", 
        rpcUrl: "https://rpc.hyperliquid.xyz/evm",
        chainId: 999,
        explorer: "https://explorer.hyperliquid.xyz"
      }
    },
    deploymentOrder: [
      {
        step: 1,
        contract: "HyperLaunchERC721_ImplV2_Optimized",
        constructorParams: [],
        description: "Deploy implementation contract (stack-depth optimized)"
      },
      {
        step: 2,
        contract: "HyperLaunch721FactoryV2_Optimized",
        constructorParams: [
          {
            name: "impl",
            type: "address",
            description: "Implementation contract address from step 1",
            example: "0x1234567890123456789012345678901234567890"
          },
          {
            name: "feeReceiver", 
            type: "address",
            description: "Platform fee receiver (usually your wallet)",
            example: "0x1234567890123456789012345678901234567890"
          },
          {
            name: "feeBps",
            type: "uint96", 
            description: "Platform fee in basis points (250 = 2.5%)",
            example: "250"
          }
        ],
        description: "Deploy factory contract with implementation address"
      }
    ],
    gasLimits: {
      HyperLaunchERC721_ImplV2_Optimized: 6000000,
      HyperLaunch721FactoryV2_Optimized: 3000000
    },
    stackTooDeepFix: {
      enabled: true,
      solution: "Use HyperLaunchERC721_ImplV2_Optimized.sol with Via IR compilation",
      viaIR: true,
      optimization: true
    }
  };
  
  const paramsPath = path.join(outputDir, 'deployment-params.json');
  fs.writeFileSync(paramsPath, JSON.stringify(deploymentParams, null, 2));
  console.log('✅ Created: deployment-params.json');
  
  // Create README for Remix
  const remixReadme = `# Remix Deployment Files

## 📁 Files in this directory:
- \`HyperLaunchERC721_ImplV2_Simple.sol\` - Implementation contract
- \`HyperLaunch721FactoryV2.sol\` - Factory contract  
- \`deployment-params.json\` - Deployment configuration

## 🚀 Quick Remix Setup:

1. **Open Remix**: https://remix.ethereum.org
2. **Upload these files** to a new workspace
3. **Compiler settings**:
   - Version: 0.8.20+
   - Optimization: Enabled (200 runs)
   - EVM Version: paris
   - Via IR: true

4. **Deploy order**:
   1. Deploy \`HyperLaunchERC721_ImplV2_Simple\` (no parameters)
   2. Deploy \`HyperLaunch721FactoryV2\` (use implementation address from step 1)

## 🔗 Network Settings:
See \`deployment-params.json\` for complete network configuration.

## 📖 Full Guide:
See \`../REMIX_DEPLOYMENT.md\` for detailed instructions.
`;
  
  const readmePath = path.join(outputDir, 'README.md');
  fs.writeFileSync(readmePath, remixReadme);
  console.log('✅ Created: README.md');
  
  console.log('\n🎉 Remix preparation complete!');
  console.log('📂 Files ready in: remix-contracts/');
  console.log('\n📋 Next steps:');
  console.log('1. Open https://remix.ethereum.org');
  console.log('2. Upload files from remix-contracts/ folder');
  console.log('3. Follow REMIX_DEPLOYMENT.md guide');
  console.log('4. Deploy contracts step by step');
  
  return outputDir;
}

// Run if called directly
if (require.main === module) {
  prepareContractsForRemix();
}

module.exports = { prepareContractsForRemix };
