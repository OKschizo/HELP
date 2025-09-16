'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LaunchDraft } from '../page'
import { CheckCircle, ExternalLink, Copy, Settings, Sparkles, Code } from 'lucide-react'
import { toast } from 'sonner'

interface SuccessStepProps {
  draft: LaunchDraft
}

export function SuccessStep({ draft }: SuccessStepProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const embedCode = `<iframe 
  src="${window.location.origin}/mint/${draft.deployedAddress}" 
  width="400" 
  height="600" 
  frameborder="0">
</iframe>`

  return (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      {/* Success Header */}
      <div className="space-y-6">
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-gradient mb-4">
            🎉 Collection Deployed!
          </h1>
          <p className="text-lg text-[var(--fg-muted)] max-w-2xl mx-auto">
            Your NFT collection <strong>{draft.collectionName}</strong> is now live on HyperEVM. 
            Start sharing your mint page and manage your collection.
          </p>
        </div>
      </div>

      {/* Contract Info */}
      <Card className="text-left">
        <h2 className="text-lg font-semibold text-[var(--fg-default)] mb-6 text-center">Contract Details</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <span className="text-sm text-[var(--fg-muted)]">Collection Name</span>
              <div className="text-[var(--fg-default)] font-medium">{draft.collectionName}</div>
            </div>
            <div>
              <span className="text-sm text-[var(--fg-muted)]">Symbol</span>
              <div className="text-[var(--fg-default)] font-medium">{draft.symbol}</div>
            </div>
            <div>
              <span className="text-sm text-[var(--fg-muted)]">Supply</span>
              <div className="text-[var(--fg-default)] font-medium">{draft.assets.length || 'TBD'} NFTs</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm text-[var(--fg-muted)]">Mint Price</span>
              <div className="text-[var(--fg-default)] font-medium">{draft.mintCostEth} HYPE</div>
            </div>
            <div>
              <span className="text-sm text-[var(--fg-muted)]">Network</span>
              <div className="text-[var(--fg-default)] font-medium">Hyperliquid EVM</div>
            </div>
            <div>
              <span className="text-sm text-[var(--fg-muted)]">Contract Address</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-[var(--fg-default)] break-all">
                  {draft.deployedAddress}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(draft.deployedAddress!)}
                  className="p-1 flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 flex-shrink-0"
                  onClick={() => window.open(`https://hyperevmscan.io/address/${draft.deployedAddress}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="text-center group hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--fg-default)] mb-2">Manage</h3>
          <p className="text-[var(--fg-muted)] mb-4 text-sm">
            Control your collection settings, reveal metadata, and withdraw funds.
          </p>
          <Link href={`/manage/${draft.deployedAddress}`}>
            <Button className="w-full">
              Open Manage
            </Button>
          </Link>
        </Card>

        <Card className="text-center group hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--fg-default)] mb-2">Mint Page</h3>
          <p className="text-[var(--fg-muted)] mb-4 text-sm">
            Share your public mint page with collectors and fans.
          </p>
          <Link href={`/mint-pro/${draft.deployedAddress}`}>
            <Button className="w-full">
              Open Mint Page
            </Button>
          </Link>
        </Card>

        <Card className="text-center group hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Code className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--fg-default)] mb-2">Embed Widget</h3>
          <p className="text-[var(--fg-muted)] mb-4 text-sm">
            Copy the embed code to add the mint widget to your website.
          </p>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => copyToClipboard(embedCode)}
          >
            Copy Embed Code
          </Button>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="bg-[var(--bg-elevated)]/50 text-left">
        <h3 className="text-lg font-semibold text-[var(--fg-default)] mb-4">Next Steps</h3>
        <div className="space-y-3 text-sm text-[var(--fg-muted)]">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-[var(--hl-cyan)] text-black rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
            <div>
              <strong className="text-[var(--fg-default)]">Set Base URI:</strong> Go to Manage and set your IPFS metadata URI to reveal your NFTs
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-[var(--hl-cyan)] text-black rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
            <div>
              <strong className="text-[var(--fg-default)]">Share Mint Page:</strong> Share your mint page URL with your community
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-[var(--hl-cyan)] text-black rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
            <div>
              <strong className="text-[var(--fg-default)]">Monitor Sales:</strong> Track mints and manage your collection through the dashboard
            </div>
          </div>
        </div>
      </Card>

      {/* Final CTA */}
      <div className="pt-8">
        <Link href="/">
          <Button variant="secondary" size="lg">
            Create Another Collection
          </Button>
        </Link>
      </div>
    </div>
  )
}
