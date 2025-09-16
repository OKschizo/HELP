'use client'
import { useState, useCallback } from 'react';
import { deployImplementation, deployImplementationWithRetry, type DeploymentResult } from '@/actions/deployImplementation';
import type { DeploymentLog } from './deploymentV2';

export function useDirectImplementationDeployment() {
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);

  const addLog = useCallback((message: string, type: DeploymentLog['type'] = 'info', txHash?: string) => {
    setLogs(prev => [...prev, {
      timestamp: Date.now(),
      message,
      type,
      txHash
    }]);
  }, []);

  const deployImplementationDirect = useCallback(async (useRetry: boolean = false, useManualGas: boolean = false) => {
    try {
      setIsDeploying(true);
      setLogs([]);
      setDeployedAddress(null);
      setTxHash(null);
      setDeploymentResult(null);

      addLog('🚀 Starting direct implementation deployment...', 'info');
      addLog(useManualGas ? 'Using manual gas estimation' : 'Using MetaMask gas estimation', 'info');

      const result = useRetry 
        ? await deployImplementationWithRetry(useManualGas)
        : await deployImplementation(useManualGas);

      setDeployedAddress(result.address);
      setTxHash(result.transactionHash);
      setDeploymentResult(result);

      addLog(`✅ Implementation deployed successfully!`, 'success', result.transactionHash);
      addLog(`📍 Contract Address: ${result.address}`, 'success');
      addLog(`⛽ Gas Used: ${result.gasUsed.toString()}`, 'info');
      addLog(`📄 Bytecode Size: ${result.bytecodeSize} bytes (${(result.bytecodeSize/1024).toFixed(2)} KB)`, 'info');
      addLog(`🔗 View on Explorer: https://explorer.hyperliquid.xyz/address/${result.address}`, 'info');

    } catch (error: any) {
      addLog(`❌ Deployment failed: ${error.message}`, 'error');
      console.error('Direct deployment error:', error);
    } finally {
      setIsDeploying(false);
    }
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setDeployedAddress(null);
    setTxHash(null);
    setDeploymentResult(null);
  }, []);

  return {
    deployImplementationDirect,
    logs,
    clearLogs,
    isDeploying,
    deployedAddress,
    txHash,
    deploymentResult
  };
}
