'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dropzone } from '@/components/Dropzone'
import { NFTGrid } from '@/components/NFTGrid'
import { LaunchDraft, NFTItem } from '../page'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'

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

interface UploadStepProps {
  draft: LaunchDraft
  updateDraft: (updates: Partial<LaunchDraft>) => void
  onNext: () => void
  onBack: () => void
}

export function UploadStep({ draft, updateDraft, onNext, onBack }: UploadStepProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [bytesUploaded, setBytesUploaded] = useState(0)
  const [bytesTotal, setBytesTotal] = useState(0)

  // Guard against accidental page unload during an active upload
  // (wallet prompts or refresh would otherwise cancel the transfer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [uploading])

  const handleFilesChange = async (assets: File[], metadata: File[] = []) => {
    // Create NFT items from assets
    const nftItems: NFTItem[] = []
    
    for (let index = 0; index < assets.length; index++) {
      const file = assets[index]
      
      // Try to find matching metadata file
      const matchingMetadata = metadata.find(metaFile => {
        const assetNumber = extractNumber(file.name)
        const metaNumber = extractNumber(metaFile.name)
        return assetNumber === metaNumber
      })

      // Parse metadata if available
      let parsedMetadata: NFTMetadata = {
        name: `${draft.baseArtName}${extractNumber(file.name) >= 0 ? extractNumber(file.name) : index}`,
        description: draft.description.replace('{name}', `${draft.baseArtName}${extractNumber(file.name) >= 0 ? extractNumber(file.name) : index}`),
        image: '', // Will be set after IPFS upload
        attributes: []
      }

      if (matchingMetadata) {
        try {
          // Read and parse the JSON metadata file
          const metadataText = await matchingMetadata.text()
          const metadataJson = JSON.parse(metadataText)
          
          // Use the metadata from the JSON file
          parsedMetadata = {
            name: metadataJson.name || parsedMetadata.name,
            description: metadataJson.description || parsedMetadata.description,
            image: metadataJson.image || '',
            attributes: metadataJson.attributes || []
          }
        } catch (error) {
          console.warn('Failed to parse metadata for', matchingMetadata.name, ':', error)
        }
      }

      nftItems.push({
        id: `nft-${index}`,
        file,
        preview: URL.createObjectURL(file),
        metadata: parsedMetadata
      })
    }

    updateDraft({ assets, metadata, nftItems })
  }

  // Helper function to extract number from filename
  const extractNumber = (filename: string): number => {
    const match = filename.match(/(\d+)/)
    return match ? parseInt(match[1]) : -1
  }

  const handleUpdateNFT = (id: string, metadata: NFTMetadata) => {
    const updatedNFTs = draft.nftItems.map(nft => 
      nft.id === id ? { ...nft, metadata } : nft
    )
    updateDraft({ nftItems: updatedNFTs })
  }

  const handleShuffle = () => {
    const shuffled = [...draft.nftItems].sort(() => Math.random() - 0.5)
    updateDraft({ nftItems: shuffled })
    toast.success('NFTs shuffled!')
  }

  const handleDeleteNFT = (id: string) => {
    const nftIndex = draft.nftItems.findIndex(nft => nft.id === id)
    if (nftIndex !== -1) {
      const nftToDelete = draft.nftItems[nftIndex]
      
      // Clean up preview URL
      URL.revokeObjectURL(nftToDelete.preview)
      
      // Remove from arrays
      const updatedNFTs = draft.nftItems.filter(nft => nft.id !== id)
      const updatedAssets = [...draft.assets]
      updatedAssets.splice(nftIndex, 1) // Remove asset at the same index
      
      // Re-index the remaining NFTs
      const reindexedNFTs = updatedNFTs.map((nft, index) => ({
        ...nft,
        id: `nft-${index}`
      }))
      
      updateDraft({ 
        nftItems: reindexedNFTs, 
        assets: updatedAssets 
      })
      
      toast.success('NFT deleted!')
    }
  }

  const handleDuplicateNFT = (id: string) => {
    const nftToDuplicate = draft.nftItems.find(nft => nft.id === id)
    if (nftToDuplicate) {
      // Create a new NFT item with duplicated data
      const newId = `nft-${Date.now()}`
      const duplicatedNFT: NFTItem = {
        id: newId,
        file: nftToDuplicate.file, // Same file reference
        preview: URL.createObjectURL(nftToDuplicate.file), // New preview URL
        metadata: {
          ...nftToDuplicate.metadata,
          name: `${nftToDuplicate.metadata.name} (Copy)`
        }
      }
      
      const updatedNFTs = [...draft.nftItems, duplicatedNFT]
      const updatedAssets = [...draft.assets, nftToDuplicate.file]
      
      updateDraft({ 
        nftItems: updatedNFTs, 
        assets: updatedAssets 
      })
      
      toast.success('NFT duplicated!')
    }
  }

  const handleUpload = async () => {
    if (draft.assets.length === 0) {
      toast.error('Please add some assets before uploading')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setBytesUploaded(0)
    setBytesTotal(0)

    try {
      const formData = new FormData()
      // Add assets (raw files). Server will rename and upload as a directory
      draft.assets.forEach((file) => {
        formData.append('assets', file)
      })
      // Build metadata payload from current edited state so on-chain JSON reflects UI edits
      const metadataPayload = draft.nftItems.map((nft, idx) => ({
        index: idx,
        name: nft.metadata.name,
        description: nft.metadata.description,
        attributes: nft.metadata.attributes || [],
        // image set on server after assets directory CID is known
      }))
      const metadataJson = JSON.stringify(metadataPayload)
      formData.append('metadataPayload', metadataJson)

      // Estimate total bytes (files + metadata JSON). Browser may not provide total in progress.
      const estimatedTotalBytes = draft.assets.reduce((sum, f) => sum + (f?.size || 0), 0) + new Blob([metadataJson]).size
      setBytesTotal(estimatedTotalBytes)

      const response: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/ipfs/upload', true)
        // ensure auth cookies/sessions are sent; defensive even if same-origin
        xhr.withCredentials = true
        xhr.responseType = 'json'
        xhr.upload.onprogress = (e) => {
          const loaded = e.loaded || 0
          setBytesUploaded(loaded)
          const total = e.total && e.total > 0 ? e.total : estimatedTotalBytes || 1
          setBytesTotal(total)
          const pct = Math.min(100, Math.max(0, Math.round((loaded / total) * 100)))
          setUploadProgress(pct)
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(xhr)
          else {
            let details = 'Upload failed'
            try {
              const err = xhr.response
              if (err?.details) details = err.details
              if (err?.error && err?.details) details = `${err.error}: ${err.details}`
            } catch {}
            reject(new Error(details))
          }
        }
        xhr.send(formData)
      })

      setUploadProgress(100)

      const result = (response as XMLHttpRequest).response
      
      updateDraft({
        assetsCID: result.assetsCID,
        metaCID: result.metaCID,
      })

      // Poll server-confirmed progress until done
      if (result?.progressId) {
        const progId = result.progressId as string
        let attempts = 0
        const poll = async () => {
          try {
            const r = await fetch(`/api/ipfs/upload/progress?id=${encodeURIComponent(progId)}`, { cache: 'no-store' })
            const j = await r.json()
            if (j?.progress) {
              const { uploaded, total, done } = j.progress as { uploaded: number; total: number; done: boolean }
              if (total > 0) {
                setUploadProgress(Math.min(100, Math.round((uploaded / total) * 100)))
                setBytesUploaded(uploaded) // using files count as unit for confirmed progress
                setBytesTotal(total)
              }
              if (!done && attempts < 60) {
                attempts++
                setTimeout(poll, 1000)
              }
            }
          } catch {}
        }
        void poll()
      }

      toast.success('Files uploaded successfully!')
      
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
        setBytesUploaded(0)
        setBytesTotal(0)
      }, 1000)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
      setUploading(false)
      setUploadProgress(0)
      setBytesUploaded(0)
      setBytesTotal(0)
    }
  }

  // Require metadata directory CID for proper tokenURI resolution
  const canProceed = draft.assets.length > 0 && !!draft.metaCID

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Show Dropzone if no NFTs, otherwise show NFT Grid */}
      {draft.nftItems.length === 0 ? (
        <Card>
          <h2 className="text-lg font-semibold text-[var(--fg-default)] mb-6">Upload Assets</h2>
          
          <Dropzone
            onFilesChange={handleFilesChange}
            maxSizeMB={150}
            accept={{
              'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
              'application/json': ['.json']
            }}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* NFT Grid */}
          <NFTGrid
            nfts={draft.nftItems}
            onUpdateNFT={handleUpdateNFT}
            onDeleteNFT={handleDeleteNFT}
            onDuplicateNFT={handleDuplicateNFT}
            onShuffle={handleShuffle}
          />

          {/* Upload Section */}
          {!draft.assetsCID && (
            <Card>
              <div className="flex justify-between items-center">
                <div className="text-sm text-[var(--fg-muted)]">
                  {draft.assets.length} assets ready for IPFS upload
                </div>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading}
                  className="min-w-[120px]"
                >
                  {uploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload to IPFS'}
                </Button>
              </div>

              {uploading && (
                <div className="mt-4 space-y-2">
                  <div className="w-full bg-[var(--bg-subtle)] rounded-full h-2">
                    <div 
                      className="bg-[var(--hl-cyan)] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
                    <span>{uploadProgress}%</span>
                    <span>{(bytesUploaded / (1024*1024)).toFixed(2)} MB / {(bytesTotal / (1024*1024)).toFixed(2)} MB</span>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Upload Results */}
      {(draft.assetsCID || draft.metaCID) && (
        <Card>
          <h3 className="text-lg font-semibold text-[var(--fg-default)] mb-4">Upload Results</h3>
          <div className="space-y-3">
            {draft.assetsCID && (
              <div className="flex items-center justify-between p-3 bg-[var(--bg-subtle)] rounded-lg">
                <span className="text-sm text-[var(--fg-muted)]">Assets CID</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-[var(--fg-default)] bg-[var(--bg-elevated)] px-2 py-1 rounded">
                    {draft.assetsCID}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(draft.assetsCID!)}
                    className="p-1 hover:bg-[var(--bg-elevated)] rounded"
                    title="Copy CID"
                  >
                    <Copy className="w-4 h-4 text-[var(--fg-muted)]" />
                  </button>
                </div>
              </div>
            )}
            {draft.metaCID && (
              <div className="flex items-center justify-between p-3 bg-[var(--bg-subtle)] rounded-lg">
                <span className="text-sm text-[var(--fg-muted)]">Metadata CID (baseURI)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-[var(--fg-default)] bg-[var(--bg-elevated)] px-2 py-1 rounded">
                    {draft.metaCID}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(draft.metaCID!)}
                    className="p-1 hover:bg-[var(--bg-elevated)] rounded"
                    title="Copy CID"
                  >
                    <Copy className="w-4 h-4 text-[var(--fg-muted)]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-[var(--bg-elevated)]/50">
        <h3 className="text-lg font-semibold text-[var(--fg-default)] mb-4">IPFS Best Practices</h3>
        <div className="text-sm text-[var(--fg-muted)] space-y-2">
          <p>• Upload assets and metadata files with matching names (e.g., 1.png and 1.json)</p>
          <p>• Metadata files should follow the ERC-721 standard format</p>
          <p>• Images will be pinned to IPFS for permanent storage</p>
          <p>• After deploy, call setBaseURI and setRevealed in the Manage section</p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-6">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!canProceed}
          className="min-w-[120px]"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
