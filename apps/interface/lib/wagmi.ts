import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hyperEVM } from './chains';

export function makeWagmiConfig(){
  return getDefaultConfig({
    appName: 'HELP - Hyper Ethereal Launch Platform',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'help-default-id',
    chains: [hyperEVM],
    ssr: false,
  });
}
