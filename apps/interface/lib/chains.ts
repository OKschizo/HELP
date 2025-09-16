import { defineChain } from 'viem';

export const hyperEVM = defineChain({ 
  id: 999, 
  name: 'Hyperliquid', 
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.hyperliquid.xyz/evm'] } },
  blockExplorers: { default: { name: 'Hyperliquid Explorer', url: 'https://explorer.hyperliquid.xyz' } },
  iconUrl: 'https://app.hyperliquid.xyz/favicon.ico',
  iconBackground: '#000000'
});