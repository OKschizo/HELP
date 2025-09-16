import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { hyperEVM, hyperEVMTestnet } from './chains';

// Alternative RPC endpoints for HyperEVM
const HYPEREVM_RPC_ENDPOINTS = [
  'https://rpc.hyperliquid.xyz/evm',
  // Add more endpoints if available
];

// Public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: hyperEVM,
  transport: http(HYPEREVM_RPC_ENDPOINTS[0], {
    batch: true,
    retryCount: 3,
    timeout: 20_000, // Shorter timeout for faster failover
  }),
});

// Wallet client for sending transactions (requires window.ethereum)
export const walletClient = createWalletClient({
  chain: hyperEVM,
  transport: typeof window !== 'undefined' && window.ethereum 
    ? custom(window.ethereum)
    : http(HYPEREVM_RPC_ENDPOINTS[0]),
});

// Alternative public client with different settings for deployment
export const deploymentPublicClient = createPublicClient({
  chain: hyperEVM,
  transport: http(HYPEREVM_RPC_ENDPOINTS[0], {
    batch: false, // Disable batching for deployments
    retryCount: 1, // Less retries to fail faster
    timeout: 15_000, // Shorter timeout
  }),
});

// Testnet clients
export const publicClientTestnet = createPublicClient({
  chain: hyperEVMTestnet,
  transport: http('https://rpc.hyperliquid-testnet.xyz/evm', {
    batch: true,
    retryCount: 5,
    timeout: 30_000,
  }),
});

export const walletClientTestnet = createWalletClient({
  chain: hyperEVMTestnet,
  transport: typeof window !== 'undefined' && window.ethereum 
    ? custom(window.ethereum)
    : http('https://rpc.hyperliquid-testnet.xyz/evm'),
});
