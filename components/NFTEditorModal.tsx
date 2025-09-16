'use client'
import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { FormField } from './ui/FormField'

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

interface NFTEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (metadata: NFTMetadata) => void
  initialData: NFTMetadata
  imagePreview: string
}

export function NFTEditorModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  imagePreview
}: NFTEditorModalProps) {
  const [metadata, setMetadata] = useState<NFTMetadata>(initialData)
  const [immutable, setImmutable] = useState(false)

  useEffect(() => {
    setMetadata(initialData)
  }, [initialData])

  const addAttribute = () => {
    setMetadata(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }))
  }

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setMetadata(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: field === 'value' ? (isNaN(Number(value)) ? value : Number(value)) : value } : attr
      )
    }))
  }

  const removeAttribute = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }))
  }

  const handleSave = () => {
    // Filter out empty attributes
    const cleanedMetadata = {
      ...metadata,
      attributes: metadata.attributes.filter(attr => {
        const traitType = typeof attr.trait_type === 'string' ? attr.trait_type.trim() : String(attr.trait_type || '').trim()
        const value = typeof attr.value === 'string' ? attr.value.trim() : String(attr.value || '').trim()
        return traitType && value
      })
    }
    onSave(cleanedMetadata)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--stroke-soft)]">
          <h2 className="text-xl font-semibold text-[var(--fg-default)]">NFT Editor</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Image Preview */}
            <div className="text-center">
              <div className="inline-block relative">
                <img
                  src={imagePreview}
                  alt={metadata.name}
                  className="w-48 h-48 object-cover rounded-xl border border-[var(--stroke-soft)]"
                />
                <div className="absolute -top-2 -right-2 bg-[var(--hl-cyan)] text-[var(--bg-default)] px-2 py-1 rounded-full text-xs font-medium">
                  Image
                </div>
              </div>
            </div>

            {/* Name */}
            <FormField label="Name" required>
              <Input
                value={metadata.name}
                onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
                placeholder="NFT #0"
              />
            </FormField>

            {/* Immutable Toggle */}
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-[var(--fg-default)]">
                Immutable
              </label>
              <button
                type="button"
                onClick={() => setImmutable(!immutable)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  immutable 
                    ? 'bg-[var(--hl-cyan)]' 
                    : 'bg-[var(--bg-subtle)]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    immutable ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Description */}
            <FormField label="Description">
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="NFT #0 - Generated and deployed on LaunchMyNFT"
                rows={3}
                className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] rounded-xl text-[var(--fg-default)] placeholder-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--hl-azure)] focus:border-transparent resize-none"
              />
            </FormField>

            {/* Attributes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--fg-default)]">
                  Attributes
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addAttribute}
                  className="text-[var(--hl-cyan)] hover:bg-[var(--hl-cyan)]/10"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {metadata.attributes.map((attribute, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Input
                      value={attribute.trait_type}
                      onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                      placeholder="Trait Type (e.g., Background)"
                      className="flex-1"
                    />
                    <Input
                      value={String(attribute.value)}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      placeholder="Value (e.g., Blue)"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttribute(index)}
                      className="p-2 text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {metadata.attributes.length === 0 && (
                  <div className="text-center py-8 text-[var(--fg-muted)]">
                    <p className="text-sm">No attributes yet</p>
                    <p className="text-xs">Click "Add" to create trait/value pairs</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-[var(--stroke-soft)] bg-[var(--bg-subtle)]">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
