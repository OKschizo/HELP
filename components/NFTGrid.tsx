'use client'
import { useState } from 'react'
import { Edit, Plus, Trash2, Shuffle } from 'lucide-react'
import { Button } from './ui/Button'
import { NFTEditorModal } from './NFTEditorModal'

interface NFTAttribute {
  trait_type: string
  value: string | number
}

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: NFTAttribute[]
}

interface NFTItem {
  id: string
  file: File
  preview: string
  metadata: NFTMetadata
}

interface NFTGridProps {
  nfts: NFTItem[]
  onUpdateNFT: (id: string, metadata: NFTMetadata) => void
  onDeleteNFT: (id: string) => void
  onDuplicateNFT: (id: string) => void
  onShuffle: () => void
  className?: string
}

export function NFTGrid({ nfts, onUpdateNFT, onDeleteNFT, onDuplicateNFT, onShuffle, className = '' }: NFTGridProps) {
  const [editingNFT, setEditingNFT] = useState<NFTItem | null>(null)

  const handleEditNFT = (nft: NFTItem) => {
    setEditingNFT(nft)
  }

  const handleSaveNFT = (metadata: NFTMetadata) => {
    if (editingNFT) {
      onUpdateNFT(editingNFT.id, metadata)
    }
  }

  const getAttributeCount = (attributes: NFTAttribute[]) => {
    return attributes.filter(attr => attr.trait_type && attr.value).length
  }

  if (nfts.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-[var(--bg-subtle)] rounded-xl flex items-center justify-center">
          <Plus className="w-8 h-8 text-[var(--fg-subtle)]" />
        </div>
        <p className="text-[var(--fg-muted)] font-medium">No NFTs uploaded yet</p>
        <p className="text-sm text-[var(--fg-subtle)]">Drag & drop your collection folder to get started</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-[var(--fg-default)]">NFT Editor</h3>
          <div className="flex items-center space-x-2 text-sm text-[var(--fg-muted)]">
            <span>Supply</span>
            <div className="bg-[var(--hl-cyan)] text-[var(--bg-default)] px-3 py-1 rounded-full font-medium">
              {nfts.length}
            </div>
          </div>
        </div>
        
        <Button
          variant="secondary"
          onClick={onShuffle}
          className="flex items-center space-x-2"
        >
          <Shuffle className="w-4 h-4" />
          <span>Shuffle</span>
        </Button>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((nft) => (
          <div
            key={nft.id}
            className="bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] rounded-xl overflow-hidden hover:border-[var(--stroke-strong)] transition-all duration-200"
          >
            {/* Image */}
            <div className="aspect-square relative overflow-hidden">
              <img
                src={nft.preview}
                alt={nft.metadata.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Name */}
              <h4 className="font-semibold text-[var(--fg-default)] truncate">
                {nft.metadata.name}
              </h4>

              {/* File info */}
              <p className="text-xs text-[var(--fg-muted)]">
                {nft.file.name}
              </p>

              {/* Attributes count */}
              <p className="text-sm text-[var(--fg-muted)]">
                {getAttributeCount(nft.metadata.attributes)} Attributes
              </p>

              {/* Actions */}
              <div className="flex items-center space-x-1 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDuplicateNFT(nft.id)}
                  className="p-2 text-[var(--hl-cyan)] hover:bg-[var(--hl-cyan)]/10"
                  title="Duplicate NFT"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditNFT(nft)}
                  className="flex-1 flex items-center justify-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteNFT(nft.id)}
                  className="p-2 text-red-400 hover:bg-red-400/10"
                  title="Delete NFT"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {editingNFT && (
        <NFTEditorModal
          isOpen={!!editingNFT}
          onClose={() => setEditingNFT(null)}
          onSave={handleSaveNFT}
          initialData={editingNFT.metadata}
          imagePreview={editingNFT.preview}
        />
      )}
    </div>
  )
}
