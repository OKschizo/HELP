import { defineChain, http } from 'viem';

export const hyperEVM = defineChain({ 
  id: 999, 
  name: 'Hyperliquid', 
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: { 
    default: { http: ['https://rpc.hyperliquid.xyz/evm'] } 
  },
  blockExplorers: { 
    default: { name: 'Hyperliquid Explorer', url: 'https://explorer.hyperliquid.xyz' } 
  },
  iconUrl: 'https://app.hyperliquid.xyz/favicon.ico',
  iconBackground: '#000000'
});

export const hyperEVMTestnet = defineChain({ 
  id: 998, 
  name: 'Hyperliquid Testnet', 
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: { 
    default: { http: ['https://rpc.hyperliquid-testnet.xyz/evm'] } 
  },
  blockExplorers: { 
    default: { name: 'HyperEVMScan', url: 'https://hyperevmscan.io' } 
  },
  iconUrl: 'https://app.hyperliquid.xyz/favicon.ico',
  iconBackground: '#000000'
});

export const transportMap = { 
  999: http('https://rpc.hyperliquid.xyz/evm', { batch: true, retryCount: 5 }), 
  998: http('https://rpc.hyperliquid-testnet.xyz/evm', { batch: true, retryCount: 5 }) 
} as const;
