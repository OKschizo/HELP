import { useState, useCallback, useEffect } from 'react'
import { useAccount, useWalletClient, usePublicClient, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi'
import { parseEther, parseGwei, type Address, encodeAbiParameters, parseAbiParameters, concat } from 'viem'

// Import contract artifacts
import HyperLaunchERC721_ImplV2 from '../../../packages/contracts/artifacts/contracts/HyperLaunchERC721_ImplV2_Optimized.sol/HyperLaunchERC721_ImplV2.json'
import HyperLaunch721FactoryV2 from '../../../packages/contracts/artifacts/contracts/HyperLaunch721FactoryV2_Optimized.sol/HyperLaunch721FactoryV2.json'

// Import transaction helpers
import { explainError, FALLBACK_CREATE_GAS, ALTERNATIVE_GAS_LIMITS, getBytecodeSize, isBytecodeTooLarge } from './txHelpers'
// Removed in-app big-block toggle; assume managed externally

const HYPERLIQUID_CHAIN_ID = 999 as const

export interface DeploymentLog {
  timestamp: number
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
  txHash?: string
}
// ===== Hyperliquid big-block helpers (best-effort, tolerant to missing RPC methods) =====
async function tryEnableBigBlocks(publicClient: any, addLog: (m: string, t?: any) => void) {
  const candidates = [
    { method: 'evmUserModify', params: [{ usingBigBlocks: true }] },
    { method: 'hyperevm_userModify', params: [{ usingBigBlocks: true }] },
    { method: 'hyperliquid_evmUserModify', params: [{ usingBigBlocks: true }] },
    { method: 'evmUserModify', params: [{ type: 'evmUserModify', usingBigBlocks: true }] },
  ]
  for (const c of candidates) {
    try {
      // Some RPCs may not support .request; guard it
      if (typeof publicClient?.request === 'function') {
        await publicClient.request({ method: c.method as any, params: c.params as any })
        addLog(`Enabled big-block mode via ${c.method}`, 'info')
        return true
      }
    } catch (e: any) {
      // Try next candidate
    }
  }
  addLog('Big-block enable RPC not available; proceeding anyway', 'warning')
  return false
}

async function tryDisableBigBlocks(publicClient: any, addLog: (m: string, t?: any) => void) {
  const candidates = [
    { method: 'evmUserModify', params: [{ usingBigBlocks: false }] },
    { method: 'hyperevm_userModify', params: [{ usingBigBlocks: false }] },
    { method: 'hyperliquid_evmUserModify', params: [{ usingBigBlocks: false }] },
    { method: 'evmUserModify', params: [{ type: 'evmUserModify', usingBigBlocks: false }] },
  ]
  for (const c of candidates) {
    try {
      if (typeof publicClient?.request === 'function') {
        await publicClient.request({ method: c.method as any, params: c.params as any })
        addLog(`Disabled big-block mode via ${c.method}`, 'info')
        return true
      }
    } catch (e: any) {
      // Try next candidate
    }
  }
  addLog('Big-block disable RPC not available; you may still be on large blocks', 'warning')
  return false
}

async function getLargeBlockGasPrice(publicClient: any): Promise<bigint | null> {
  const candidates = ['bigBlockGasPrice', 'hyperevm_bigBlockGasPrice', 'hyperliquid_bigBlockGasPrice']
  for (const method of candidates) {
    try {
      if (typeof publicClient?.request === 'function') {
        const res: any = await publicClient.request({ method: method as any, params: [] })
        if (typeof res === 'string') {
          // hex or decimal string
          if (res.startsWith('0x')) {
            return BigInt(res)
          }
          return BigInt(res)
        }
        if (typeof res === 'number') return BigInt(res)
        if (typeof res === 'bigint') return res
      }
    } catch (e) {
      // Try next method
    }
  }
  return null
}


// Hook for deploying the implementation contract
export function useImplementationDeployment() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [logs, setLogs] = useState<DeploymentLog[]>([])
  const [deployedAddress, setDeployedAddress] = useState<Address | undefined>(undefined)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [isDeploying, setIsDeploying] = useState(false)

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const addLog = useCallback((message: string, type: DeploymentLog['type'] = 'info', txHash?: string) => {
    setLogs(prev => [...prev, {
      timestamp: Date.now(),
      message,
      type,
      txHash
    }])
  }, [])

  const deployImplementation = useCallback(async () => {
    if (!address || !walletClient || !publicClient) {
      addLog('Please connect your wallet first', 'error')
      return
    }

    // Define bytecode outside try block for error handling
    const bytecode = HyperLaunchERC721_ImplV2.bytecode as `0x${string}`

    try {
      setIsDeploying(true)
      addLog('Starting Implementation deployment...', 'info')

      // Assume big blocks are managed externally
      const bigBlockEnabled = true

      // (1) bytecode size log
      const size = getBytecodeSize(bytecode)
      addLog(`Contract bytecode size: ${size} bytes (${(size/1024).toFixed(2)} KB)`, 'info')

      // (2) ensure chain 999
      const cur = await walletClient.getChainId()
      if (cur !== HYPERLIQUID_CHAIN_ID) {
        addLog(`Switching to Hyperliquid chain (${HYPERLIQUID_CHAIN_ID})...`, 'info')
        await switchChain({ chainId: HYPERLIQUID_CHAIN_ID })
        
        // Verify switch succeeded
        const newChain = await walletClient.getChainId()
        if (newChain !== HYPERLIQUID_CHAIN_ID) {
          throw new Error(`Failed to switch to chain ${HYPERLIQUID_CHAIN_ID}. Current chain: ${newChain}`)
        }
        addLog(`✅ Successfully switched to chain ${HYPERLIQUID_CHAIN_ID}`, 'info')
      }

      // (3) preflight balance & gas price
      const bal = await publicClient.getBalance({ address })
      addLog(`Deployer balance: ${bal} wei`, 'info')

      let gasPrice: bigint
      try {
        const big = await getLargeBlockGasPrice(publicClient)
        if (big && big > 0n) {
          gasPrice = big
        } else {
          gasPrice = await publicClient.getGasPrice()
        }
      } catch {
        gasPrice = parseGwei('2') // 2 gwei fallback
      }

      // (4) estimate create gas (fallback if fails)
      let gas: bigint
      try {
        gas = await publicClient.estimateGas({
          account: address,
          data: bytecode
        })
      } catch {
        gas = BigInt(FALLBACK_CREATE_GAS ?? 7_000_000)
        addLog(`Gas estimation failed, using fallback: ${gas.toString()}`, 'warning')
      }

      // If we couldn't enable big blocks and gas exceeds a small-block cap (~2,000,000), warn but proceed.
      const SMALL_BLOCK_GAS_LIMIT = 2_000_000n
      if (!bigBlockEnabled && gas > SMALL_BLOCK_GAS_LIMIT) {
        addLog(`Estimated gas ${gas} exceeds small-block limit. Proceeding assuming big blocks are enabled at control plane.`, 'warning')
      }

      addLog(`🎯 Sending raw CREATE tx (gas=${gas}, gasPrice=${gasPrice})`, 'info')

      // (5) raw CREATE transaction (bypasses deployContract wrapper)
      const hash = await walletClient.sendTransaction({
        account: address,
        to: undefined,      // CREATE transaction
        data: bytecode,
        value: 0n,
        gas,
        gasPrice,           // forces legacy (type 0)
        // chain field omitted - wallet is already on correct chain
      })

      setTxHash(hash)
      addLog(`Implementation deployment tx: ${hash}`, 'success', hash)
      addLog('Waiting for confirmation (large blocks ~60s cadence)...', 'info')
    } catch (e: any) {
      addLog(`Implementation deployment failed: ${explainError(e, HyperLaunchERC721_ImplV2.abi as any, bytecode)}`, 'error')
      console.error(e)
      setIsDeploying(false)
      // Try to disable big-block mode even on failure
      try { await tryDisableBigBlocks(publicClient, addLog) } catch {}
      return
    }
    // After sending tx, attempt to revert big-block mode (non-blocking)
    try { await tryDisableBigBlocks(publicClient, addLog) } catch {}
  }, [address, walletClient, publicClient, switchChain, addLog])

  // Effect to handle successful deployment
  useEffect(() => {
    if (isSuccess && txHash && publicClient) {
      // Get the deployed contract address from the transaction receipt
      publicClient.getTransactionReceipt({ hash: txHash }).then(receipt => {
        if (receipt.contractAddress) {
          setDeployedAddress(receipt.contractAddress)
          addLog(`Implementation contract deployed at: ${receipt.contractAddress}`, 'success')
          addLog('Note: An Initialized(max) event at deployment is expected here; the implementation constructor disables initializers.', 'info')
        }
        setIsDeploying(false)
      }).catch(err => {
        addLog(`Failed to get contract address: ${err.message}`, 'error')
        setIsDeploying(false)
      })
    }
  }, [isSuccess, txHash, publicClient, addLog])

  const clearLogs = useCallback(() => {
    setLogs([])
    setDeployedAddress(undefined)
    setTxHash(undefined)
  }, [])

  return {
    deployImplementation,
    logs,
    clearLogs,
    isDeploying: isDeploying || isConfirming,
    deployedAddress,
    txHash
  }
}

// Hook for deploying the factory contract
export function useFactoryDeployment() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [logs, setLogs] = useState<DeploymentLog[]>([])
  const [deployedAddress, setDeployedAddress] = useState<Address | undefined>(undefined)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [isDeploying, setIsDeploying] = useState(false)

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const addLog = useCallback((message: string, type: DeploymentLog['type'] = 'info', txHash?: string) => {
    setLogs(prev => [...prev, {
      timestamp: Date.now(),
      message,
      type,
      txHash
    }])
  }, [])

  const deployFactory = useCallback(async (
    implementationAddress: Address,
    platformFeeReceiver: Address,
    platformFeeBps: number = 250
  ) => {
    if (!address || !walletClient || !publicClient) {
      addLog('Please connect your wallet first', 'error')
      return
    }
    if (!implementationAddress) return addLog('Implementation address is required', 'error')
    if (!platformFeeReceiver) return addLog('Platform fee receiver address is required', 'error')

    // Sanity check: ensure implementation is not an EIP-1167 minimal proxy clone
    try {
      const code = await publicClient.getCode({ address: implementationAddress })
      if (!code || code === '0x') {
        return addLog('No code found at implementation address', 'error')
      }
      // Minimal proxy (EIP-1167) runtime code pattern contains this tail and is ~45 bytes
      const cloneSignature = '5af43d82803e903d91602b57fd5bf3'
      const isLikelyClone = code.length <= (2 + 2 * 60) || code.includes(cloneSignature)
      if (isLikelyClone) {
        return addLog('Provided implementation address appears to be a minimal proxy clone. Use the logic implementation address from Step 1.', 'error')
      }
    } catch {}

    // Prepare deployment data outside try block for error handling
    const constructorArgs = encodeAbiParameters(
      parseAbiParameters('address implementation_, address platformAddress_, uint96 platformFeeBps_'),
      [implementationAddress, platformFeeReceiver, BigInt(platformFeeBps)]
    )
    const factoryBytecode = HyperLaunch721FactoryV2.bytecode as `0x${string}`
    const deploymentData = concat([factoryBytecode, constructorArgs])

    try {
      setIsDeploying(true)
      addLog('Starting Factory deployment...', 'info')
      addLog(`Implementation: ${implementationAddress}`, 'info')
      addLog(`Platform Fee Receiver: ${platformFeeReceiver}`, 'info')
      addLog(`Platform Fee: ${(platformFeeBps / 100).toFixed(2)}%`, 'info')

      const cur = await walletClient.getChainId()
      if (cur !== HYPERLIQUID_CHAIN_ID) {
        addLog(`Switching to Hyperliquid chain (${HYPERLIQUID_CHAIN_ID})...`, 'info')
        await switchChain({ chainId: HYPERLIQUID_CHAIN_ID })
        
        // Verify switch succeeded
        const newChain = await walletClient.getChainId()
        if (newChain !== HYPERLIQUID_CHAIN_ID) {
          throw new Error(`Failed to switch to chain ${HYPERLIQUID_CHAIN_ID}. Current chain: ${newChain}`)
        }
        addLog(`✅ Successfully switched to chain ${HYPERLIQUID_CHAIN_ID}`, 'info')
      }

      let gasPrice: bigint
      try { 
        gasPrice = await publicClient.getGasPrice() 
      } catch { 
        gasPrice = parseGwei('2') 
      }

      let gas: bigint
      try {
        gas = await publicClient.estimateGas({
          account: address,
          data: deploymentData
        })
      } catch {
        gas = 6_000_000n // fallback for factory deployment
        addLog(`Gas estimation failed, using fallback: ${gas.toString()}`, 'warning')
      }

      addLog(`🎯 Sending raw CREATE tx (gas=${gas}, gasPrice=${gasPrice})`, 'info')

      const hash = await walletClient.sendTransaction({
        account: address,
        to: undefined,      // CREATE transaction
        data: deploymentData,
        value: 0n,
        gas,
        gasPrice,           // forces legacy (type 0)
        // chain field omitted - wallet is already on correct chain
      })

      setTxHash(hash)
      addLog(`Factory deployment tx: ${hash}`, 'success', hash)
      addLog('Waiting for confirmation...', 'info')
    } catch (e: any) {
      addLog(`Factory deployment failed: ${explainError(e, HyperLaunch721FactoryV2.abi as any, deploymentData)}`, 'error')
      console.error(e)
      setIsDeploying(false)
    }
  }, [address, walletClient, publicClient, switchChain, addLog])

  // Effect to handle successful deployment
  useEffect(() => {
    if (isSuccess && txHash && publicClient) {
      // Get the deployed contract address from the transaction receipt
      publicClient.getTransactionReceipt({ hash: txHash }).then(receipt => {
        if (receipt.contractAddress) {
          setDeployedAddress(receipt.contractAddress)
          addLog(`Factory contract deployed at: ${receipt.contractAddress}`, 'success')
        }
        setIsDeploying(false)
      }).catch(err => {
        addLog(`Failed to get contract address: ${err.message}`, 'error')
        setIsDeploying(false)
      })
    }
  }, [isSuccess, txHash, publicClient, addLog])

  const clearLogs = useCallback(() => {
    setLogs([])
    setDeployedAddress(undefined)
    setTxHash(undefined)
  }, [])

  return {
    deployFactory,
    logs,
    clearLogs,
    isDeploying: isDeploying || isConfirming,
    deployedAddress,
    txHash
  }
}

// Combined deployment status
export function useCombinedDeploymentStatus() {
  const implementation = useImplementationDeployment()
  const factory = useFactoryDeployment()

  const allLogs = [...implementation.logs, ...factory.logs].sort((a, b) => a.timestamp - b.timestamp)

  const clearAllLogs = useCallback(() => {
    implementation.clearLogs()
    factory.clearLogs()
  }, [implementation.clearLogs, factory.clearLogs])

  return {
    implementation,
    factory,
    allLogs,
    clearAllLogs,
    isAnyDeploying: implementation.isDeploying || factory.isDeploying
  }
}
