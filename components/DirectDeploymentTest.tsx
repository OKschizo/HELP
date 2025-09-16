'use client'
import { useState } from 'react';
import { useDirectImplementationDeployment } from '@/lib/useDirectDeployment';
import { useAccount } from 'wagmi';

export function DirectDeploymentTest() {
  const { address, isConnected } = useAccount();
  const {
    deployImplementationDirect,
    logs,
    clearLogs,
    isDeploying,
    deployedAddress,
    txHash,
    deploymentResult
  } = useDirectImplementationDeployment();

  const [useRetry, setUseRetry] = useState(false);
  const [useManualGas, setUseManualGas] = useState(false);

  const handleDeploy = () => {
    deployImplementationDirect(useRetry, useManualGas);
  };

  if (!isConnected) {
    return (
      <div className="p-6 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Direct Deployment Test</h3>
        <p className="text-gray-600">Please connect your wallet to test deployment.</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Direct Deployment Test</h3>
      <p className="text-sm text-gray-600">
        Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
      </p>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700"
        >
          {isDeploying ? 'Deploying...' : 'Deploy Implementation'}
        </button>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={useRetry}
            onChange={(e) => setUseRetry(e.target.checked)}
            disabled={isDeploying}
          />
          <span className="text-sm">Use retry logic</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={useManualGas}
            onChange={(e) => setUseManualGas(e.target.checked)}
            disabled={isDeploying}
          />
          <span className="text-sm">Use manual gas (otherwise MetaMask estimates)</span>
        </label>
        
        <button
          onClick={clearLogs}
          disabled={isDeploying}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50 hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      {deployedAddress && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <h4 className="font-semibold text-green-800">✅ Deployment Successful!</h4>
          <p className="text-sm text-green-700 mt-1">
            <strong>Address:</strong> {deployedAddress}
          </p>
          {txHash && (
            <p className="text-sm text-green-700">
              <strong>Transaction:</strong> {txHash}
            </p>
          )}
          {deploymentResult && (
            <div className="text-sm text-green-700 mt-2">
              <p><strong>Gas Used:</strong> {deploymentResult.gasUsed.toString()}</p>
              <p><strong>Bytecode Size:</strong> {deploymentResult.bytecodeSize} bytes</p>
            </div>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold">Deployment Logs:</h4>
          <div className="max-h-64 overflow-y-auto bg-gray-50 p-4 rounded text-sm font-mono">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`mb-1 ${
                  log.type === 'error' 
                    ? 'text-red-600' 
                    : log.type === 'success' 
                    ? 'text-green-600'
                    : log.type === 'warning'
                    ? 'text-yellow-600'
                    : 'text-gray-700'
                }`}
              >
                <span className="text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>{' '}
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
