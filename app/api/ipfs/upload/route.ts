import { NextResponse } from 'next/server'
import { PinataSDK } from 'pinata'
import { setProgress, clearProgress } from './progress/store'

export const runtime = 'nodejs'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const POST = async (req: Request) => {
  try {
    // Check if Pinata is configured
    const pinataJwt = process.env.PINATA_JWT
    const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'
    
    if (!pinataJwt) {
      // For development, return mock CIDs
      console.log('⚠️ Pinata not configured, returning mock CIDs for development')
      return NextResponse.json({
        ok: true,
        assetsCID: 'QmMockAssetsCID123456789',
        metaCID: 'QmMockMetaCID123456789',
        message: 'Mock upload (Pinata not configured)'
      })
    }

    const pinata = new PinataSDK({ pinataJwt, pinataGateway })

    const formData = await req.formData()
    const assets = formData.getAll('assets') as File[]
    const metadataPayloadRaw = formData.get('metadataPayload') as string | null

    let assetsCID = null
    let metaCID = null

    // Track progress id for polling
    const progressId = (Math.random().toString(36).slice(2))
    setProgress(progressId, { uploaded: 0, total: assets.length, done: false })

    // Upload assets in confirmed batches to improve reliability
    let assetsDirCID: string | null = null
    if (assets.length > 0) {
      console.log(`📁 Uploading ${assets.length} assets to IPFS in batches...`)
      const BATCH_SIZE = 500 // tune based on account/network
      let uploadedCount = 0
      let firstDir: string | null = null
      for (let start = 0; start < assets.length; start += BATCH_SIZE) {
        const chunk = assets.slice(start, start + BATCH_SIZE)
        const filesOut: File[] = []
        for (let i = 0; i < chunk.length; i++) {
          const f = chunk[i]
          const globalIndex = start + i
          filesOut.push(new File([f], `${globalIndex}${getExt(f.name) || ''}`, { type: f.type }))
        }
        const up = await pinata.upload.public.fileArray(filesOut).name('hyperlaunch-assets-batch')
        const dir = up?.cid || null
        if (!dir) throw new Error('Failed to upload assets batch')
        if (!firstDir) firstDir = dir
        uploadedCount += filesOut.length
        setProgress(progressId, { uploaded: uploadedCount, total: assets.length, done: uploadedCount >= assets.length })
        console.log(`✅ Assets batch uploaded: ${uploadedCount}/${assets.length} (dir=${dir})`)
        // Wait 30s between batches to respect rate limits
        const hasMoreBatches = (start + BATCH_SIZE) < assets.length
        if (hasMoreBatches) {
          await sleep(30000)
        }
      }
      assetsDirCID = firstDir
      assetsCID = assetsDirCID
      console.log(`✅ Assets uploaded. Root dir (first batch) CID: ${assetsCID}`)
    }

    // Build metadata from payload and upload as a folder where filenames are token indexes without extension
    let metadataCount = 0
    if (metadataPayloadRaw) {
      // Pause 30s before starting metadata upload
      if (assets.length > 0) {
        await sleep(30000)
      }
      const payload = JSON.parse(metadataPayloadRaw as string) as Array<{ index: number; name: string; description: string; attributes: any[] }>
      metadataCount = Array.isArray(payload) ? payload.length : 0
      const files: File[] = []
      for (const item of payload) {
        const imagePath = assetsDirCID ? `ipfs://${assetsDirCID}/${item.index}${guessImageExt(assets, item.index)}` : ''
        const json = {
          name: item.name,
          description: item.description,
          image: imagePath,
          attributes: item.attributes || []
        }
        const blob = new Blob([JSON.stringify(json)], { type: 'application/json' })
        // filename without extension to match tokenURI=baseURI+tokenId
        files.push(new File([blob], `${item.index}`, { type: 'application/json' }))
      }
      const uploadMeta = await pinata.upload.public.fileArray(files).name('hyperlaunch-metadata')
      metaCID = uploadMeta?.cid || null
      console.log(`✅ Metadata folder CID: ${metaCID}`)
    }

    clearProgress('')
    return NextResponse.json({
      ok: true,
      assetsCID,
      metaCID,
      progressId,
      message: `Uploaded ${assets.length} assets and ${metadataCount} metadata items`
    })

  } catch (error) {
    console.error('IPFS upload error:', error)
    return NextResponse.json({
      ok: false,
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getExt(name: string): string {
  const m = name.match(/\.[a-zA-Z0-9]+$/)
  return m ? m[0] : ''
}

function guessImageExt(assets: File[], index: number): string {
  const f = assets[index]
  if (!f) return ''
  return getExt(f.name)
}
