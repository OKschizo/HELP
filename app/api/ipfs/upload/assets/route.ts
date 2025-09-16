import { NextResponse } from 'next/server'
import { PinataSDK } from 'pinata'

export const runtime = 'nodejs'

export const POST = async (req: Request) => {
  try {
    const pinataJwt = process.env.PINATA_JWT
    const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'
    if (!pinataJwt) {
      return NextResponse.json({ ok: false, error: 'Pinata not configured' }, { status: 500 })
    }
    const pinata = new PinataSDK({ pinataJwt, pinataGateway })

    const formData = await req.formData()
    const startIndexRaw = formData.get('startIndex') as string | null
    const startIndex = startIndexRaw ? parseInt(startIndexRaw, 10) : 0
    const assets = formData.getAll('assets') as File[]

    if (!assets || assets.length === 0) {
      return NextResponse.json({ ok: false, error: 'No assets provided' }, { status: 400 })
    }

    // Rename files to their global index so metadata can reference ipfs://{dirCID}/{index}{ext}
    const filesOut: File[] = []
    const fileInfos: { index: number; ext: string }[] = []
    for (let i = 0; i < assets.length; i++) {
      const f = assets[i]
      const idx = startIndex + i
      const ext = getExt(f.name)
      const renamed = new File([f], `${idx}${ext}`, { type: f.type })
      filesOut.push(renamed)
      fileInfos.push({ index: idx, ext })
    }

    const upload = await pinata.upload.public.fileArray(filesOut).name('hyperlaunch-assets-batch')
    const dirCID = upload?.cid || null
    if (!dirCID) throw new Error('Failed to get assets directory CID')

    return NextResponse.json({ ok: true, dirCID, files: fileInfos })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Upload failed' }, { status: 500 })
  }
}

function getExt(name: string): string {
  const m = name.match(/\.[a-zA-Z0-9]+$/)
  return m ? m[0] : ''
}




