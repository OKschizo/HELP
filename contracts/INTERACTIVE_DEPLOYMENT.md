# 🔐 Interactive Contract Deployment

This interactive deployment method prompts you for your private key at runtime, so you never have to store it in any files. This is the most secure way to deploy contracts.

## 🚀 Quick Start

```bash
cd packages/contracts
pnpm run deploy:interactive
```

## 📋 What It Does

The interactive deployment will:

1. **🌐 Ask you to select a network** (testnet or mainnet)
2. **🔑 Prompt for your private key** (input is hidden with asterisks)
3. **💼 Ask for platform configuration** (fee receiver and rate)
4. **✅ Confirm deployment details** before proceeding
5. **🚀 Deploy both contracts** (implementation + factory)
6. **💾 Save deployment info** to `deployments/` folder
7. **📋 Show you the contract addresses** to use in your frontend

## 🔒 Security Features

- ✅ **Private key never stored** - only exists in memory during deployment
- ✅ **Hidden input** - private key shown as asterisks while typing
- ✅ **Network validation** - ensures you're deploying to the right network
- ✅ **Balance check** - verifies you have enough ETH for deployment
- ✅ **Confirmation step** - shows all details before deploying

## 📝 Example Session

```
🚀 Interactive Contract Deployment
==================================================

📡 Available Networks:
1. HyperEVM Testnet (Chain ID: 998)
2. HyperEVM Mainnet (Chain ID: 999)

Select network (1 for testnet, 2 for mainnet): 1

📡 Selected: HyperEVM Testnet (Chain ID: 998)

🔑 Enter your deployment wallet private key (input will be hidden): ************************************************************

👤 Deployer Address: 0x1234567890123456789012345678901234567890
💰 Balance: 0.5 ETH

💼 Platform Configuration:
Platform fee receiver address (default: 0x1234567890123456789012345678901234567890): 
Platform fee in basis points (default: 250 = 2.5%): 

💰 Platform Fee: 2.5% to 0x1234567890123456789012345678901234567890

🚀 Ready to deploy? (y/N): y

============================================================
🚀 STARTING DEPLOYMENT
============================================================

📦 Deploying HyperLaunchERC721_ImplV2_Simple...
✅ Implementation deployed to: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef
📋 Transaction Hash: 0x1234567890abcdef...

🏭 Deploying HyperLaunch721FactoryV2...
✅ Factory deployed to: 0x0987654321098765432109876543210987654321
📋 Transaction Hash: 0xfedcba0987654321...

============================================================
🎉 DEPLOYMENT COMPLETE!
============================================================
📦 Implementation: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef
🏭 Factory: 0x0987654321098765432109876543210987654321
🌐 Network: HyperEVM Testnet (998)
👤 Deployer: 0x1234567890123456789012345678901234567890

📋 Contract Addresses for Frontend:
========================================
FACTORY_ADDRESS="0x0987654321098765432109876543210987654321"
IMPLEMENTATION_ADDRESS="0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef"
CHAIN_ID=998
```

## 🔧 After Deployment

1. **Copy the contract addresses** and update your frontend
2. **Verify the contracts** using the provided commands
3. **Test the deployment** through your application

## 🆘 Troubleshooting

**"Invalid private key format"**
- Ensure your private key is 64 hexadecimal characters
- Remove the `0x` prefix if present
- Example: `1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

**"Insufficient balance"**
- Make sure your deployment wallet has enough ETH for gas fees
- Testnet: Get free ETH from a faucet
- Mainnet: Transfer ETH to your deployment wallet

**"Network connection failed"**
- Check your internet connection
- The script uses public RPC endpoints that should work without configuration

## 🎯 Why Use Interactive Deployment?

- **🔐 Maximum Security**: Private key never touches disk
- **🎯 Simple**: No configuration files needed
- **🔍 Transparent**: See exactly what's happening at each step
- **✅ Safe**: Confirmation before deployment
- **📱 Portable**: Works on any machine with Node.js

This is the recommended way to deploy your contracts securely!
