import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { hyperEVM } from './chains';

const HYPEREVM_RPC_ENDPOINTS = ['https://rpc.hyperliquid.xyz/evm'];

export const publicClient = createPublicClient({
  chain: hyperEVM,
  transport: http(HYPEREVM_RPC_ENDPOINTS[0], { batch: true, retryCount: 3, timeout: 20_000 }),
});

export const walletClient = createWalletClient({
  chain: hyperEVM,
  transport: typeof window !== 'undefined' && (window as any).ethereum ? custom((window as any).ethereum) : http(HYPEREVM_RPC_ENDPOINTS[0]),
});

export const deploymentPublicClient = createPublicClient({
  chain: hyperEVM,
  transport: http(HYPEREVM_RPC_ENDPOINTS[0], { batch: false, retryCount: 1, timeout: 15_000 }),
});

