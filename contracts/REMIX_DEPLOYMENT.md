# 🎨 Remix IDE Contract Deployment Guide

Deploy your HyperLaunch contracts using Remix IDE - a visual, browser-based approach that's perfect for handling gas optimization and deployment issues.

## 🚀 Quick Start

1. **Open Remix IDE**: https://remix.ethereum.org
2. **Upload contracts** (see instructions below)
3. **Compile with optimization**
4. **Connect MetaMask**
5. **Deploy step-by-step**

## 📁 Step 1: Prepare Contract Files

### Method A: Upload Individual Files

1. In Remix, create a new workspace
2. Create the following files and copy the content:

**🚀 RECOMMENDED - Optimized Contracts:**
- `HyperLaunchERC721_ImplV2_Optimized.sol` - Stack-depth optimized implementation
- `HyperLaunch721FactoryV2_Optimized.sol` - Stack-depth optimized factory

**📦 Alternative - Original Contracts:**
- `HyperLaunchERC721_ImplV2_Simple.sol` - Original implementation (requires Via IR)
- `HyperLaunch721FactoryV2.sol` - Original factory (may have stack issues)

### Method B: Import from GitHub (if available)
```
https://github.com/your-repo/hyperlaunch/blob/main/packages/contracts/contracts/
```

## ⚙️ Step 2: Compiler Settings (CRITICAL for Stack Too Deep Fix)

1. **Go to Solidity Compiler tab** (📄 icon)
2. **Set compiler version**: `0.8.20` or higher
3. **Enable optimization**: 
   - ✅ Check "Enable optimization"
   - Runs: `200` (for deployment) or `1000` (for runtime efficiency)
4. **🚨 CRITICAL: Advanced settings**:
   - ✅ EVM Version: `paris` (important for HyperEVM compatibility)
   - ✅ **Via IR: `true`** (REQUIRED - fixes stack too deep errors)

```json
{
  "optimizer": {
    "enabled": true,
    "runs": 200
  },
  "evmVersion": "paris",
  "viaIR": true
}
```

### 🔧 How to Enable Via IR in Remix:
1. Click the **"Advanced Configurations"** button
2. Scroll down to **"Via IR"**
3. ✅ **Check the "Via IR" checkbox**
4. Click **"Compile"**

**Why Via IR is Required:**
- Fixes "Stack too deep" errors in the `initialize` function
- Optimizes stack usage for complex upgradeable contracts
- Required for contracts with many parameters (like ours)

## 🔗 Step 3: Connect to HyperEVM

1. **Go to Deploy & Run tab** (🚀 icon)
2. **Environment**: Select "Injected Provider - MetaMask"
3. **Add HyperEVM Network to MetaMask**:

### HyperEVM Mainnet
```
Network Name: HyperEVM
RPC URL: https://rpc.hyperliquid.xyz/evm
Chain ID: 999
Currency Symbol: ETH
Block Explorer: https://explorer.hyperliquid.xyz
```

### HyperEVM Testnet  
```
Network Name: HyperEVM Testnet
RPC URL: https://rpc.hyperliquid-testnet.xyz/evm
Chain ID: 998
Currency Symbol: ETH
Block Explorer: https://explorer.hyperliquid-testnet.xyz
```

4. **Switch MetaMask** to HyperEVM network
5. **Connect your wallet** in Remix

## 📦 Step 4: Deploy Implementation Contract

### 🚀 Option A: Optimized Implementation (RECOMMENDED)
1. **Select contract**: `HyperLaunchERC721_ImplV2_Optimized`
2. **Check gas estimate** (should be lower than original)
3. **Deploy**:
   - No constructor parameters needed
   - Click "Deploy"
   - Confirm in MetaMask
4. **Save the address** - you'll need it for the factory

### 📦 Option B: Original Implementation
1. **Select contract**: `HyperLaunchERC721_ImplV2_Simple`
2. **⚠️ ENSURE Via IR is enabled** (see Step 2)
3. **Deploy** (same as Option A)

## 🏭 Step 5: Deploy Factory Contract

### 🚀 Option A: Optimized Factory (RECOMMENDED)
1. **Select contract**: `HyperLaunch721FactoryV2_Optimized`
2. **Constructor parameters**:
   ```
   impl: 0x[IMPLEMENTATION_ADDRESS_FROM_STEP_4]
   feeReceiver: 0x[YOUR_WALLET_ADDRESS]
   feeBps: 250
   ```
3. **Deploy**:
   - Enter the parameters
   - Click "Deploy"  
   - Confirm in MetaMask
4. **Save the factory address**

### 📦 Option B: Original Factory
1. **Select contract**: `HyperLaunch721FactoryV2`
2. **⚠️ May have stack depth issues** - use optimized version instead
3. **Deploy** (same parameters as Option A)

## 🔍 Step 6: Verify Deployment

1. **Test the factory contract**:
   - Expand the deployed factory contract
   - Call `implementation()` - should return step 4 address
   - Call `owner()` - should return your address
   - Call `platformFeeReceiver()` - should return your address
   - Call `platformFeeBps()` - should return 250

## 📋 Step 7: Get Contract Addresses

After successful deployment, you'll have:

```
Implementation: 0x[ADDRESS_FROM_STEP_4]
Factory: 0x[ADDRESS_FROM_STEP_5]
Network: HyperEVM (999) or HyperEVM Testnet (998)
```

## 🔧 Troubleshooting

### 🚨 Stack Too Deep Error (Most Common Issue)
**Error**: `CompilerError: Stack too deep when compiling inline assembly`

**Solutions** (in order of preference):
1. **✅ Enable Via IR** (REQUIRED - see Step 2 above)
2. **Use the optimized contract**: `HyperLaunchERC721_ImplV2_Optimized.sol`
3. **Increase optimization runs** to 1000+
4. **Check Advanced Configurations** are properly set

**How to Fix in Remix**:
```
1. Solidity Compiler → Advanced Configurations
2. ✅ Check "Via IR" 
3. ✅ Enable optimization (runs: 200-1000)
4. ✅ EVM Version: paris
5. Recompile
```

### Gas Limit Issues
- **Increase gas limit** in MetaMask manually
- **Enable optimization** with higher runs (1000+)
- **Use Via IR** compilation
- **Deploy on testnet first**

### Compilation Errors
- **Check Solidity version** (0.8.20+)
- **Enable Via IR** for complex contracts
- **Import missing dependencies**
- **Use optimized contract version** if available

### Network Issues
- **Verify RPC URLs** are correct
- **Check MetaMask network** settings
- **Ensure sufficient balance**

### Contract Size Issues
If contracts are too large:
1. **Enable Via IR compilation** (most important)
2. **Increase optimization runs** to 1000+
3. **Use optimized contract versions**
4. **Remove unused imports**

### 🎯 Quick Fix Checklist
If deployment fails:
- [ ] Via IR enabled?
- [ ] Optimization enabled?
- [ ] EVM version set to "paris"?
- [ ] Using optimized contract version?
- [ ] Sufficient gas limit?
- [ ] Correct network selected?

## 🎯 Advantages of Remix Deployment

- ✅ **Visual gas estimation** before deployment
- ✅ **Easy optimization settings**
- ✅ **Built-in contract interaction**
- ✅ **No local environment needed**
- ✅ **Direct MetaMask integration**
- ✅ **Contract verification tools**
- ✅ **Gas limit control**

## 📝 After Deployment

1. **Update your frontend** with the new contract addresses
2. **Verify contracts** on block explorer
3. **Test functionality** through Remix interface
4. **Document the addresses** for your team

## 🔐 Security Notes

- ✅ **Use dedicated deployment wallet**
- ✅ **Test on testnet first**
- ✅ **Verify all addresses** before mainnet
- ✅ **Keep private keys secure**
- ✅ **Double-check constructor parameters**

This method gives you full control over gas settings and provides visual feedback throughout the deployment process!
