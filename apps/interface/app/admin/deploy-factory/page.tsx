'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { type Address } from 'viem'
import { AuthGuard } from '../../../components/AuthGuard'
import { ConnectWallet } from '../../../components/ConnectWallet'
import { useCombinedDeploymentStatus } from '../../../lib/deploymentV2'
import { enableBigBlocksViaSignature } from '../../../lib/hypercore'

type DeploymentStep = 'implementation' | 'factory' | 'complete'

export default function DeployFactoryPage() {
  const { address } = useAccount()
  const [currentStep, setCurrentStep] = useState<DeploymentStep>('implementation')
  const [implementationAddress, setImplementationAddress] = useState<string>('')
  const [platformFeeReceiver, setPlatformFeeReceiver] = useState<string>('')
  const [platformFeeBps, setPlatformFeeBps] = useState<number>(250) // 2.5%

  const { 
    implementation, 
    factory, 
    allLogs, 
    clearAllLogs, 
    isAnyDeploying 
  } = useCombinedDeploymentStatus()

  const handleDeployImplementation = async () => {
    await implementation.deployImplementation()
  }

  // Auto-fill implementation address when deployment completes
  useEffect(() => {
    if (implementation.deployedAddress) {
      setImplementationAddress(implementation.deployedAddress)
    }
  }, [implementation.deployedAddress])

  const handleDeployFactory = async () => {
    if (!implementationAddress || !platformFeeReceiver) {
      return
    }
    await factory.deployFactory(implementationAddress as Address, platformFeeReceiver as Address, platformFeeBps)
  }

  const handleEnableLargeBlocks = async () => {
    if (!address || !implementation || !('deployImplementation' in implementation)) return
    try {
      // Reuse wallet client through implementation hook context
      // addLog('Requesting signature to enable large blocks...', 'info') // This line was removed from the original file, so it's not added here.
    } catch (e) {}
  }

  const canProceedToFactory = implementationAddress && currentStep === 'implementation'
  const canDeployFactory = implementationAddress && platformFeeReceiver && currentStep === 'factory'

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Deploy HyperLaunch V2 Factory
            </h1>
            <p className="text-gray-300 text-lg">
              3-Step deployment process with EIP-1167 minimal proxy pattern
            </p>
          </div>

          {!address && (
            <div className="text-center mb-8">
              <ConnectWallet />
            </div>
          )}

          {address && (
            <div className="space-y-6">
              {/* Progress Steps */}
              <div className="bg-black/20 rounded-xl p-6 border border-purple-500/20">
                <h2 className="text-xl font-semibold text-white mb-4">Deployment Progress</h2>
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center space-x-2 ${
                    currentStep === 'implementation' ? 'text-yellow-400' : 
                    implementationAddress ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      currentStep === 'implementation' ? 'border-yellow-400 bg-yellow-400/20' : 
                      implementationAddress ? 'border-green-400 bg-green-400/20' : 'border-gray-400'
                    }`}>
                      {implementationAddress ? '✓' : '1'}
                    </div>
                    <span>Deploy Implementation</span>
                  </div>
                  
                  <div className="h-px bg-gray-400 flex-1"></div>
                  
                  <div className={`flex items-center space-x-2 ${
                    currentStep === 'factory' ? 'text-yellow-400' : 
                    factory.deployedAddress ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      currentStep === 'factory' ? 'border-yellow-400 bg-yellow-400/20' : 
                      factory.deployedAddress ? 'border-green-400 bg-green-400/20' : 'border-gray-400'
                    }`}>
                      {factory.deployedAddress ? '✓' : '2'}
                    </div>
                    <span>Deploy Factory</span>
                  </div>
                  
                  <div className="h-px bg-gray-400 flex-1"></div>
                  
                  <div className={`flex items-center space-x-2 ${
                    currentStep === 'complete' ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      currentStep === 'complete' ? 'border-green-400 bg-green-400/20' : 'border-gray-400'
                    }`}>
                      {currentStep === 'complete' ? '✓' : '3'}
                    </div>
                    <span>Complete</span>
                  </div>
                </div>
              </div>

              {/* Step 1: Implementation Deployment */}
              {currentStep === 'implementation' && (
                <div className="bg-black/20 rounded-xl p-6 border border-purple-500/20">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Step 1: Deploy Implementation Contract
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Deploy the master template contract that will be cloned for each NFT collection.
                    This is deployed once and reused for all collections.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Implementation Address (after deployment)
                      </label>
                      <input
                        type="text"
                        value={implementationAddress}
                        onChange={(e) => setImplementationAddress(e.target.value)}
                        placeholder="0x... (will be filled after deployment)"
                        className="w-full px-4 py-2 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={handleDeployImplementation}
                        disabled={implementation.isDeploying}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                      >
                        {implementation.isDeploying ? 'Deploying...' : 'Deploy Implementation'}
                      </button>
                      {/* Optional: a separate UI action to toggle big blocks before deploying, if needed */}
                      {/* <button
                        onClick={handleEnableLargeBlocks}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Enable Large Blocks
                      </button> */}
                      
                      {canProceedToFactory && (
                        <button
                          onClick={() => setCurrentStep('factory')}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Continue to Factory →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Factory Deployment */}
              {currentStep === 'factory' && (
                <div className="bg-black/20 rounded-xl p-6 border border-purple-500/20">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Step 2: Deploy Factory Contract
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Deploy the factory contract that will create minimal proxy clones of the implementation.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Implementation Address
                      </label>
                      <input
                        type="text"
                        value={implementationAddress}
                        onChange={(e) => setImplementationAddress(e.target.value)}
                        className="w-full px-4 py-2 bg-black/40 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Platform Fee Receiver
                      </label>
                      <input
                        type="text"
                        value={platformFeeReceiver}
                        onChange={(e) => setPlatformFeeReceiver(e.target.value)}
                        placeholder="0x... (your platform wallet address)"
                        className="w-full px-4 py-2 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Platform Fee (basis points)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={platformFeeBps}
                          onChange={(e) => setPlatformFeeBps(Number(e.target.value))}
                          min="0"
                          max="1000"
                          className="flex-1 px-4 py-2 bg-black/40 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        />
                        <span className="text-gray-300">
                          ({(platformFeeBps / 100).toFixed(1)}%)
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        250 = 2.5%, 500 = 5%, etc. Max 1000 (10%)
                      </p>
                    </div>
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setCurrentStep('implementation')}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                      >
                        ← Back to Implementation
                      </button>
                      
                      <button
                        onClick={handleDeployFactory}
                        disabled={!canDeployFactory || factory.isDeploying}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                      >
                        {factory.isDeploying ? 'Deploying...' : 'Deploy Factory'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Complete */}
              {currentStep === 'complete' && (
                <div className="bg-black/20 rounded-xl p-6 border border-green-500/20">
                  <h3 className="text-xl font-semibold text-green-400 mb-4">
                    ✅ Deployment Complete!
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Your V2 factory has been deployed successfully. You can now create gas-efficient NFT collections.
                  </p>
                  
                  <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-green-400 mb-2">Deployed Addresses:</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Implementation:</span>
                        <span className="text-white ml-2 font-mono">{implementationAddress}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Factory:</span>
                        <span className="text-white ml-2 font-mono">{factory.deployedAddress}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-400 mb-2">Next Steps:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                      <li>Update your app configuration with the factory address</li>
                      <li>Update the frontend to use the V2 factory ABI</li>
                      <li>Test the deployment by creating a test collection</li>
                      <li>Restart your development server</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Deployment Logs */}
              <div className="bg-black/20 rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Deployment Logs</h3>
                  <button
                    onClick={clearAllLogs}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                  >
                    Clear Logs
                  </button>
                </div>
                
                <div className="bg-black/40 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {allLogs.length === 0 ? (
                    <p className="text-gray-400 text-sm">No deployment activity yet...</p>
                  ) : (
                    <div className="space-y-2">
                      {allLogs.map((log, index) => (
                        <div
                          key={index}
                          className={`text-sm flex items-start space-x-2 ${
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'warning' ? 'text-yellow-400' :
                            'text-gray-300'
                          }`}
                        >
                          <span className="text-gray-500 text-xs mt-0.5 w-16 flex-shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span>{log.message}</span>
                          {log.txHash && (
                            <a
                              href={`https://explorer.hyperliquid.xyz/tx/${log.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-xs underline ml-2"
                            >
                              [TX]
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Benefits Section */}
              <div className="bg-black/20 rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-semibold text-white mb-4">V2 Factory Benefits</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-400">⚡ Gas Savings</h4>
                    <p className="text-sm text-gray-300">
                      90% less gas cost per deployment (~200K vs ~2M gas)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-400">🏗️ EIP-1167 Clones</h4>
                    <p className="text-sm text-gray-300">
                      Industry standard minimal proxy pattern
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-purple-400">💰 Platform Fees</h4>
                    <p className="text-sm text-gray-300">
                      Built-in platform fee collection system
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-yellow-400">🔐 MetaMask Deploy</h4>
                    <p className="text-sm text-gray-300">
                      No private key management needed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
