'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { IMPLEMENTATION_ABI } from '@/lib/contracts'

export default function MintPage() {
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
  const [addresses, setAddresses] = useState<string[] | null>(null)
  const [proof, setProof] = useState<`0x${string}`[] | null>(null)
  const [allowlistActive, setAllowlistActive] = useState(false)
  const [headerUrl, setHeaderUrl] = useState<string>('')
  const [thumbUrl, setThumbUrl] = useState<string>('')
  const [mintedItems, setMintedItems] = useState<{ id: number; image: string }[]>([])

  // tick every second for live timers
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(t)
  }, [])
  const publicPriceWei = (sale as any)?.publicPriceWei ? BigInt((sale as any).publicPriceWei) : 0n
  const allowlistPriceWei = (sale as any)?.allowlistPriceWei ? BigInt((sale as any).allowlistPriceWei) : 0n
  const publicStart = (sale as any)?.publicStart ? Number((sale as any).publicStart) : 0
  const publicEnd = (sale as any)?.publicEnd ? Number((sale as any).publicEnd) : 0
  const maxPerTx = (sale as any)?.maxPerTx ? Number((sale as any).maxPerTx) : 0
  const maxPerWallet = (sale as any)?.maxPerWallet ? Number((sale as any).maxPerWallet) : 0
  const allowlistStart = (sale as any)?.allowlistStart ? Number((sale as any).allowlistStart) : 0
  const allowlistEnd = (sale as any)?.allowlistEnd ? Number((sale as any).allowlistEnd) : 0

  const saleActive = useMemo(() => {
    if (!sale) return false
    if (paused) return false
    if (publicStart && now < publicStart) return false
    if (publicEnd && now > publicEnd) return false
    return true
  }, [sale, paused, now, publicStart, publicEnd])
  
  // Allowlist detection
  const isAllowlistWindow = useMemo(() => {
    if (!sale) return false
    if (!allowlistStart) return false
    if (now < allowlistStart) return false
    if (allowlistEnd && now > allowlistEnd) return false
    // also require a non-zero merkle root
    const hasRoot = typeof merkleRoot === 'string' && /^0x[0-9a-fA-F]{64}$/.test(merkleRoot) && merkleRoot !== '0x' + '0'.repeat(64)
    return hasRoot
  }, [sale, now, allowlistStart, allowlistEnd, merkleRoot])

  const allowlistLive = isAllowlistWindow
  const publicLive = saleActive
  const onAllowlist = Boolean(proof && proof.length > 0)
  const activeMode = allowlistLive && onAllowlist ? 'allowlist' : (publicLive ? 'public' : 'none')
  const activePriceWei = activeMode === 'allowlist' ? allowlistPriceWei : (activeMode === 'public' ? publicPriceWei : 0n)
  const totalPrice = activePriceWei * BigInt(qty || 0)
  const saleLoaded = typeof sale !== 'undefined'

  // slider max logic
  const myMinted = address && mintedByMe ? Number(mintedByMe as any) : 0
  const remainingByWallet = maxPerWallet ? Math.max(0, maxPerWallet - myMinted) : Number.MAX_SAFE_INTEGER
  const remainingSupply = (maxSupply ? Number(maxSupply as any) : 0) - (totalSupply ? Number(totalSupply as any) : 0)
  const sliderMax = Math.max(1, Math.min(
    maxPerTx || Number.MAX_SAFE_INTEGER,
    remainingByWallet || Number.MAX_SAFE_INTEGER,
    remainingSupply || 0
  ))

  // helpers
  const fmtCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.max(0, seconds % 60)
    return `${h}h ${m}m ${s}s`
  }

  // Fetch allowlist addresses from Firestore and compute proof automatically
  useEffect(() => {
    (async () => {
      try {
        setAllowlistActive(isAllowlistWindow)
        if (!isAllowlistWindow) { setAddresses(null); setProof(null); return }
        // Import lazily to avoid SSR issues
        const { UserDatabase } = await import('@/lib/userDatabase')
        const col = await UserDatabase.findCollectionByContractAddress(drop)
        if (!col || !col.currentAllowlistId) { setAddresses(null); setProof(null); return }
        const addrs = await UserDatabase.getAllowlistAddresses(col.id, col.currentAllowlistId)
        setAddresses(addrs)
        if (address && addrs && addrs.length > 0) {
          const { computeProofForAddress } = await import('@/lib/merkle')
          const p = computeProofForAddress(addrs, address)
          setProof(p as any)
        } else {
          setProof(null)
        }
      } catch {
        setAddresses(null); setProof(null)
      }
    })()
  }, [drop, address, isAllowlistWindow])

  const publicCountdown = useMemo(() => {
    if (!sale) return ''
    if (publicStart && now < publicStart) return `Public starts in ${fmtCountdown(publicStart - now)}`
    if (publicEnd && now < publicEnd) return `Public ends in ${fmtCountdown(publicEnd - now)}`
    return ''
  }, [sale, now, publicStart, publicEnd])
  const allowlistCountdown = useMemo(() => {
    if (!sale || !allowlistStart) return ''
    if (now < allowlistStart) return `Allowlist starts in ${fmtCountdown(allowlistStart - now)}`
    if (allowlistEnd && now < allowlistEnd) return `Allowlist ends in ${fmtCountdown(allowlistEnd - now)}`
    return ''
  }, [sale, now, allowlistStart, allowlistEnd])

  // Load collection media from Firestore
  useEffect(() => {
    (async () => {
      try {
        const { UserDatabase } = await import('@/lib/userDatabase')
        const col = await UserDatabase.findCollectionByContractAddress(drop)
        if (col) {
          setHeaderUrl(col.headerImageUrl || '')
          setThumbUrl(col.thumbnailUrl || '')
        }
      } catch {}
    })()
  }, [drop])

  // Load a small grid of recently minted NFTs
  useEffect(() => {
    (async () => {
      try {
        if (!publicClient) return
        const total = Number(totalSupply || 0)
        if (!total) { setMintedItems([]); return }
        const start = Math.max(0, total - 8)
        const ids = Array.from({ length: total - start }, (_, i) => start + i)
        const items: { id: number; image: string }[] = []
        for (const id of ids) {
          try {
            const uri = await publicClient.readContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'tokenURI', args: [BigInt(id)] })
            let image = ''
            try {
              const res = await fetch(String(uri))
              const json = await res.json()
              image = json.image || ''
            } catch {
              image = String(uri)
            }
            items.push({ id, image })
          } catch {
            items.push({ id, image: baseURI ? String(baseURI) + id : '' })
          }
        }
        setMintedItems(items.reverse())
      } catch {}
    })()
  }, [drop, publicClient, totalSupply, baseURI])

  const onMint = async () => {
    setError(null)
    setTx(null)
    try {
      if (activeMode === 'none') throw new Error('Sale not active')
      if (qty <= 0) throw new Error('Quantity must be > 0')
      if (maxPerTx && qty > maxPerTx) throw new Error(`Max per tx is ${maxPerTx}`)
      if (qty > sliderMax) throw new Error(`Quantity exceeds available limit`)
      let hash: any
      if (activeMode === 'allowlist') {
        if (!onAllowlist) throw new Error('Address not on allowlist')
        hash = await writeContract({
          address: drop,
          abi: IMPLEMENTATION_ABI as any,
          functionName: 'mintAllowlist',
          args: [qty, proof],
          value: totalPrice,
        })
      } else if (activeMode === 'public') {
        hash = await writeContract({
          address: drop,
          abi: IMPLEMENTATION_ABI as any,
          functionName: 'mintPublic',
          args: [qty],
          value: totalPrice,
        })
      } else {
        throw new Error('No active mint window')
      }
      setTx(hash as any)
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || 'Mint failed')
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Header image */}
      {headerUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={headerUrl} alt="Header" className="w-full h-48 object-cover rounded-2xl border border-[var(--stroke-soft)]" />
      )}
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            {thumbUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl} alt="Thumbnail" className="w-12 h-12 rounded-xl border border-[var(--stroke-soft)] object-cover" />
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold truncate">{String(collectionName || 'Collection')}</h1>
              <div className="text-[var(--fg-muted)]">{String(collectionSymbol || '')}</div>
            </div>
          </div>
        </div>
        <div className="w-full sm:w-[360px]">
          <Card className="p-6 space-y-4">
            <div className="flex items-baseline justify-between">
              <div className="font-semibold">Mint</div>
              <div className="text-sm text-[var(--fg-muted)]">
                {String(totalSupply ?? 0)} / {String(maxSupply ?? 0)} minted
              </div>
            </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          {paused && <span className="text-xs rounded-full border border-[var(--stroke-soft)] px-2 py-0.5">Paused</span>}
          {allowlistLive && <span className="text-xs rounded-full border border-green-500 text-green-400 px-2 py-0.5">Allowlist Active</span>}
          {publicLive && <span className="text-xs rounded-full border border-[var(--stroke-soft)] px-2 py-0.5">Public Active</span>}
          {!paused && !allowlistLive && !publicLive && (
            <span className="text-xs rounded-full border border-[var(--stroke-soft)] px-2 py-0.5">Inactive</span>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-[var(--fg-muted)] text-sm">Price</div>
          <div className="text-lg">
            {saleLoaded ? `${formatEther(activePriceWei)} HYPE` : '…'}
          </div>
        </div>

        {(allowlistCountdown || publicCountdown) && (
          <div className="space-y-1">
            {allowlistCountdown && <div className="text-sm text-[var(--fg-muted)]">{allowlistCountdown} {onAllowlist ? '(eligible)' : '(not on allowlist)'}</div>}
            {publicCountdown && <div className="text-sm text-[var(--fg-muted)]">{publicCountdown}</div>}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={sliderMax}
              value={Math.min(qty, sliderMax)}
              onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value), sliderMax)))}
              className="w-full"
            />
            <input
              type="number"
              min={1}
              max={sliderMax || undefined}
              value={Math.min(qty, sliderMax)}
              onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value), sliderMax)))}
              className="w-28 rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2"
            />
          </div>
          <div className="text-xs text-[var(--fg-muted)]">Max you can mint now: {sliderMax === Number.MAX_SAFE_INTEGER ? '∞' : sliderMax}</div>
          <div className="text-sm text-[var(--fg-muted)]">Total: {saleLoaded ? `${formatEther(totalPrice)} HYPE` : '…'}</div>
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}
        {tx && (
          <div className="text-sm">
            Tx: <a className="underline" href={`https://hyperevmscan.io/tx/${tx}`} target="_blank" rel="noreferrer">{tx}</a>
          </div>
        )}

        <Button disabled={isPending || activeMode === 'none'} onClick={onMint} variant="outline" className="rounded-xl border border-[var(--stroke-soft)] px-3 py-1.5 hover:bg-[var(--hl-azure)]/10 w-full">
          {isPending ? 'Minting…' : (activeMode === 'allowlist' ? 'Mint (Allowlist)' : (activeMode === 'public' ? 'Mint (Public)' : 'Sale not active'))}
        </Button>
          </Card>
        </div>
      </div>

      {/* Minted grid */}
      {mintedItems.length > 0 && (
        <div className="space-y-3">
          <div className="text-lg font-semibold">Minted NFTs</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {mintedItems.map(it => (
              <Card key={it.id} className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt={`#${it.id}`} className="w-full h-48 object-cover bg-[var(--bg-elevated)]" />
                <div className="p-3 text-sm">
                  <div className="font-medium">{String(collectionName || 'Token')} #{it.id}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Removed duplicate default export that wrapped MintWidget to avoid build error.
