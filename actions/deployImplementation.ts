import {
  hexToBytes, parseAbi, toBytes, encodeDeployData,
  type Hex,
  type Abi,
} from 'viem';
import { walletClient, publicClient, deploymentPublicClient } from '@/lib/viemClients';
import { FALLBACK_CREATE_GAS, explainError, getBytecodeSize } from '@/lib/txHelpers';

// Import the compiled contract artifacts (optimized V2)
import ImplArtifact from '@contracts/artifacts/contracts/HyperLaunchERC721_ImplV2_Optimized.sol/HyperLaunchERC721_ImplV2.json';

// Use the real ABI and bytecode from compiled contract
const ImplAbi = ImplArtifact.abi as Abi;
const ImplBytecode: Hex = ImplArtifact.bytecode as Hex;

export interface DeploymentResult {
  address: Hex;
  receipt: any;
  transactionHash: Hex;
  gasUsed: bigint;
  bytecodeSize: number;
}

export async function deployImplementation(useManualGas: boolean = false): Promise<DeploymentResult> {
  console.log('🚀 Starting implementation deployment...');
  
  // Get the connected account
  const [account] = await walletClient.getAddresses();
  if (!account) {
    throw new Error('No wallet connected');
  }

  console.log('👤 Deployer account:', account);
  
  // Log bytecode information
  const bytecodeSize = getBytecodeSize(ImplBytecode);
  console.log(`📄 Contract bytecode size: ${bytecodeSize} bytes (${(bytecodeSize/1024).toFixed(2)} KB)`);

  // Build creation transaction data
  const data = encodeDeployData({ 
    abi: ImplAbi, 
    bytecode: ImplBytecode 
  });

  try {
    let transactionParams: any = { account, data };
    
    if (useManualGas) {
      console.log('⚡ Using manual gas estimation...');
      // Try to estimate gas using deployment-specific client; fall back if the RPC refuses
      let gas: bigint;
      try {
        gas = await deploymentPublicClient.estimateGas({ account, data });
        // Add smaller buffer since HyperEVM seems sensitive to over-estimation
        gas = gas + (gas / 20n); // 5% buffer instead of 10%
        console.log(`✅ Gas estimated: ${gas.toString()}`);
      } catch (e) {
        console.warn('⚠️ estimateGas(create) failed:', e);
        gas = FALLBACK_CREATE_GAS;
        console.log(`🔄 Using fallback gas: ${gas.toString()}`);
      }
      transactionParams.gas = gas;
    } else {
      console.log('🎯 Letting MetaMask estimate gas...');
    }
    
    console.log('📡 Sending deployment transaction...');
    
    // Estimate gas for the deployment
    const gas = await publicClient.estimateGas(transactionParams).catch((e) => {
      console.warn(`Gas estimation failed: ${explainError(e)}`);
      return FALLBACK_CREATE_GAS;
    });
    
    // Send the deployment transaction
    const hash = await walletClient.sendTransaction(transactionParams);
    
    if (!hash) throw new Error('Failed to send transaction');
    console.log(`📋 Transaction sent: ${hash}`);
    console.log('⏳ Waiting for confirmation...');
    
    // Wait for the transaction to be mined using deployment client
    const receipt = await deploymentPublicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status !== 'success') {
      throw new Error(`Transaction failed: ${receipt.transactionHash}`);
    }
    
    if (!receipt.contractAddress) {
      throw new Error('Contract address not found in receipt');
    }
    
    console.log(`✅ Implementation deployed successfully!`);
    console.log(`📍 Contract address: ${receipt.contractAddress}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    
    return {
      address: receipt.contractAddress,
      receipt,
      transactionHash: hash,
      gasUsed: receipt.gasUsed,
      bytecodeSize
    };
    
  } catch (e) {
    const errorMessage = explainError(e, ImplAbi as any);
    console.error('❌ Deployment failed:', errorMessage);
    throw new Error(`Deployment failed: ${errorMessage}`);
  }
}

// Helper function to deploy with retry logic using different gas limits
export async function deployImplementationWithRetry(useManualGas: boolean = false): Promise<DeploymentResult> {
  const gasLimitsToTry = [
    FALLBACK_CREATE_GAS,     // 1.4M - increased after 1.1M gas failure
    1_500_000n,              // Higher than failed 1.1M
    1_300_000n,              // Moderate increase
    1_800_000n,              // More buffer
    2_000_000n,              // Conservative higher limit
  ];

  let lastError: any = null;

  // If not using manual gas, just try the regular deployment once
  if (!useManualGas) {
    console.log('🎯 Using MetaMask gas estimation with retry fallback...');
    try {
      return await deployImplementation(false); // Let MetaMask handle gas
    } catch (error) {
      console.log('⚠️ MetaMask deployment failed, falling back to manual gas limits...');
      // Fall through to manual gas retry logic
    }
  }

  for (let i = 0; i < gasLimitsToTry.length; i++) {
    const gasLimit = gasLimitsToTry[i];
    console.log(`🔄 Attempt ${i + 1}/${gasLimitsToTry.length} with manual gas limit: ${gasLimit.toString()}`);
    
    try {
      // Get account
      const [account] = await walletClient.getAddresses();
      if (!account) throw new Error('No wallet connected');

      // Build deployment data
      const data = encodeDeployData({ 
        abi: ImplAbi, 
        bytecode: ImplBytecode 
      });

      // Send transaction with specific gas limit (manual gas mode)
      const hash = await walletClient.sendTransaction({ 
        account, 
        data, 
        gas: gasLimit
      });
      
      console.log(`📋 Transaction sent: ${hash}`);
      
      // Wait for confirmation using deployment client
      const receipt = await deploymentPublicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success' && receipt.contractAddress) {
        console.log(`✅ Success on attempt ${i + 1}!`);
        console.log(`📍 Contract address: ${receipt.contractAddress}`);
        
        return {
          address: receipt.contractAddress,
          receipt,
          transactionHash: hash,
          gasUsed: receipt.gasUsed,
          bytecodeSize: getBytecodeSize(ImplBytecode)
        };
      } else {
        throw new Error('Transaction failed or no contract address');
      }
      
    } catch (error) {
      lastError = error;
      const errorMsg = explainError(error, ImplAbi);
      console.warn(`⚠️ Attempt ${i + 1} failed: ${errorMsg}`);
      
      // If this isn't the last attempt, continue
      if (i < gasLimitsToTry.length - 1) {
        console.log('🔄 Retrying with different gas limit...');
        continue;
      }
    }
  }

  // If we get here, all attempts failed
  const finalError = explainError(lastError, ImplAbi);
  throw new Error(`All deployment attempts failed. Last error: ${finalError}`);
}
