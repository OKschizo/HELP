'use client'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LaunchDraft } from '../page'
import { useContractDeployment } from '@/lib/useContractDeployment'
import { FACTORY_ADDRESS } from '@/lib/contracts'
import { toast } from 'sonner'
import { ExternalLink, Copy, Wallet, CheckCircle, AlertCircle, Terminal } from 'lucide-react'

interface DeployStepProps {
  draft: LaunchDraft
  updateDraft: (updates: Partial<LaunchDraft>) => void
  onNext: () => void
  onBack: () => void
}

export function DeployStep({ draft, updateDraft, onNext, onBack }: DeployStepProps) {
  const { address, isConnected } = useAccount()
  const { deployContract, isDeploying, deployHash, deployedAddress, error, logs, reset } = useContractDeployment()
  const [showDetails, setShowDetails] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const handleDeploy = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet to deploy')
      return
    }

    // Require metadata CID (used as baseURI)
    if (!draft.metaCID) {
      toast.error('Please upload your metadata to IPFS first')
      return
    }

    // Calculate max supply from uploaded assets
    const maxSupply = draft.nftItems.length || 1

    // Use metadata CID for baseURI so tokenURI = baseURI + tokenId resolves to JSON
    const baseURI = `ipfs://${draft.metaCID}/`

    await deployContract({
      name: draft.contractName,
      symbol: draft.symbol,
      maxSupply,
      baseURI,
      mintPrice: draft.mintCostEth,
      allowlistPrice: draft.allowlistPrice,
      walletLimit: draft.mintsPerWallet,
      txLimit: draft.maxPerTx,
      royaltyBps: draft.enforceRoyalties ? draft.royaltyBps : 0,
      royaltyReceiver: (draft.royaltyReceiver as any) || undefined,
      merkleRoot: (draft.merkleRoot as any) || undefined,
      launchDate: draft.launchDate ? new Date(draft.launchDate) : undefined,
      endDate: draft.endDate ? new Date(draft.endDate) : undefined,
      allowlistStartDate: draft.allowlistStartDate ? new Date(draft.allowlistStartDate) : undefined,
      allowlistEndDate: draft.allowlistEndDate ? new Date(draft.allowlistEndDate) : undefined,
    })
  }

  // Update draft when deployment completes
  useEffect(() => {
    if (deployedAddress && !draft.deployedAddress) {
      updateDraft({
        deployedAddress,
        deployTxHash: deployHash,
      })
    }
  }, [deployedAddress, deployHash, draft.deployedAddress, updateDraft])

  // Show logs when deployment starts
  useEffect(() => {
    if (logs.length > 0) {
      setShowLogs(true)
    }
  }, [logs])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const explorerUrl = `https://explorer.hyperliquid.xyz/tx/${deployHash}`
  const contractUrl = `https://explorer.hyperliquid.xyz/address/${deployedAddress}`

  const isFactoryDeployed = FACTORY_ADDRESS && FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000'

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Factory Status Warning */}
      {!isFactoryDeployed && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-500 mb-1">Factory Contract Not Deployed</h3>
              <p className="text-sm text-[var(--fg-muted)]">
                The factory contract needs to be deployed to HyperEVM before users can create collections. 
                Please contact the platform administrator.
              </p>
              <p className="text-xs text-[var(--fg-subtle)] mt-2">
                Current Factory Address: <code className="bg-[var(--bg-subtle)] px-1 rounded">{FACTORY_ADDRESS}</code>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Deployment Status */}
      <Card>
        <div className="text-center space-y-6">
          {!deployedAddress && !isDeploying && !error && (
            <>
              <div className="w-16 h-16 mx-auto bg-[var(--hl-cyan)]/10 rounded-full flex items-center justify-center">
                <Wallet className="w-8 h-8 text-[var(--hl-cyan)]" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[var(--fg-default)] mb-2">
                  Ready to Deploy
                </h2>
                <p className="text-[var(--fg-muted)]">
                  Deploy your NFT collection to Hyperliquid using your connected wallet
                </p>
              </div>
            </>
          )}

          {isDeploying && (
            <>
              <div className="w-16 h-16 mx-auto bg-[var(--hl-cyan)]/10 rounded-full flex items-center justify-center animate-pulse">
                <Wallet className="w-8 h-8 text-[var(--hl-cyan)]" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[var(--fg-default)] mb-2">
                  Deploying Contract...
                </h2>
                <p className="text-[var(--fg-muted)]">
                  {deployHash ? 'Waiting for confirmation...' : 'Please confirm the transaction in your wallet'}
                </p>
                {deployHash && (
                  <div className="mt-4">
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-[var(--hl-cyan)] hover:underline"
                    >
                      <span>View Transaction</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </>
          )}

          {deployedAddress && (
            <>
              <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[var(--fg-default)] mb-2">
                  Contract Deployed Successfully!
                </h2>
                <p className="text-[var(--fg-muted)] mb-4">
                  Your NFT collection is now live on Hyperliquid
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm text-[var(--fg-muted)]">Contract Address:</span>
                    <code className="bg-[var(--bg-subtle)] px-2 py-1 rounded text-sm font-mono">
                      {deployedAddress.slice(0, 10)}...{deployedAddress.slice(-8)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(deployedAddress)}
                      className="p-1"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <a
                      href={contractUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-[var(--hl-cyan)] hover:underline"
                    >
                      <span>View Contract</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {deployHash && (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-[var(--hl-cyan)] hover:underline"
                      >
                        <span>View Transaction</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {error && (
            <>
              <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[var(--fg-default)] mb-2">
                  Deployment Failed
                </h2>
                <p className="text-red-500 mb-4">{error.message}</p>
                <Button onClick={reset} variant="secondary">
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Deployment Logs */}
      {logs.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-[var(--fg-muted)]" />
              <h3 className="text-lg font-semibold text-[var(--fg-default)]">Deployment Logs</h3>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowLogs(!showLogs)}
            >
              {showLogs ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showLogs && (
            <div className="bg-[var(--bg-subtle)] rounded-lg p-4 font-mono text-sm max-h-60 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-[var(--fg-muted)] mb-1">
                  {log}
                </div>
              ))}
              {isDeploying && (
                <div className="text-[var(--hl-cyan)] animate-pulse">
                  ⏳ Processing...
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Deployment Details */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--fg-default)]">Deployment Details</h3>
          <Button
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>

        {showDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-[var(--fg-muted)]">Collection Name</span>
                  <p className="font-medium">{draft.contractName}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--fg-muted)]">Symbol</span>
                  <p className="font-medium">{draft.symbol}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--fg-muted)]">Max Supply</span>
                  <p className="font-medium">{draft.nftItems.length || 1} NFTs</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--fg-muted)]">Public Price</span>
                  <p className="font-medium">{draft.mintCostEth} HYPE</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-[var(--fg-muted)]">Allowlist Price</span>
                  <p className="font-medium">{draft.allowlistPrice || draft.mintCostEth} HYPE</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--fg-muted)]">Wallet Limit</span>
                  <p className="font-medium">{draft.mintsPerWallet} per wallet</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--fg-muted)]">Transaction Limit</span>
                  <p className="font-medium">{draft.maxPerTx} per transaction</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--fg-muted)]">Royalties</span>
                  <p className="font-medium">{draft.royaltyBps / 100}%</p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-sm text-[var(--fg-muted)]">Creator</span>
              <p className="font-medium font-mono text-xs">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
              </p>
            </div>

            {draft.assetsCID && (
              <div>
                <span className="text-sm text-[var(--fg-muted)]">IPFS Assets</span>
                <p className="font-mono text-xs break-all">ipfs://{draft.assetsCID}/</p>
              </div>
            )}

            {draft.metaCID && (
              <div>
                <span className="text-sm text-[var(--fg-muted)]">Base URI (Metadata)</span>
                <p className="font-mono text-xs break-all">ipfs://{draft.metaCID}/</p>
              </div>
            )}

            <div>
              <span className="text-sm text-[var(--fg-muted)]">Factory Contract</span>
              <p className="font-mono text-xs break-all">{FACTORY_ADDRESS}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-6">
        <Button variant="secondary" onClick={onBack} disabled={isDeploying}>
          Back
        </Button>
        
        {!deployedAddress ? (
          <Button 
            onClick={handleDeploy} 
            disabled={isDeploying || !isConnected || !draft.metaCID || !isFactoryDeployed}
            className="min-w-[120px]"
          >
            {isDeploying ? 'Deploying...' : 'Deploy Contract'}
          </Button>
        ) : (
          <Button onClick={onNext} className="min-w-[120px]">
            Continue to Success
          </Button>
        )}
      </div>
    </div>
  )
}