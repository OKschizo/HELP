'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { IMPLEMENTATION_ABI, CHAIN_ID } from '@/lib/contracts'
import { UserDatabase } from '@/lib/userDatabase'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getAuth, signInAnonymously } from 'firebase/auth'
import app from '@/lib/firebase'

export default function MintProPage() {
  const params = useParams() as { address: string }
  const drop = (params?.address || '').toLowerCase() as `0x${string}`
  const { address } = useAccount()
  const { writeContract, isPending } = useWriteContract()
  const publicClient = usePublicClient()

  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [tx, setTx] = useState<string | null>(null)
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000))

  const { data: totalSupply } = useReadContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'totalSupply' })
  const { data: maxSupply } = useReadContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'maxSupply' })
  const { data: collectionName } = useReadContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'name' })
  const { data: collectionSymbol } = useReadContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'symbol' })
  const { data: sale } = useReadContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'saleConfig' })
  const { data: merkleRoot } = useReadContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'merkleRoot' })
  const { data: paused } = useReadContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'paused' })
  const { data: mintedByMe } = useReadContract(address ? { address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'mintedPerWallet', args: [address] } as any : ({} as any))
  const { data: baseURI } = useReadContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'baseURI' })
  const { data: owner } = useReadContract({ chainId: CHAIN_ID, address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'owner' })
  const isOwner = Boolean(owner && address && String(owner).toLowerCase() === address.toLowerCase())

  // Robustly read struct as named or tuple
  const readSaleBig = (key: string, idx: number): bigint => {
    const s: any = sale
    if (!s) return 0n
    if (typeof s[key] !== 'undefined') return BigInt(s[key])
    if (typeof s[idx] !== 'undefined') return BigInt(s[idx])
    return 0n
  }
  const readSaleNum = (key: string, idx: number): number => {
    const s: any = sale
    if (!s) return 0
    if (typeof s[key] !== 'undefined') return Number(s[key])
    if (typeof s[idx] !== 'undefined') return Number(s[idx])
    return 0
  }
  const publicPriceWei = readSaleBig('publicPriceWei', 0)
  const allowlistPriceWei = readSaleBig('allowlistPriceWei', 1)
  const publicStart = readSaleNum('publicStart', 2)
  const publicEnd = readSaleNum('publicEnd', 3)
  const allowlistStart = readSaleNum('allowlistStart', 4)
  const allowlistEnd = readSaleNum('allowlistEnd', 5)
  const maxPerWallet = readSaleNum('maxPerWallet', 6)
  const maxPerTx = readSaleNum('maxPerTx', 7)

  useEffect(() => { const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000); return () => clearInterval(t) }, [])
  const isPaused = Boolean(paused)
  const saleActive = useMemo(() => { if (!sale) return false; if (isPaused) return false; if (publicStart && now < publicStart) return false; if (publicEnd && now > publicEnd) return false; return true }, [sale, isPaused, now, publicStart, publicEnd])
  const isAllowlistWindow = useMemo(() => { if (!sale) return false; if (!allowlistStart) return false; if (now < allowlistStart) return false; if (allowlistEnd && now > allowlistEnd) return false; const hasRoot = typeof merkleRoot === 'string' && /^0x[0-9a-fA-F]{64}$/.test(merkleRoot) && merkleRoot !== '0x' + '0'.repeat(64); return hasRoot }, [sale, now, allowlistStart, allowlistEnd, merkleRoot])
  const [proof, setProof] = useState<`0x${string}`[] | null>(null)
  useEffect(() => { (async () => { try { if (!isAllowlistWindow) { setProof(null); return } const { UserDatabase } = await import('@/lib/userDatabase'); const col = await UserDatabase.findCollectionByContractAddress(drop); if (!col || !col.currentAllowlistId) { setProof(null); return } const addrs = await UserDatabase.getAllowlistAddresses(col.id, col.currentAllowlistId); if (address && addrs?.length) { const { computeProofForAddress } = await import('@/lib/merkle'); setProof(computeProofForAddress(addrs, address) as any) } else { setProof(null) } } catch { setProof(null) } })() }, [drop, address, isAllowlistWindow])

  const allowlistLive = isAllowlistWindow
  const publicLive = saleActive
  const onAllowlist = Boolean(proof && proof.length > 0)
  // Display helper: treat user as eligible in schedule if WL window is live and they could mint per limits
  const wlDisplayEligible = false // computed later after myMinted/remainingSupply
  const activeMode = allowlistLive && onAllowlist ? 'allowlist' : (publicLive ? 'public' : 'none')
  const activePriceWei = activeMode === 'allowlist' ? allowlistPriceWei : (activeMode === 'public' ? publicPriceWei : 0n)
  // For display, show a meaningful upcoming price when sale isn't active
  const displayPriceWei = saleActive
    ? activePriceWei
    : (allowlistStart && now < allowlistStart ? allowlistPriceWei : publicPriceWei)
  const totalPrice = activePriceWei * BigInt(qty || 0)

  const myMinted = address && mintedByMe ? Number(mintedByMe as any) : 0
  const remainingByWallet = maxPerWallet ? Math.max(0, maxPerWallet - myMinted) : Number.MAX_SAFE_INTEGER
  const remainingSupply = (maxSupply ? Number(maxSupply as any) : 0) - (totalSupply ? Number(totalSupply as any) : 0)
  const sliderMax = Math.max(1, Math.min(maxPerTx || Number.MAX_SAFE_INTEGER, remainingByWallet || Number.MAX_SAFE_INTEGER, remainingSupply || 0))
  const wlComputedEligible = useMemo(() => {
    if (!allowlistStart || !allowlistLive) return false
    const canByWallet = maxPerWallet ? (myMinted < maxPerWallet) : true
    const canBySupply = remainingSupply > 0
    return canByWallet && canBySupply
  }, [allowlistStart, allowlistLive, maxPerWallet, myMinted, remainingSupply])

  const [mintedItems, setMintedItems] = useState<{ id: number; image: string; name?: string; attrs?: { trait_type?: string; value?: any }[] }[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const PAGE_SIZE = 24
  const hasMoreMinted = (mintedItems.length < Number(totalSupply || 0))
  const [headerUrl, setHeaderUrl] = useState<string>('')
  const [thumbUrl, setThumbUrl] = useState<string>('')
  const [websiteUrl, setWebsiteUrl] = useState<string>('')
  const [twitterUrl, setTwitterUrl] = useState<string>('')
  const [discordUrl, setDiscordUrl] = useState<string>('')
  const [openseaUrl, setOpenseaUrl] = useState<string>('')
  const [liveMints, setLiveMints] = useState<{ tx: string; to: string; tokenId: bigint; time?: number }[]>([])
  // Reset loaded items on collection change
  useEffect(() => { setMintedItems([]) }, [drop])

  const toGateway = (u: string) => {
    const gw = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/').replace(/\/$/, '/') as string
    if (!u) return u
    if (u.startsWith('ipfs://')) return gw + u.slice(7)
    if (u.startsWith('ipfs/')) return gw + u.slice(5)
    return u
  }

  const loadMoreMinted = async () => {
    try {
      if (!publicClient) return
      const total = Number(totalSupply || 0)
      if (!total) return
      if (loadingMore) return
      const already = mintedItems.length
      const remaining = Math.max(0, total - already)
      if (remaining === 0) return
      const size = Math.min(PAGE_SIZE, remaining)
      setLoadingMore(true)
      const startId = total - 1 - already
      const endId = Math.max(0, startId - size + 1)
      const items: { id: number; image: string; name?: string; attrs?: { trait_type?: string; value?: any }[] }[] = []
      const existingIds = new Set(mintedItems.map(i => i.id))
      for (let id = startId; id >= endId; id--) {
        try {
          const uriRaw = await publicClient.readContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'tokenURI', args: [BigInt(id)] })
          const uri = toGateway(String(uriRaw))
          let image = ''
          let name: string | undefined = undefined
          let attrs: { trait_type?: string; value?: any }[] | undefined = undefined
          try {
            const res = await fetch(uri)
            const json = await res.json()
            const img = String(json.image || '')
            image = img ? toGateway(img) : ''
            if (json && typeof json === 'object') {
              name = typeof json.name === 'string' ? json.name : undefined
              if (Array.isArray((json as any).attributes)) { attrs = (json as any).attributes as any }
            }
          } catch { image = uri }
          if (!existingIds.has(id)) items.push({ id, image, name, attrs })
        } catch {
          const base = String(baseURI || '')
          const composed = base ? (base.startsWith('ipfs://') ? toGateway(base) : base) + id : ''
          if (!existingIds.has(id)) items.push({ id, image: composed })
        }
      }
      setMintedItems(prev => [...prev, ...items])
    } catch {} finally { setLoadingMore(false) }
  }

  // Auto-load first page when supply ready
  useEffect(() => { if (mintedItems.length === 0) { void loadMoreMinted() } }, [totalSupply, publicClient])

  const onMintedScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200
    if (nearBottom && !loadingMore && mintedItems.length < Number(totalSupply || 0)) {
      void loadMoreMinted()
    }
  }

  // Load collection media and links from Firestore if available
  useEffect(() => { (async () => { try { const col = await UserDatabase.findCollectionByContractAddress(drop); if (col) { setHeaderUrl(col.headerImageUrl || ''); setThumbUrl(col.thumbnailUrl || ''); setWebsiteUrl((col as any).websiteUrl || ''); setTwitterUrl((col as any).twitterUrl || ''); setDiscordUrl((col as any).discordUrl || ''); setOpenseaUrl((col as any).openseaUrl || '') } } catch {} })() }, [drop])

  // Editing state (owner only)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDraggingHeader, setIsDraggingHeader] = useState(false)
  const [isDraggingThumb, setIsDraggingThumb] = useState(false)

  const onUpload = async (file: File, kind: 'header' | 'thumb') => {
    try {
      // Sign in anonymously if not already signed in
      const auth = getAuth(app)
      if (!auth.currentUser) {
        await signInAnonymously(auth)
      }
      
      // Get storage instance
      const storage = getStorage(app)
      
      // Create storage reference
      const path = `mint-pages/${drop}/${kind}-${Date.now()}-${file.name}`
      const ref = storageRef(storage, path)
      
      // Upload file
      await uploadBytes(ref, file)
      
      // Get download URL
      const url = await getDownloadURL(ref)
      
      // Update state
      if (kind === 'header') setHeaderUrl(url)
      if (kind === 'thumb') setThumbUrl(url)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    }
  }

  const onSave = async () => {
    try {
      setSaving(true)
      await UserDatabase.updateCollectionByContractAddress(drop, {
        headerImageUrl: headerUrl,
        thumbnailUrl: thumbUrl,
        websiteUrl,
        twitterUrl,
        discordUrl,
        openseaUrl,
      })
      setEditing(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, kind: 'header' | 'thumb') => {
    try {
      e.preventDefault()
      e.stopPropagation()
      if (kind === 'header') setIsDraggingHeader(false)
      if (kind === 'thumb') setIsDraggingThumb(false)
      const file = e.dataTransfer?.files?.[0]
      if (file) {
        await onUpload(file, kind)
      }
    } catch {}
  }

  const onMint = async () => { setError(null); setTx(null); try { if (activeMode === 'none') throw new Error('Sale not active'); if (qty <= 0) throw new Error('Quantity must be > 0'); if (maxPerTx && qty > maxPerTx) throw new Error(`Max per tx is ${maxPerTx}`); if (qty > sliderMax) throw new Error('Quantity exceeds available limit'); let hash: any; if (activeMode === 'allowlist') { if (!onAllowlist) throw new Error('Address not on allowlist'); hash = await writeContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'mintAllowlist', args: [qty, (proof ?? []) as any], value: totalPrice }) } else { hash = await writeContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'mintPublic', args: [qty], value: totalPrice }) } setTx(hash as any) } catch (e: any) { setError(e?.shortMessage || e?.message || 'Mint failed') } }

  // Live mints (poll Transfer(from=0x0) logs)
  useEffect(() => { (async () => {
    try {
      if (!publicClient || !drop) return
      const latest = await publicClient.getBlockNumber()
      const fromBlock = latest > 200000n ? latest - 200000n : 0n
      const ZERO = ('0x' + '0'.repeat(40)) as `0x${string}`
      const ERC721_TRANSFER_EVENT = {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { indexed: true, name: 'from', type: 'address' },
          { indexed: true, name: 'to', type: 'address' },
          { indexed: true, name: 'tokenId', type: 'uint256' },
        ],
      } as const
      const logs = await publicClient.getLogs({ address: drop, event: ERC721_TRANSFER_EVENT as any, fromBlock, toBlock: latest, args: { from: ZERO } as any })
      const out: { tx: string; to: string; tokenId: bigint; time?: number }[] = []
      for (const lg of logs.slice(-25).reverse()) {
        const tokenId = (lg as any).args?.tokenId as bigint
        const to = (lg as any).args?.to as string
        let time: number | undefined
        try { const blk = await publicClient.getBlock({ blockHash: lg.blockHash! }); time = Number(blk.timestamp) } catch {}
        out.push({ tx: lg.transactionHash!, to, tokenId, time })
      }
      setLiveMints(out)
    } catch {}
  })() }, [drop, publicClient, totalSupply])

  return (
    <>
    <div className="fixed inset-0 bg-black/75 -z-40 pointer-events-none" />
    <div className="max-w-screen-2xl mx-auto -mt-8 pt-0 pb-10 px-6 space-y-8">
      

      {/* Header (full-bleed hero) */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        {/* Header image or gradient */}
        {headerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={headerUrl} alt="Header" className="w-full h-64 md:h-80 lg:h-[28rem] object-cover" />
        ) : (
          <div className="w-full h-64 md:h-80 lg:h-[28rem] bg-gradient-to-r from-purple-600/30 to-cyan-600/30" />
        )}
        {/* Feather gradients into page background (top & bottom) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[var(--bg)]/60 to-[var(--bg)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-t from-transparent via-[var(--bg)]/60 to-[var(--bg)]" />
        {/* Overlay: collection header + socials (solid background on top of hero) */}
        <div className="absolute -bottom-6 left-6 w-[520px]">
          <Card className="p-5 bg-black/85 backdrop-blur-sm shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-4">
              {thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl} alt="Avatar" className="w-14 h-14 rounded-full object-cover border border-[var(--stroke-soft)]" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[var(--bg-elevated)] border border-[var(--stroke-soft)]" />
              )}
              <div className="min-w-0">
                <div className="text-2xl font-semibold flex items-center gap-2 truncate">
                  <span className="truncate">{String(collectionName || 'Collection')}</span>
                  <span className="text-[10px] uppercase tracking-wide rounded-full border border-[var(--stroke-soft)] px-2 py-0.5 text-[var(--fg-muted)]">Verified</span>
                </div>
                <div className="text-sm text-[var(--fg-muted)]">
                  By {owner ? (
                    <a className="underline" href={`https://hyperevmscan.io/address/${String(owner)}`} target="_blank" rel="noreferrer">{String(owner).slice(0, 6)}…{String(owner).slice(-4)}</a>
                  ) : '—'}
                </div>
              </div>
            </div>
            {(websiteUrl || twitterUrl || discordUrl || openseaUrl) && (
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {websiteUrl && <a className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-sm hover:bg-[var(--bg-elevated)]" href={websiteUrl} target="_blank" rel="noreferrer">Website</a>}
                {twitterUrl && <a className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-sm hover:bg-[var(--bg-elevated)]" href={twitterUrl} target="_blank" rel="noreferrer" aria-label="X / Twitter">X</a>}
                {discordUrl && <a className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-sm hover:bg-[var(--bg-elevated)]" href={discordUrl} target="_blank" rel="noreferrer">Discord</a>}
                {openseaUrl && (
                  <a className="rounded-full border border-[var(--stroke-soft)] px-2 py-1 hover:bg-[var(--bg-elevated)]" href={openseaUrl} target="_blank" rel="noreferrer" aria-label="OpenSea">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/OPENSEALogomark-Transparent%20White.png" alt="OpenSea" className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </Card>
        </div>
        {isOwner && (
          <div className="absolute -bottom-6 right-6">
            <Button onClick={() => setEditing(v => !v)} variant="secondary">{editing ? 'Close editor' : 'Edit page'}</Button>
          </div>
        )}
      </div>

      
      {/* Top bar counters (below hero, right-aligned to page edge) */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen pr-6">
        <div className="flex items-center justify-end gap-4 text-sm">
          {/* Countdown */}
          <div className="rounded-full border border-[var(--stroke-soft)] px-3 py-1 text-[var(--fg-muted)]">
            {(() => {
              const fmt = (secs: number) => {
                const s = Math.max(0, secs)
                const h = Math.floor(s / 3600)
                const m = Math.floor((s % 3600) / 60)
                const ss = s % 60
                return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
              }
              if (allowlistStart && now < allowlistStart) return `WL starts in ${fmt(allowlistStart - now)}`
              if (allowlistEnd && now <= allowlistEnd && allowlistStart && now >= allowlistStart) return `WL ends in ${fmt(allowlistEnd - now)}`
              if (publicStart && now < publicStart) return `Public starts in ${fmt(publicStart - now)}`
              if (publicEnd && now <= publicEnd) return `Public ends in ${fmt(publicEnd - now)}`
              return 'Sale ended'
            })()}
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="w-40 h-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] overflow-hidden">
              <div className="h-full bg-[var(--hl-azure)]" style={{ width: `${Math.min(100, Math.max(0, Number(totalSupply||0)/Math.max(1, Number(maxSupply||1))*100)).toFixed(1)}%` }} />
            </div>
            <div className="text-[var(--fg-muted)]">{String(totalSupply ?? 0)} / {String(maxSupply ?? 0)}</div>
          </div>
        </div>
      </div>

      {/* Mint panel & schedule */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <div className="px-[20px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
        <div className="md:col-span-2">
          {/* Hero media (preview + thumbnails + attributes) */}
          {(headerUrl || mintedItems.length > 0) && (
              <Card className="p-4 mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 items-start">
                  <div className="lg:col-span-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(mintedItems[0]?.image || headerUrl || thumbUrl) as string}
                    alt="Preview"
                    className="w-full h-80 lg:h-[28rem] object-cover rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-elevated)]"
                  />
                  </div>
                  {mintedItems.length > 1 && (
                    <div className="lg:col-span-1 space-y-3 max-h-[28rem] overflow-auto pr-1">
                    {mintedItems.slice(0, 10).map((it) => (
                      <button key={it.id} className="block w-full text-left" onClick={() => {
                        setMintedItems((prev) => {
                          const idx = prev.findIndex((p) => p.id === it.id)
                          if (idx <= 0) return prev
                          const copy = [...prev]
                          const [sel] = copy.splice(idx, 1)
                          copy.unshift(sel)
                          return copy
                        })
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.image} alt={`#${it.id}`} className="w-full h-20 object-cover rounded-lg border border-[var(--stroke-soft)] hover:opacity-90" />
                      </button>
                    ))}
                    </div>
                  )}
                  {/* Attributes panel (wider) */}
                  <div className="lg:col-span-4">
                    <div className="rounded-xl border border-[var(--stroke-soft)] bg-black/80 p-4 max-h-[28rem] overflow-auto">
                      <div className="text-sm text-[var(--fg-muted)] mb-2">Token</div>
                      <div className="text-lg font-semibold mb-1 break-words">{mintedItems[0]?.name || `${String(collectionName || 'Token')} #${mintedItems[0]?.id ?? ''}`}</div>
                      <div className="text-xs text-[var(--fg-muted)] mb-4">#{mintedItems[0]?.id ?? '—'} {drop ? (<a className="underline ml-2" href={`https://hyperevmscan.io/token/${drop}?a=${mintedItems[0]?.id ?? ''}`} target="_blank" rel="noreferrer">View on explorer</a>) : null}</div>
                      <div className="text-sm font-medium mt-1 mb-2">Attributes</div>
                      {Array.isArray(mintedItems[0]?.attrs) && (mintedItems[0]?.attrs?.length || 0) > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {mintedItems[0]!.attrs!.map((a, idx) => (
                            <div key={`${a?.trait_type ?? 'trait'}-${idx}`} className="rounded-lg bg-[var(--bg)]/40 border border-[var(--stroke-soft)] px-3 py-2">
                              <div className="text-xs text-[var(--fg-muted)] break-words mb-0.5">{String(a?.trait_type ?? 'Trait')}</div>
                              <div className="text-sm font-medium break-words">{String(a?.value ?? '—')}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-[var(--fg-muted)]">No attributes found.</div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
          )}
          {/* Owner-only editor modal handled below */}
          {/* Schedule */}
          <Card className="p-5 mb-6">
            <div className="text-lg font-semibold mb-4">Mint schedule</div>
            <div className="space-y-3">
              {/* Public timeline row */}
              <div className="flex items-start gap-3">
                <div className={`mt-1 w-2 h-2 rounded-full ${publicLive ? 'bg-[var(--hl-azure)] shadow' : 'bg-[var(--fg-muted)]'}`} />
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-2">Public {publicLive && <span className="text-[10px] rounded-full border border-[var(--stroke-soft)] px-2 py-0.5">Active</span>}</div>
                    <div className="text-xs text-[var(--fg-muted)]">{publicStart ? new Date(publicStart * 1000).toUTCString() : '—'} {publicEnd ? '→ ' + new Date(publicEnd * 1000).toUTCString() : ''}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div>{formatEther(publicPriceWei)} HYPE</div>
                    <div className="text-xs text-[var(--fg-muted)]">Limit {maxPerWallet || '∞'} / wallet</div>
                  </div>
                </div>
              </div>
              {/* Allowlist timeline row */}
              {allowlistStart ? (
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full ${allowlistLive ? 'bg-[var(--hl-azure)] shadow' : 'bg-[var(--fg-muted)]'}`} />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">Allowlist {allowlistLive ? ((onAllowlist || wlComputedEligible) ? <span className="text-[10px] rounded-full border border-[var(--stroke-soft)] px-2 py-0.5">Eligible</span> : <span className="text-[10px] rounded-full border border-[var(--stroke-soft)] px-2 py-0.5">Not eligible</span>) : <span className="text-[10px] rounded-full border border-[var(--stroke-soft)] px-2 py-0.5">Scheduled</span>}</div>
                      <div className="text-xs text-[var(--fg-muted)]">{new Date(allowlistStart * 1000).toUTCString()} {allowlistEnd ? '→ ' + new Date(allowlistEnd * 1000).toUTCString() : ''}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{formatEther(allowlistPriceWei)} HYPE</div>
                      <div className="text-xs text-[var(--fg-muted)]">Limit {maxPerWallet || '∞'} / wallet</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
          {/* Live mints & Minted grid */}
          <div className="space-y-6">
            {liveMints.length > 0 && (
              <div>
                <div className="text-lg font-semibold mb-2">Live mints</div>
                <div className="overflow-hidden rounded-xl border border-[var(--stroke-soft)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--bg-elevated)] text-[var(--fg-muted)]">
                      <tr>
                        <th className="text-left px-3 py-2">Token</th>
                        <th className="text-left px-3 py-2">To</th>
                        <th className="text-left px-3 py-2">Time</th>
                        <th className="text-left px-3 py-2">Tx</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveMints.map((m) => (
                        <tr key={m.tx} className="border-t border-[var(--stroke-soft)]">
                          <td className="px-3 py-2">#{String(m.tokenId)}</td>
                          <td className="px-3 py-2 font-mono">{m.to.slice(0,6)}…{m.to.slice(-4)}</td>
                          <td className="px-3 py-2">{m.time ? new Date(m.time*1000).toLocaleTimeString() : '—'}</td>
                          <td className="px-3 py-2"><a className="underline" href={`https://hyperevmscan.io/tx/${m.tx}`} target="_blank" rel="noreferrer">View</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {mintedItems.length > 0 && (
              <div className="space-y-3">
                <div className="text-lg font-semibold">Minted NFTs</div>
                <div className="rounded-xl border border-[var(--stroke-soft)]">
                  <div className="max-h-[70vh] overflow-auto p-4" onScroll={onMintedScroll}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                      {mintedItems.map(it => (
                        <Card key={it.id} className="overflow-hidden group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={it.image} alt={`#${it.id}`} loading="lazy" className="w-full h-48 object-cover bg-[var(--bg-elevated)]" />
                          <div className="p-3 text-sm flex items-center justify-between">
                            <div className="font-medium truncate">{String(collectionName || 'Token')} #{it.id}</div>
                            <a className="opacity-0 group-hover:opacity-100 transition-opacity underline text-xs" href={`https://hyperevmscan.io/token/${drop}?a=${it.id}`} target="_blank" rel="noreferrer">View</a>
                          </div>
                        </Card>
                      ))}
                    </div>
                    {hasMoreMinted && (
                      <div className="flex justify-center py-4">
                        <Button onClick={loadMoreMinted} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="md:col-span-1 md:sticky md:top-6 self-start">
          <Card className="p-6 space-y-4">
            <div className="flex items-baseline justify-between">
              <div className="font-semibold">Mint</div>
              <div className="text-sm text-[var(--fg-muted)]">{String(totalSupply ?? 0)} / {String(maxSupply ?? 0)}</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {!isPaused && (allowlistStart ? <span className="rounded-full border border-[var(--stroke-soft)] px-2 py-0.5">Allowlist</span> : <span className="rounded-full border border-[var(--stroke-soft)] px-2 py-0.5">Public</span>)}
              {isPaused && <span className="rounded-full border border-[var(--stroke-soft)] px-2 py-0.5">Paused</span>}
            </div>
            <div className="space-y-1">
              <div className="text-[var(--fg-muted)] text-sm">Price</div>
              <div className="text-lg">{sale ? `${formatEther(displayPriceWei)} HYPE` : '…'}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={sliderMax} value={Math.min(qty, sliderMax)} onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value), sliderMax)))} className="w-full" />
                <input type="number" min={1} max={sliderMax || undefined} value={Math.min(qty, sliderMax)} onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value), sliderMax)))} className="w-24 rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
              </div>
              <div className="text-xs text-[var(--fg-muted)]">Max you can mint now: {sliderMax === Number.MAX_SAFE_INTEGER ? '∞' : sliderMax}</div>
              <div className="text-sm text-[var(--fg-muted)]">Total: {sale ? `${formatEther(displayPriceWei * BigInt(qty || 0))} HYPE` : '…'}</div>
              {/* Allowlist messaging */}
              {allowlistLive && !onAllowlist && !publicLive && (
                <div className="text-xs text-red-400">Not on allowlist for the current phase. Connect an eligible wallet.</div>
              )}
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            {tx && <div className="text-sm">Tx: <a className="underline" href={`https://hyperevmscan.io/tx/${tx}`} target="_blank" rel="noreferrer">{tx}</a></div>}
            <Button disabled={isPending || activeMode === 'none'} onClick={onMint} className="w-full">{isPending ? 'Minting…' : (activeMode === 'allowlist' ? 'Mint (Allowlist)' : (activeMode === 'public' ? 'Mint (Public)' : 'Sale not active'))}</Button>
          </Card>
        </div>
          </div>
        </div>
      </div>

      {/* Owner-only editor modal */}
      {isOwner && editing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditing(false)} />
          <div className="absolute inset-0 flex items-start justify-center pt-20 px-4">
            <div className="w-full max-w-3xl">
              <Card className="p-5 bg-black/70 border border-[var(--stroke-soft)] shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold">Appearance & Links</div>
                  <Button variant="secondary" onClick={() => setEditing(false)}>Close</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Header image uploader */}
                  <div className="space-y-3">
                    <div className="text-sm">Header image</div>
                    <div
                      className={`relative rounded-xl border ${isDraggingHeader ? 'border-[var(--hl-azure)]' : 'border-[var(--stroke-soft)]'} bg-[var(--bg-elevated)] overflow-hidden grid place-items-center text-center`}
                      style={{ aspectRatio: '1 / 1' }}
                      onDragOver={(e) => { e.preventDefault(); if (!isDraggingHeader) setIsDraggingHeader(true) }}
                      onDragLeave={() => setIsDraggingHeader(false)}
                      onDrop={(e) => handleDrop(e, 'header')}
                    >
                      {headerUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={headerUrl} alt="Header preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                      ) : (
                        <div className="px-4 text-sm text-[var(--fg-muted)]">
                          <div>Drag & drop header here</div>
                          <div className="text-xs">or click Upload</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <label className="rounded-xl border border-[var(--stroke-soft)] px-3 py-2 text-sm cursor-pointer hover:bg-[var(--bg-elevated)]">
                        <input className="hidden" type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f, 'header') }} />
                        Upload
                      </label>
                      <div className="flex-1">
                        <div className="text-xs text-[var(--fg-muted)] mb-1">Header image URL</div>
                        <input type="url" placeholder="https://" value={headerUrl} onChange={e => setHeaderUrl(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
                      </div>
                    </div>
                  </div>
                  {/* Thumbnail uploader */}
                  <div className="space-y-3">
                    <div className="text-sm">Thumbnail image</div>
                    <div
                      className={`relative rounded-xl border ${isDraggingThumb ? 'border-[var(--hl-azure)]' : 'border-[var(--stroke-soft)]'} bg-[var(--bg-elevated)] overflow-hidden grid place-items-center text-center`}
                      style={{ aspectRatio: '1 / 1' }}
                      onDragOver={(e) => { e.preventDefault(); if (!isDraggingThumb) setIsDraggingThumb(true) }}
                      onDragLeave={() => setIsDraggingThumb(false)}
                      onDrop={(e) => handleDrop(e, 'thumb')}
                    >
                      {thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbUrl} alt="Thumbnail preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                      ) : (
                        <div className="px-4 text-sm text-[var(--fg-muted)]">
                          <div>Drag & drop thumbnail here</div>
                          <div className="text-xs">or click Upload</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <label className="rounded-xl border border-[var(--stroke-soft)] px-3 py-2 text-sm cursor-pointer hover:bg-[var(--bg-elevated)]">
                        <input className="hidden" type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f, 'thumb') }} />
                        Upload
                      </label>
                      <div className="flex-1">
                        <div className="text-xs text-[var(--fg-muted)] mb-1">Thumbnail image URL</div>
                        <input type="url" placeholder="https://" value={thumbUrl} onChange={e => setThumbUrl(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-xs text-[var(--fg-muted)] mb-1">Website URL</div>
                    <input type="url" placeholder="https://" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--fg-muted)] mb-1">X / Twitter URL</div>
                    <input type="url" placeholder="https://" value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--fg-muted)] mb-1">Discord URL</div>
                    <input type="url" placeholder="https://" value={discordUrl} onChange={e => setDiscordUrl(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--fg-muted)] mb-1">OpenSea collection URL</div>
                    <input type="url" placeholder="https://" value={openseaUrl} onChange={e => setOpenseaUrl(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
                  </div>
                </div>
                <div className="flex justify-end mt-5">
                  <Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
                </div>
                <div className="text-xs text-[var(--fg-muted)] mt-2">Only the on-chain owner can modify these settings.</div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}


