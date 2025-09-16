'use client'
import { useState } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Copy, ExternalLink, Plus } from 'lucide-react'
import { toast } from 'sonner'

export function NetworkGuide() {
  const [showGuide, setShowGuide] = useState(false)

  const networkDetails = {
    name: 'Hyperliquid',
    chainId: 999,
    rpcUrl: 'https://rpc.hyperliquid.xyz/evm',
    symbol: 'HYPE',
    explorer: 'https://explorer.hyperliquid.xyz'
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const addToMetaMask = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${networkDetails.chainId.toString(16)}`, // Convert to hex
            chainName: networkDetails.name,
            nativeCurrency: {
              name: networkDetails.symbol,
              symbol: networkDetails.symbol,
              decimals: 18
            },
            rpcUrls: [networkDetails.rpcUrl],
            blockExplorerUrls: [networkDetails.explorer]
          }]
        })
        toast.success('Hyperliquid network added to MetaMask!')
      } catch (error) {
        console.error('Error adding network:', error)
        toast.error('Failed to add network to MetaMask')
      }
    } else {
      toast.error('MetaMask not detected')
    }
  }

  if (!showGuide) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowGuide(true)}
        className="flex items-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>Add Hyperliquid Network</span>
      </Button>
    )
  }

  return (
    <Card className="border-[var(--hl-cyan)]/20 bg-[var(--hl-cyan)]/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--fg-default)]">Add Hyperliquid Network</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowGuide(false)}>
          ✕
        </Button>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-[var(--fg-muted)]">
          Add the Hyperliquid network to your wallet to interact with the platform.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[var(--bg-subtle)] rounded-lg">
            <div>
              <span className="text-sm font-medium text-[var(--fg-default)]">Network Name</span>
              <p className="text-sm text-[var(--fg-muted)]">{networkDetails.name}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(networkDetails.name, 'Network name')}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-[var(--bg-subtle)] rounded-lg">
            <div>
              <span className="text-sm font-medium text-[var(--fg-default)]">Chain ID</span>
              <p className="text-sm text-[var(--fg-muted)]">{networkDetails.chainId}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(networkDetails.chainId.toString(), 'Chain ID')}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-[var(--bg-subtle)] rounded-lg">
            <div>
              <span className="text-sm font-medium text-[var(--fg-default)]">RPC URL</span>
              <p className="text-sm text-[var(--fg-muted)] font-mono break-all">{networkDetails.rpcUrl}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(networkDetails.rpcUrl, 'RPC URL')}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-[var(--bg-subtle)] rounded-lg">
            <div>
              <span className="text-sm font-medium text-[var(--fg-default)]">Currency Symbol</span>
              <p className="text-sm text-[var(--fg-muted)]">{networkDetails.symbol}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(networkDetails.symbol, 'Currency symbol')}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-[var(--bg-subtle)] rounded-lg">
            <div>
              <span className="text-sm font-medium text-[var(--fg-default)]">Block Explorer</span>
              <p className="text-sm text-[var(--fg-muted)] font-mono break-all">{networkDetails.explorer}</p>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(networkDetails.explorer, 'Explorer URL')}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(networkDetails.explorer, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button onClick={addToMetaMask} className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Add to MetaMask
          </Button>
          <Button variant="secondary" onClick={() => setShowGuide(false)}>
            Close
          </Button>
        </div>
      </div>
    </Card>
  )
}
