const { ethers } = require('hardhat')

async function main() {
  console.log('🚀 Deploying Implementation Contract...\n')
  
  const [deployer] = await ethers.getSigners()
  console.log('📍 Deployer address:', deployer.address)
  
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('💰 Deployer balance:', ethers.formatEther(balance), 'HYPE\n')
  
  // Deploy implementation contract
  console.log('Deploying HyperEtherealLaunchPlatformERC721_Impl...')
  const Implementation = await ethers.getContractFactory('HyperEtherealLaunchPlatformERC721_Impl')
  const implementation = await Implementation.deploy()
  await implementation.waitForDeployment()
  const implementationAddress = await implementation.getAddress()
  console.log('✅ Implementation deployed to:', implementationAddress)
  
  console.log('\n📋 Next Steps:')
  console.log('1. Copy this implementation address:', implementationAddress)
  console.log('2. Use it when deploying the factory through the frontend')
  console.log(`3. Verify on explorer: https://explorer.hyperliquid.xyz/address/${implementationAddress}`)
  
  return implementationAddress
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
