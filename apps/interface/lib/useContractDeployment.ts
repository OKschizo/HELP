'use client'
import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEventLogs } from 'viem'
import { toast } from 'sonner'
import { 
  V2_FACTORY_ABI, 
  FACTORY_ADDRESS, 
  createSaleConfig, 
  prepareFactoryDeploymentArgs,
  type FactoryDeploymentParams 
} from './contracts'
import { UserDatabase } from './userDatabase'

interface DeployParams {
  name: string
  symbol: string
  maxSupply: number
  baseURI: string
  mintPrice: string
  allowlistPrice?: string
  walletLimit: number
  txLimit: number
  royaltyBps: number
  launchDate?: Date
  endDate?: Date
  allowlistStartDate?: Date
  allowlistEndDate?: Date
  royaltyReceiver?: `0x${string}`
  merkleRoot?: `0x${string}`
}

export function useContractDeployment() {
  const { address } = useAccount()
  const { writeContract, data: deployTxHash, isPending: isWriting, error: writeError } = useWriteContract()
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash: deployTxHash,
  })

  const [deployedAddress, setDeployedAddress] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const isDeploying = isWriting || isConfirming

  // Add log helper
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Handle errors
  useEffect(() => {
    if (writeError) {
      const errorMsg = writeError.message.includes('User rejected') 
        ? 'Transaction was rejected by user'
        : `Transaction failed: ${writeError.message}`
      setError(new Error(errorMsg))
      addLog(`❌ Error: ${errorMsg}`)
    } else if (confirmError) {
      setError(new Error(`Confirmation failed: ${confirmError.message}`))
      addLog(`❌ Confirmation Error: ${confirmError.message}`)
    } else {
      setError(null)
    }
  }, [writeError, confirmError])

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && receipt && !deployedAddress) {
      addLog('✅ Transaction confirmed! Parsing deployment result...')
      
      try {
        const logs = parseEventLogs({
          abi: V2_FACTORY_ABI,
          logs: receipt.logs,
          eventName: 'DropDeployed'
        })

        if (logs.length > 0) {
          const dropAddress = (logs[0] as any).args.drop as `0x${string}`
          setDeployedAddress(dropAddress)
          addLog(`🎉 Contract deployed successfully!`)
          addLog(`📍 Contract Address: ${dropAddress}`)
          toast.success('Contract deployed successfully!')

          // Persist collection to Firestore
          ;(async () => {
            try {
              if (address) {
                const user = await UserDatabase.getOrCreateUser(address)
                await UserDatabase.createCollection(user.id, address, {
                  contractAddress: dropAddress,
                  name: (logs[0] as any).args?.name || 'Collection',
                  symbol: (logs[0] as any).args?.symbol || '',
                  description: '',
                  baseURI: '',
                  merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
                  payoutAddress: address,
                  royaltyReceiver: address,
                  royaltyBps: 0,
                  sale: {
                    publicPriceWei: '0',
                    allowlistPriceWei: '0',
                    publicStart: 0,
                    publicEnd: 0,
                    allowlistStart: 0,
                    allowlistEnd: 0,
                    maxPerWallet: 0,
                    maxPerTx: 0,
                  },
                  totalSupply: 0,
                  mintPrice: '0',
                  maxPerWallet: 0,
                  status: 'deployed',
                  metadata: {},
                })
                addLog(`🗄️ Saved collection to your dashboard`)
              }
            } catch (e: any) {
              addLog(`⚠️ Failed to save collection: ${e?.message || e}`)
            }
          })()
        } else {
          setError(new Error('DropDeployed event not found in transaction receipt'))
          addLog('❌ Error: DropDeployed event not found')
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to parse deployment result'
        setError(new Error(errorMsg))
        addLog(`❌ Error parsing logs: ${errorMsg}`)
      }
    }
  }, [isConfirmed, receipt, deployedAddress])

  const deployContract = async (params: DeployParams) => {
    if (!address) {
      setError(new Error('Wallet not connected'))
      addLog('❌ Error: Wallet not connected')
      return
    }

    // Check if factory is deployed
    if (!FACTORY_ADDRESS) {
      setError(new Error('Factory contract not deployed yet. Please deploy the factory first.'))
      addLog('❌ Error: Factory contract address not configured')
      toast.error('Factory contract not deployed yet. Please contact support.')
      return
    }

    try {
      // Clear previous state
      setDeployedAddress(null)
      setError(null)
      setLogs([])
      
      addLog('🚀 Starting contract deployment...')
      addLog(`📋 Collection: ${params.name} (${params.symbol})`)
      addLog(`📊 Supply: ${params.maxSupply} NFTs`)
      addLog(`💰 Price: ${params.mintPrice} HYPE`)
      
      // Create sale configuration
      const saleConfig = createSaleConfig({
        publicPrice: params.mintPrice,
        allowlistPrice: params.allowlistPrice,
        publicStart: params.launchDate,
        publicEnd: params.endDate,
        allowlistStart: params.allowlistStartDate ?? params.launchDate,
        allowlistEnd: params.allowlistEndDate ?? params.endDate,
        walletLimit: params.walletLimit,
        txLimit: params.txLimit,
      })

      // Prepare deployment parameters
      const deploymentParams: FactoryDeploymentParams = {
        name: params.name,
        symbol: params.symbol,
        maxSupply: params.maxSupply,
        baseURI: params.baseURI,
        payout: address, // Creator gets the funds
        royaltyReceiver: (params.royaltyReceiver && /^0x[0-9a-fA-F]{40}$/.test(params.royaltyReceiver)) ? params.royaltyReceiver : address,
        royaltyBps: Math.min(params.royaltyBps, 1000), // Cap at 10%
        saleConfig,
        merkleRoot: (params.merkleRoot && /^0x[0-9a-fA-F]{64}$/.test(params.merkleRoot)) ? params.merkleRoot : '0x0000000000000000000000000000000000000000000000000000000000000000'
      }

      const args = prepareFactoryDeploymentArgs(deploymentParams)
      
      addLog('📝 Prepared deployment arguments')
      addLog('🔗 Calling factory contract...')

      // Call the V2 factory contract
      writeContract({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: V2_FACTORY_ABI,
        functionName: 'deployDrop',
        args
      })

    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : 'Deployment preparation failed'
      setError(new Error(errorMsg))
      addLog(`❌ Error: ${errorMsg}`)
      console.error('Deploy error:', err)
    }
  }

  // Handle transaction hash
  useEffect(() => {
    if (deployTxHash) {
      addLog(`📋 Transaction submitted: ${deployTxHash}`)
      addLog('⏳ Waiting for confirmation...')
      toast.success('Transaction submitted! Waiting for confirmation...')
    }
  }, [deployTxHash])

  const reset = () => {
    setDeployedAddress(null)
    setError(null)
    setLogs([])
  }

  return {
    deployContract,
    isDeploying,
    deployHash: deployTxHash,
    deployedAddress,
    error,
    logs,
    reset,
  }
}