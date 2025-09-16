# 🚀 Factory Contract Deployment

## 🏭 What is the Factory Contract?

The Factory contract is a **smart contract vending machine** that creates standardized NFT contracts for users.

### 🔄 How it Works:
1. **Platform deploys Factory once** (this guide)
2. **Users call `factory.deployDrop()`** with their collection parameters
3. **Factory creates their contract instantly** using CREATE2
4. **User becomes owner** of their new NFT contract

### ✅ Benefits:
- **Lower Gas Costs** - No need to deploy full contract code each time
- **Standardized Contracts** - All collections use same verified code
- **Platform Control** - Factory can enforce fees and standards
- **Instant Deployment** - No compilation needed

## 🌐 Deployment to HyperEVM Mainnet

### 📋 Prerequisites:
1. **Private Key** - Set `DEPLOYER_KEY` in `.env`
2. **HYPE Tokens** - For gas fees on mainnet
3. **Compiled Contracts** - Run `pnpm compile` first

### 🚀 Deploy Factory:
```bash
# 1. Compile contracts
pnpm compile

# 2. Deploy to HyperEVM Mainnet
pnpm hardhat run scripts/deploy-factory.ts --network hyperevm

# 3. Copy the factory address from output
# 4. Update FACTORY_ADDRESS in apps/interface/lib/contracts.ts
```

### 📍 After Deployment:
1. **Update Frontend** - Set `FACTORY_ADDRESS` in `apps/interface/lib/contracts.ts`
2. **Restart Dev Server** - `pnpm dev` in interface directory
3. **Test Deployment** - Try creating an NFT collection
4. **Verify on Explorer** - Check contract on https://hyperevmscan.io

## 🔧 Environment Setup

Create `.env` file in `packages/contracts/`:
```env
DEPLOYER_KEY=your_private_key_here
```

## 🌐 Networks

- **Mainnet**: `hyperevm` (Chain ID: 999)
- **Testnet**: `hyperevmTestnet` (Chain ID: 998)

## 📊 Gas Estimates

- **Factory Deployment**: ~2-3M gas
- **User Collection Deploy**: ~500K gas (via factory)
- **Direct Contract Deploy**: ~3-4M gas (without factory)

**Factory saves users ~85% gas costs!** 🎉
