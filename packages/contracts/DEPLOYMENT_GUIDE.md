# 🚀 HyperLaunch Contract Deployment Guide

This guide will help you securely deploy the HyperLaunch contracts without exposing your private keys to the main application.

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **pnpm** package manager
3. **A dedicated deployment wallet** with sufficient funds
4. **Private key** of the deployment wallet (NEVER use your main wallet)

## 🔧 Setup

### 1. Install Dependencies

```bash
cd packages/contracts
pnpm install
```

### 2. Configure Environment

Copy the environment template and fill in your values:

```bash
cp env.example .env
```

Edit `.env` and add your deployment private key:

```env
# CRITICAL: Use a dedicated deployment wallet with minimal funds
DEPLOYER_KEY=your_private_key_here_without_0x_prefix

# Optional: Platform configuration
PLATFORM_FEE_RECEIVER=0x1234567890123456789012345678901234567890
PLATFORM_FEE_BPS=250
```

### 3. Configure Deployment Parameters (Optional)

Copy and customize the deployment configuration:

```bash
cp deploy-config.json.example deploy-config.json
```

Edit `deploy-config.json`:

```json
{
  "platformFeeReceiver": "0x1234567890123456789012345678901234567890",
  "platformFeeBps": 250,
  "implementationAddress": ""
}
```

**Parameters:**
- `platformFeeReceiver`: Address that receives platform fees
- `platformFeeBps`: Platform fee in basis points (250 = 2.5%)
- `implementationAddress`: Leave empty for new deployments

## 🚀 Deployment

### Quick Deployment (Recommended)

Deploy both contracts in one command:

```bash
# Testnet
pnpm run deploy:testnet

# Mainnet
pnpm run deploy:mainnet
```

### Step-by-Step Deployment

If you prefer to deploy contracts separately:

```bash
# 1. Deploy Implementation Contract
pnpm run deploy:implementation --network hyperevmTestnet

# 2. Deploy Factory Contract (uses implementation from step 1)
pnpm run deploy:factory --network hyperevmTestnet
```

### Available Networks

- `hyperevmTestnet` - HyperEVM Testnet (Chain ID: 998)
- `hyperevm` - HyperEVM Mainnet (Chain ID: 999)

## 📊 Deployment Output

After successful deployment, you'll see:

```
🎉 DEPLOYMENT COMPLETE!
============================================================
📦 Implementation: 0x1234567890123456789012345678901234567890
🏭 Factory: 0x0987654321098765432109876543210987654321
🌐 Network: hyperevmTestnet (998)
👤 Deployer: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef
📅 Timestamp: 2024-01-01T12:00:00.000Z

📋 Contract Addresses for Frontend:
========================================
FACTORY_ADDRESS="0x0987654321098765432109876543210987654321"
IMPLEMENTATION_ADDRESS="0x1234567890123456789012345678901234567890"
CHAIN_ID=998
```

## 🔍 Contract Verification

Verify your contracts on the block explorer:

```bash
# Verify all deployed contracts
pnpm run verify:testnet  # or verify:mainnet

# Or verify manually
npx hardhat verify --network hyperevmTestnet 0x1234567890123456789012345678901234567890
```

## 📁 Deployment Files

All deployment information is saved in the `deployments/` directory:

```
deployments/
├── implementation-998-1704110400000.json
└── factory-998-1704110401000.json
```

Each file contains:
- Contract addresses
- Transaction hashes
- Deployment configuration
- Network information
- Timestamp and block number

## 🔐 Security Best Practices

### 1. Dedicated Deployment Wallet
- **NEVER** use your main wallet for deployments
- Create a separate wallet specifically for contract deployment
- Fund it with only the amount needed for deployment

### 2. Private Key Management
- Store private keys in `.env` files (never commit to git)
- Use hardware wallets for mainnet deployments when possible
- Consider using deployment services like Defender for production

### 3. Environment Separation
- Always test on testnet first
- Use different wallets for testnet and mainnet
- Verify contract addresses before updating frontend

### 4. Post-Deployment
- Immediately verify contracts on block explorer
- Test factory functionality before going live
- Update frontend configuration with new addresses

## 🔧 Updating Your Frontend Application

After successful deployment, update your frontend with the new contract addresses:

### 1. Update Contract Addresses

In your frontend application, update the contract addresses:

```typescript
// apps/interface/lib/contracts.ts
export const CONTRACTS = {
  FACTORY_ADDRESS: "0x0987654321098765432109876543210987654321",
  IMPLEMENTATION_ADDRESS: "0x1234567890123456789012345678901234567890",
  CHAIN_ID: 998
};
```

### 2. Update ABI Files

If you've made contract changes, sync the ABIs:

```bash
# From project root
pnpm run sync-abis
```

### 3. Test Integration

Before going live:
1. Test contract deployment through your frontend
2. Verify minting functionality
3. Test withdrawal mechanisms
4. Confirm platform fee collection

## 🆘 Troubleshooting

### Common Issues

**1. "Cannot find type definition file for 'node'"**
```bash
pnpm add -D @types/node
```

**2. "Insufficient funds for gas"**
- Ensure your deployment wallet has enough ETH
- Check gas prices and adjust if necessary

**3. "Contract verification failed"**
- Wait a few minutes and try again
- Ensure you're using the correct constructor arguments
- Check if the contract is already verified

**4. "Implementation address not found"**
- Deploy the implementation contract first
- Check the deployments/ directory for previous deployments
- Manually specify the implementation address in deploy-config.json

### Getting Help

1. Check deployment logs in the console
2. Review deployment files in `deployments/` directory
3. Verify network configuration in `hardhat.config.cjs`
4. Ensure `.env` file is properly configured

## 📝 Example Deployment Flow

Here's a complete example deployment:

```bash
# 1. Setup
cd packages/contracts
cp env.example .env
# Edit .env with your private key

# 2. Deploy to testnet
pnpm run deploy:testnet

# 3. Verify contracts
pnpm run verify:testnet

# 4. Update frontend with new addresses
# Copy addresses from deployment output

# 5. Test functionality
# Use your frontend to test contract deployment

# 6. Deploy to mainnet (when ready)
pnpm run deploy:mainnet
pnpm run verify:mainnet
```

## 🎯 Next Steps

After successful deployment:

1. ✅ Verify contracts on block explorer
2. ✅ Update frontend configuration
3. ✅ Test end-to-end functionality
4. ✅ Monitor platform fee collection
5. ✅ Set up monitoring and alerts
6. ✅ Document contract addresses for your team

---

**⚠️ Important:** Always test thoroughly on testnet before mainnet deployment!
