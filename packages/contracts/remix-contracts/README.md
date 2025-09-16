# Remix Deployment Files

## 📁 Files in this directory:
- `HyperLaunchERC721_ImplV2_Simple.sol` - Implementation contract
- `HyperLaunch721FactoryV2.sol` - Factory contract  
- `deployment-params.json` - Deployment configuration

## 🚀 Quick Remix Setup:

1. **Open Remix**: https://remix.ethereum.org
2. **Upload these files** to a new workspace
3. **Compiler settings**:
   - Version: 0.8.20+
   - Optimization: Enabled (200 runs)
   - EVM Version: paris
   - Via IR: true

4. **Deploy order**:
   1. Deploy `HyperLaunchERC721_ImplV2_Simple` (no parameters)
   2. Deploy `HyperLaunch721FactoryV2` (use implementation address from step 1)

## 🔗 Network Settings:
See `deployment-params.json` for complete network configuration.

## 📖 Full Guide:
See `../REMIX_DEPLOYMENT.md` for detailed instructions.
