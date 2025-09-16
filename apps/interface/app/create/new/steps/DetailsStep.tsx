'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { LaunchDraft } from '../page'
import { AllowlistBuilder } from './AllowlistBuilder'

interface DetailsStepProps {
  draft: LaunchDraft
  updateDraft: (updates: Partial<LaunchDraft>) => void
  onNext: () => void
}

export function DetailsStep({ draft, updateDraft, onNext }: DetailsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!draft.contractName.trim()) {
      newErrors.contractName = 'Contract name is required'
    }
    if (!draft.collectionName.trim()) {
      newErrors.collectionName = 'Collection name is required'
    }
    if (!draft.symbol.trim()) {
      newErrors.symbol = 'Symbol is required'
    } else if (!/^[A-Z]{3,6}$/.test(draft.symbol)) {
      newErrors.symbol = 'Symbol must be 3-6 uppercase letters'
    }

    // Numeric validations
    const mintCost = parseFloat(draft.mintCostEth)
    if (isNaN(mintCost) || mintCost <= 0) {
      newErrors.mintCostEth = 'Mint cost must be a positive number'
    }


    if (draft.mintsPerWallet <= 0 || draft.mintsPerWallet > 100) {
      newErrors.mintsPerWallet = 'Mints per wallet must be between 1 and 100'
    }

    if (draft.maxPerTx <= 0 || draft.maxPerTx > 20) {
      newErrors.maxPerTx = 'Mints per transaction must be between 1 and 20'
    }

    if (draft.maxPerTx > draft.mintsPerWallet) {
      newErrors.maxPerTx = 'Cannot exceed mints per wallet limit'
    }

    if (draft.royaltyBps < 0 || draft.royaltyBps > 1000) {
      newErrors.royaltyBps = 'Royalty must be between 0 and 1000 (10%)'
    }

    if (draft.feeBps < 0 || draft.feeBps > 1000) {
      newErrors.feeBps = 'Platform fee must be between 0 and 1000 (10%)'
    }

    // Address validations
    if (draft.enforceRoyalties && draft.royaltyReceiver && !/^0x[0-9a-fA-F]{40}$/.test(draft.royaltyReceiver)) {
      newErrors.royaltyReceiver = 'Invalid address format'
    }

    if (draft.feeRecipient && !/^0x[0-9a-fA-F]{40}$/.test(draft.feeRecipient)) {
      newErrors.feeRecipient = 'Invalid address format'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onNext()
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="lg:col-span-2 space-y-8">
        {/* Collection Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--fg-default)] mb-1">Collection</h2>
          <p className="text-sm text-[var(--fg-muted)] mb-6">On-chain identifiers and basic launch timings.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              label="Contract Name"
              help="The on-chain name of your smart contract. Shown on explorers/markets."
              error={errors.contractName}
              required
            >
              <Input
                value={draft.contractName}
                onChange={(e) => updateDraft({ contractName: e.target.value })}
                placeholder="MyNFTs"
                error={!!errors.contractName}
              />
            </FormField>

            <FormField
              label="Collection Name"
              help="The display name shown in apps and in your NFT metadata."
              error={errors.collectionName}
              required
            >
              <Input
                value={draft.collectionName}
                onChange={(e) => updateDraft({ collectionName: e.target.value })}
                placeholder="My NFTs"
                error={!!errors.collectionName}
              />
            </FormField>

            <FormField
              label="Symbol"
              help="Short ticker (3–6 capital letters), e.g., MNFT."
              error={errors.symbol}
              required
              className="md:col-span-1"
            >
              <Input
                value={draft.symbol}
                onChange={(e) => updateDraft({ symbol: e.target.value.toUpperCase() })}
                placeholder="MNFT"
                maxLength={6}
                error={!!errors.symbol}
              />
            </FormField>


            <FormField
              label="Launch Date"
              help="When minting opens. Leave empty to open immediately."
            >
              <Input
                type="datetime-local"
                value={draft.launchDate || ''}
                onChange={(e) => updateDraft({ launchDate: e.target.value || null })}
              />
            </FormField>

            <FormField
              label="End Date"
              help="When minting closes. Leave empty to keep mint open."
            >
              <Input
                type="datetime-local"
                value={draft.endDate || ''}
                onChange={(e) => updateDraft({ endDate: e.target.value || null })}
              />
            </FormField>
          </div>

          {/* Toggles */}
          <div className="mt-6 space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={draft.enforceRoyalties}
                onChange={(e) => updateDraft({ enforceRoyalties: e.target.checked })}
                className="w-4 h-4 text-[var(--hl-cyan)] border-[var(--stroke-soft)] rounded focus:ring-[var(--hl-cyan)] focus:ring-2"
              />
              <span className="text-sm text-[var(--fg-default)]">Enforce royalties</span>
              <span className="text-xs text-[var(--fg-subtle)]">(Adds ERC-2981 royalty data)</span>
            </label>

            {/* Immutable removed per latest requirements */}

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={draft.revealLater}
                onChange={(e) => updateDraft({ revealLater: e.target.checked })}
                className="w-4 h-4 text-[var(--hl-cyan)] border-[var(--stroke-soft)] rounded focus:ring-[var(--hl-cyan)] focus:ring-2"
              />
              <span className="text-sm text-[var(--fg-default)]">Reveal later</span>
              <span className="text-xs text-[var(--fg-subtle)]">(Use a placeholder image before reveal)</span>
            </label>
          </div>
        </Card>

        {/* NFT Details & Mint Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--fg-default)] mb-1">NFTs</h2>
          <p className="text-sm text-[var(--fg-muted)] mb-6">Naming, pricing and mint limits.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              label="Base Art Name"
              help="Text used to name tokens (e.g., “NFT #” → NFT #1, NFT #2)."
              required
            >
              <Input
                value={draft.baseArtName}
                onChange={(e) => updateDraft({ baseArtName: e.target.value })}
                placeholder="NFT #"
              />
            </FormField>

            <FormField
              label="Public Mint Price (HYPE)"
              help="Price per NFT during the public sale."
              error={errors.mintCostEth}
              required
            >
              <Input
                value={draft.mintCostEth}
                onChange={(e) => updateDraft({ mintCostEth: e.target.value })}
                placeholder="0.05"
                error={!!errors.mintCostEth}
              />
            </FormField>

            <FormField
              label="Allowlist Price (HYPE)"
              help="Optional cheaper price for allowlist wallets. Leave empty to use public price."
            >
              <Input
                value={draft.allowlistPrice || ''}
                onChange={(e) => updateDraft({ allowlistPrice: e.target.value || undefined })}
                placeholder="0.04"
              />
            </FormField>

            <FormField
              label="Mints per Wallet"
              help="Max NFTs a single wallet can mint across the whole sale."
              error={errors.mintsPerWallet}
              required
            >
              <Input
                type="number"
                value={draft.mintsPerWallet}
                onChange={(e) => updateDraft({ mintsPerWallet: parseInt(e.target.value) || 0 })}
                placeholder="5"
                min="1"
                max="100"
                error={!!errors.mintsPerWallet}
              />
            </FormField>

            <FormField
              label="Mints per Transaction"
              help="Max NFTs allowed in one transaction."
              error={errors.maxPerTx}
              required
            >
              <Input
                type="number"
                value={draft.maxPerTx}
                onChange={(e) => updateDraft({ maxPerTx: parseInt(e.target.value) || 0 })}
                placeholder="3"
                min="1"
                max="20"
                error={!!errors.maxPerTx}
              />
            </FormField>

            <FormField
              label="Description"
              help="Short collection blurb. Supports {name} for the token’s name."
              className="md:col-span-2"
            >
              <textarea
                value={draft.description}
                onChange={(e) => updateDraft({ description: e.target.value })}
                placeholder="{name} – Generated and deployed on HyperEVM."
                className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2 text-sm placeholder:text-[var(--fg-subtle)] text-[var(--fg-default)] focus:outline-none focus:ring-2 focus:ring-[var(--hl-cyan)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] resize-none"
                rows={3}
              />
            </FormField>
          </div>
        </Card>

        {/* Royalties & Allowlist */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--fg-default)] mb-1">Royalties & Allowlist</h2>
          <p className="text-sm text-[var(--fg-muted)] mb-6">Set EIP-2981 royalties and optional allowlist phase.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              label="Royalty Receiver"
              help="Wallet address to receive royalties from secondary sales."
              error={errors.royaltyReceiver}
            >
              <Input
                value={draft.royaltyReceiver}
                onChange={(e) => updateDraft({ royaltyReceiver: e.target.value as any })}
                placeholder="0x..."
                error={!!errors.royaltyReceiver}
              />
            </FormField>

            <FormField
              label="Royalty %"
              help="Royalty percent (0–10%)."
              error={errors.royaltyBps}
            >
              <Input
                type="number"
                value={(draft.royaltyBps / 100).toString()}
                onChange={(e) => {
                  const pct = Math.max(0, Math.min(10, parseFloat(e.target.value || '0')))
                  updateDraft({ royaltyBps: Math.round(pct * 100) })
                }}
                placeholder="5"
                min="0"
                max="10"
                step="0.1"
                error={!!errors.royaltyBps}
              />
            </FormField>

            <FormField
              label="Allowlist Start"
              help="When the allowlist phase begins."
            >
              <Input
                type="datetime-local"
                value={draft.allowlistStartDate || ''}
                onChange={(e) => updateDraft({ allowlistStartDate: e.target.value || null })}
              />
            </FormField>

            <FormField
              label="Allowlist End"
              help="When the allowlist phase ends."
            >
              <Input
                type="datetime-local"
                value={draft.allowlistEndDate || ''}
                onChange={(e) => updateDraft({ allowlistEndDate: e.target.value || null })}
              />
            </FormField>

            <FormField
              label="Merkle Root"
              help="0x-prefixed root. Leave empty to disable allowlist"
            >
              <Input
                value={draft.merkleRoot || ''}
                onChange={(e) => updateDraft({ merkleRoot: e.target.value as any })}
                placeholder="0x..."
              />
            </FormField>
          </div>
        </Card>

        {/* Optional: Inline allowlist builder for artists */}
        <AllowlistBuilder
          onApply={({ root, addresses, allowlistPrice, allowlistStart, allowlistEnd, maxPerWalletOverride, maxPerTxOverride }) => {
            // Apply computed root and optional overrides to draft
            const updates: Partial<LaunchDraft> = {
              merkleRoot: root as any,
            }
            if (allowlistPrice) updates.allowlistPrice = allowlistPrice
            if (allowlistStart !== undefined) updates.allowlistStartDate = allowlistStart
            if (allowlistEnd !== undefined) updates.allowlistEndDate = allowlistEnd
            if (typeof maxPerWalletOverride === 'number') updates.mintsPerWallet = maxPerWalletOverride
            if (typeof maxPerTxOverride === 'number') updates.maxPerTx = maxPerTxOverride
            updateDraft(updates)
          }}
        />
      </div>

      {/* Preview Card */}
      <div className="lg:col-span-1">
        <Card className="sticky top-8 p-6">
          <h3 className="text-lg font-semibold text-[var(--fg-default)] mb-4">Preview</h3>
          <div className="space-y-4">
            <div className="aspect-square bg-[var(--bg-subtle)] rounded-xl flex items-center justify-center">
              <span className="text-[var(--fg-subtle)]">NFT Image</span>
            </div>
            <div>
              <h4 className="font-medium text-[var(--fg-default)]">
                {draft.baseArtName || 'NFT #'}1
              </h4>
              <p className="text-sm text-[var(--fg-muted)] mt-1">
                {draft.collectionName || 'Collection Name'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--fg-muted)]">Price</span>
              <span className="font-medium text-[var(--fg-default)]">
                {draft.mintCostEth || '0'} HYPE
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="lg:col-span-3 flex justify-end pt-6">
        <Button onClick={validateAndProceed} size="lg">
          Continue
        </Button>
      </div>
    </div>
  )
}
