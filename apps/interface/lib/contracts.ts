import { parseEther } from 'viem'
import FactoryArtifact from '../../../packages/contracts/artifacts/contracts/HyperLaunch721FactoryV2_Optimized.sol/HyperLaunch721FactoryV2.json'
import ImplementationArtifact from '../../../packages/contracts/artifacts/contracts/HyperLaunchERC721_ImplV2_Optimized.sol/HyperLaunchERC721_ImplV2.json'

export const FACTORY_ADDRESS = '0x5358ee860134900E66Ea63A39C3c57FD362aE17a'
export const IMPLEMENTATION_ADDRESS = '0xeDd7d0032552CC17d9F458fE62a7e2ce3cf58f9F'

export const FACTORY_ABI = (FactoryArtifact as any).abi
export const IMPLEMENTATION_ABI = (ImplementationArtifact as any).abi

export const V2_FACTORY_ABI = FACTORY_ABI
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 999)

export interface SaleConfig {
  publicPriceWei: bigint
  allowlistPriceWei: bigint
  publicStart: bigint
  publicEnd: bigint
  allowlistStart: bigint
  allowlistEnd: bigint
  walletLimit: number
  txLimit: number
}

export interface FactoryDeploymentParams {
  name: string
  symbol: string
  maxSupply: number
  baseURI: string
  payout: `0x${string}`
  royaltyReceiver: `0x${string}`
  royaltyBps: number
  saleConfig: SaleConfig
  merkleRoot: `0x${string}`
}

export function createSaleConfig(params: {
  publicPrice: string
  allowlistPrice?: string
  publicStart?: Date
  publicEnd?: Date
  allowlistStart?: Date
  allowlistEnd?: Date
  walletLimit: number
  txLimit: number
}): SaleConfig {
  const now = Math.floor(Date.now() / 1000)
  return {
    publicPriceWei: parseEther(params.publicPrice),
    allowlistPriceWei: parseEther(params.allowlistPrice || params.publicPrice),
    publicStart: BigInt(params.publicStart ? Math.floor(params.publicStart.getTime() / 1000) : now),
    publicEnd: BigInt(params.publicEnd ? Math.floor(params.publicEnd.getTime() / 1000) : 0),
    allowlistStart: BigInt(params.allowlistStart ? Math.floor(params.allowlistStart.getTime() / 1000) : now),
    allowlistEnd: BigInt(params.allowlistEnd ? Math.floor(params.allowlistEnd.getTime() / 1000) : 0),
    walletLimit: params.walletLimit,
    txLimit: params.txLimit
  }
}

export function prepareFactoryDeploymentArgs(params: FactoryDeploymentParams) {
  return [
    params.name,
    params.symbol,
    BigInt(params.maxSupply),
    params.baseURI,
    params.payout,
    params.royaltyReceiver,
    BigInt(params.royaltyBps),
    {
      publicPriceWei: params.saleConfig.publicPriceWei,
      allowlistPriceWei: params.saleConfig.allowlistPriceWei,
      publicStart: params.saleConfig.publicStart,
      publicEnd: params.saleConfig.publicEnd,
      allowlistStart: params.saleConfig.allowlistStart,
      allowlistEnd: params.saleConfig.allowlistEnd,
      maxPerWallet: params.saleConfig.walletLimit,
      maxPerTx: params.saleConfig.txLimit,
    },
    params.merkleRoot,
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  ] as const
}

export function ethToWei(ethAmount: string): string {
  return parseEther(ethAmount).toString()
}
