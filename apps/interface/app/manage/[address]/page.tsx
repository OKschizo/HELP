'use client'
import { useEffect, useMemo, useState } from 'react'
import { useAccount, useBalance, useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { IMPLEMENTATION_ABI, CHAIN_ID } from '@/lib/contracts'
import { Card } from '@/components/ui/Card'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/ui/Button'
import { formatEther, parseEther } from 'viem'
import { computeRootFromAddresses } from '@/lib/merkle'
import { UserDatabase } from '@/lib/userDatabase'
import AllowlistRounds from './AllowlistRounds'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getAuth, signInAnonymously } from 'firebase/auth'
import app from '@/lib/firebase'

function ManageContent({ params }: { params: { address: string } }) {
  const drop = params.address as `0x${string}`
  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(drop)
  const { address: wallet } = useAccount()
  const { data: owner, isLoading: ownerLoading, error: ownerError } = useReadContract({ chainId: CHAIN_ID, address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'owner' })
  const { data: pendingOwner } = useReadContract({ chainId: CHAIN_ID, address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'pendingOwner' as any })
  const { data: baseURI } = useReadContract({ chainId: CHAIN_ID, address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'baseURI' })
  const { data: sale } = useReadContract({ chainId: CHAIN_ID, address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'saleConfig' })
  const { data: platformFeeBps } = useReadContract({ chainId: CHAIN_ID, address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'platformFeeBps' })
  const { data: platformFeeReceiver } = useReadContract({ chainId: CHAIN_ID, address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'platformFeeReceiver' })
  const bal = useBalance({ chainId: CHAIN_ID, address: drop })
  const { writeContract, isPending } = useWriteContract()
  const publicClient = usePublicClient()

  const isOwner = Boolean(owner && wallet && (owner as string).toLowerCase() === wallet.toLowerCase())
  const [newBase, setNewBase] = useState('')
  const [tx, setTx] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [form, setForm] = useState({
    publicPrice: '',
    allowlistPrice: '',
    publicStart: '',
    publicEnd: '',
    allowlistStart: '',
    allowlistEnd: '',
    maxPerWallet: '',
    maxPerTx: ''
  })
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadCount, setUploadCount] = useState<number | null>(null)
  const [computedRoot, setComputedRoot] = useState<`0x${string}` | null>(null)
  const [roundName, setRoundName] = useState('Allowlist Phase')
  const [roundPrice, setRoundPrice] = useState('')
  const [roundStart, setRoundStart] = useState('')
  const [roundEnd, setRoundEnd] = useState('')
  const [uploadedAddresses, setUploadedAddresses] = useState<string[] | null>(null)
  const [addressSearch, setAddressSearch] = useState('')
  const [addressToAdd, setAddressToAdd] = useState('')
  const [allowlistVersion, setAllowlistVersion] = useState(0)
  const [phaseMaxPerWallet, setPhaseMaxPerWallet] = useState('')
  const [phaseMaxPerTx, setPhaseMaxPerTx] = useState('')
  const [headerUploadError, setHeaderUploadError] = useState<string | null>(null)
  const [thumbUploadError, setThumbUploadError] = useState<string | null>(null)
  const [headerUrl, setHeaderUrl] = useState<string>('')
  const [thumbUrl, setThumbUrl] = useState<string>('')
  const [websiteUrl, setWebsiteUrl] = useState<string>('')
  const [twitterUrl, setTwitterUrl] = useState<string>('')
  const [discordUrl, setDiscordUrl] = useState<string>('')
  const [openseaUrl, setOpenseaUrl] = useState<string>('')
  const [isDraggingHeader, setIsDraggingHeader] = useState(false)
  const [isDraggingThumb, setIsDraggingThumb] = useState(false)
  const [savingMedia, setSavingMedia] = useState(false)

  // Optional override after we write and re-read fresh on-chain values
  const [overrideSale, setOverrideSale] = useState<any | null>(null)
  const effectiveSale = (overrideSale ?? sale) as any

  // Compute sale preview unconditionally (hooks must not be after conditional returns)
  const saleObj = effectiveSale as any
  const salePreview = useMemo(() => ({
    publicPriceWei: saleObj?.publicPriceWei ? BigInt(saleObj.publicPriceWei) : 0n,
    allowlistPriceWei: saleObj?.allowlistPriceWei ? BigInt(saleObj.allowlistPriceWei) : 0n,
    publicStart: saleObj?.publicStart ? Number(saleObj.publicStart) : 0,
    publicEnd: saleObj?.publicEnd ? Number(saleObj.publicEnd) : 0,
    allowlistStart: saleObj?.allowlistStart ? Number(saleObj.allowlistStart) : 0,
    allowlistEnd: saleObj?.allowlistEnd ? Number(saleObj.allowlistEnd) : 0,
    maxPerWallet: saleObj?.maxPerWallet ? Number(saleObj.maxPerWallet) : 0,
    maxPerTx: saleObj?.maxPerTx ? Number(saleObj.maxPerTx) : 0,
  }), [saleObj])

  // Prefill form inputs with current on-chain state when page loads
  const [prefilled, setPrefilled] = useState(false)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (prefilled || cancelled) return
        // Attempt to use hook data; if absent, read directly from chain
        let cur: any = saleObj
        if (typeof sale === 'undefined' && publicClient) {
          try {
            const fresh = await publicClient.readContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'saleConfig', args: [] as any })
            if (!cancelled) cur = fresh
          } catch {}
        }
        if (!cur || cancelled) return
        const toNum = (k: string, i: number) => (typeof cur?.[k] !== 'undefined' ? Number(cur[k]) : (typeof cur?.[i] !== 'undefined' ? Number(cur[i]) : 0))
        const toBig = (k: string, i: number) => (typeof cur?.[k] !== 'undefined' ? BigInt(cur[k]) : (typeof cur?.[i] !== 'undefined' ? BigInt(cur[i]) : 0n))
        const curPublicPrice = toBig('publicPriceWei', 0)
        const curAllowPrice = toBig('allowlistPriceWei', 1)
        const curPublicStart = toNum('publicStart', 2)
        const curPublicEnd = toNum('publicEnd', 3)
        const curAllowStart = toNum('allowlistStart', 4)
        const curAllowEnd = toNum('allowlistEnd', 5)
        const curMaxPerWallet = toNum('maxPerWallet', 6)
        const curMaxPerTx = toNum('maxPerTx', 7)

        const next: typeof form = { ...form }
        // Prices
        next.publicPrice = curPublicPrice ? formatEther(curPublicPrice) : ''
        next.allowlistPrice = curAllowPrice ? formatEther(curAllowPrice) : ''
        // Windows (datetime-local expects yyyy-MM-ddTHH:mm)
        const toLocal = (ts: number) => ts ? new Date(ts * 1000).toISOString().slice(0, 16) : ''
        next.publicStart = toLocal(curPublicStart)
        next.publicEnd = toLocal(curPublicEnd)
        next.allowlistStart = toLocal(curAllowStart)
        next.allowlistEnd = toLocal(curAllowEnd)
        // Limits
        next.maxPerWallet = curMaxPerWallet ? String(curMaxPerWallet) : ''
        next.maxPerTx = curMaxPerTx ? String(curMaxPerTx) : ''
        if (cancelled) return
        setForm(next)
        // Also show current WL fields above for context
        setRoundPrice(curAllowPrice ? formatEther(curAllowPrice) : '')
        setRoundStart(toLocal(curAllowStart))
        setRoundEnd(toLocal(curAllowEnd))
        setPhaseMaxPerWallet(curMaxPerWallet ? String(curMaxPerWallet) : '')
        setPhaseMaxPerTx(curMaxPerTx ? String(curMaxPerTx) : '')
        // Prefill BaseURI field once
        if (!newBase && baseURI) setNewBase(String(baseURI))
        setPrefilled(true)
      } catch {}
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale, publicClient, drop, baseURI, prefilled])

  // Confirmation modal state
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmNext, setConfirmNext] = useState<any | null>(null)
  const [confirmMerkle, setConfirmMerkle] = useState<`0x${string}` | null>(null)
  const [confirming, setConfirming] = useState(false)
  const openConfirm = (title: string, next: any, merkleRoot?: `0x${string}` | null) => {
    setConfirmTitle(title)
    setConfirmNext(next)
    setConfirmMerkle(merkleRoot ?? null)
    setConfirmVisible(true)
  }
  const proceedConfirm = async () => {
    if (!confirmNext) return
    setConfirming(true)
    try {
      await call('updateSaleConfig', [confirmNext as any])
      setOverrideSale(confirmNext as any)
      if (confirmMerkle) {
        await call('updateMerkleRoot', [confirmMerkle])
      }
      setConfirmVisible(false)
    } catch (e) {
      // errors already surfaced by call()
    } finally {
      setConfirming(false)
    }
  }

  // Load collection media/links from Firestore
  useEffect(() => { (async () => {
    try {
      const col = await UserDatabase.findCollectionByContractAddress(drop)
      if (col) {
        setHeaderUrl(col.headerImageUrl || '')
        setThumbUrl(col.thumbnailUrl || '')
        setWebsiteUrl((col as any).websiteUrl || '')
        setTwitterUrl((col as any).twitterUrl || '')
        setDiscordUrl((col as any).discordUrl || '')
        setOpenseaUrl((col as any).openseaUrl || '')
      }
    } catch {}
  })() }, [drop])

  const uploadMedia = async (file: File, kind: 'header' | 'thumb') => {
    // Ensure anonymous auth for Storage rules
    const auth = getAuth(app as any)
    if (!auth.currentUser) {
      try { await signInAnonymously(auth) } catch {}
    }
    const storage = getStorage(app as any)
    const key = `manage-media/${drop}/${kind}-${Date.now()}-${file.name}`
    const r = storageRef(storage, key)
    await uploadBytes(r, file)
    const url = await getDownloadURL(r)
    if (kind === 'header') setHeaderUrl(url)
    if (kind === 'thumb') setThumbUrl(url)
  }

  const handleMediaDrop = async (e: React.DragEvent<HTMLDivElement>, kind: 'header' | 'thumb') => {
    e.preventDefault()
    e.stopPropagation()
    if (kind === 'header') setIsDraggingHeader(false)
    if (kind === 'thumb') setIsDraggingThumb(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) await uploadMedia(f, kind)
  }

  const saveMedia = async () => {
    try {
      setSavingMedia(true)
      await UserDatabase.updateCollectionByContractAddress(drop, {
        headerImageUrl: headerUrl,
        thumbnailUrl: thumbUrl,
        websiteUrl,
        twitterUrl,
        discordUrl,
        openseaUrl,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setSavingMedia(false)
    }
  }

  

  

  const call = async (fn: string, args: any[] = [], value?: bigint) => {
    setErr(null)
    setTx(null)
    try {
      const hash = await writeContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: fn as any, args, value })
      setTx(hash as any)
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || 'Tx failed')
    }
  }

  if (!isValidAddress) return <div className="text-[var(--fg-muted)]">Invalid contract address.</div>
  if (!wallet) return <div className="text-[var(--fg-muted)]">Connect your wallet to manage.</div>
  if (ownerLoading) return <div className="text-[var(--fg-muted)]">Loading ownership…</div>
  if (ownerError) return <div className="text-[var(--fg-muted)]">Failed to read owner(). Make sure you are on the correct chain.</div>
  if (!isOwner && (!pendingOwner || (pendingOwner as string).toLowerCase() !== (wallet || '').toLowerCase())) return (
    <div className="text-[var(--fg-muted)] space-y-2">
      <div>Connected wallet is not the owner of this collection.</div>
      <div className="text-xs font-mono">owner(): {String(owner || 'unknown')}</div>
      <div className="text-xs font-mono">wallet: {String(wallet)}</div>
      <div className="text-xs">chainId: {CHAIN_ID}</div>
    </div>
  )

  // Ownership acceptance panel
  if (!isOwner && pendingOwner && (pendingOwner as string).toLowerCase() === (wallet || '').toLowerCase()) {
    return (
      <Card className="space-y-3 p-6">
        <div className="text-xl font-semibold">Accept Ownership</div>
        <div className="text-sm text-[var(--fg-muted)]">Ownership transfer is pending. Accept to become the owner.</div>
        <div className="text-xs font-mono">pendingOwner: {String(pendingOwner)}</div>
        {err && <div className="text-red-400 text-sm">{err}</div>}
        {tx && <div className="text-sm">Tx: <a className="underline" target="_blank" rel="noreferrer" href={`https://hyperevmscan.io/tx/${tx}`}>{tx}</a></div>}
        <Button disabled={isPending} onClick={() => call('acceptOwnership')}>Accept Ownership</Button>
      </Card>
    )
  }

  const feeBps = Number(platformFeeBps || 0)
  const contractBalance = bal.data?.value || 0n
  const platformFee = (contractBalance * BigInt(feeBps)) / 10000n
  const creatorAmount = contractBalance - platformFee

  const submitSale = async () => {
    setErr(null)
    try {
      const toTs = (s: string) => (s ? Math.floor(new Date(s).getTime() / 1000) : 0)
      // Read fresh on-chain sale to preserve untouched fields
      let cur: any = saleObj
      try {
        if (publicClient) {
          cur = await publicClient.readContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'saleConfig', args: [] as any })
        }
      } catch {}
      const getNum = (k: string, i: number) => (typeof cur?.[k] !== 'undefined' ? Number(cur[k]) : (typeof cur?.[i] !== 'undefined' ? Number(cur[i]) : 0))
      const getBig = (k: string, i: number) => (typeof cur?.[k] !== 'undefined' ? BigInt(cur[k]) : (typeof cur?.[i] !== 'undefined' ? BigInt(cur[i]) : 0n))
      const next = {
        publicPriceWei: form.publicPrice ? parseEther(form.publicPrice) : getBig('publicPriceWei', 0),
        allowlistPriceWei: form.allowlistPrice ? parseEther(form.allowlistPrice) : getBig('allowlistPriceWei', 1),
        publicStart: form.publicStart ? BigInt(toTs(form.publicStart)) : BigInt(getNum('publicStart', 2)),
        publicEnd: form.publicEnd ? BigInt(toTs(form.publicEnd)) : BigInt(getNum('publicEnd', 3)),
        allowlistStart: form.allowlistStart ? BigInt(toTs(form.allowlistStart)) : BigInt(getNum('allowlistStart', 4)),
        allowlistEnd: form.allowlistEnd ? BigInt(toTs(form.allowlistEnd)) : BigInt(getNum('allowlistEnd', 5)),
        maxPerWallet: form.maxPerWallet ? BigInt(Number(form.maxPerWallet)) : BigInt(getNum('maxPerWallet', 6)),
        maxPerTx: form.maxPerTx ? BigInt(Number(form.maxPerTx)) : BigInt(getNum('maxPerTx', 7)),
      }
      // Open confirmation modal instead of executing immediately
      openConfirm('Update Public Sale', next)
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || 'Update failed')
    }
  }

  const parseAddresses = async (file: File) => {
    setUploadError(null)
    try {
      const text = await file.text()
      let addrs: string[] = []
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text)
        addrs = Array.isArray(parsed) ? parsed : parsed.addresses || []
      } else {
        addrs = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      }
      // Basic validation
      addrs = addrs.filter(a => /^0x[a-fA-F0-9]{40}$/.test(a))
      if (addrs.length === 0) throw new Error('No valid addresses found')
      const { root } = computeRootFromAddresses(addrs)
      setUploadedAddresses(addrs)
      setUploadCount(addrs.length)
      setComputedRoot(root)
    } catch (e: any) {
      setUploadError(e?.message || 'Failed to parse file')
      setUploadedAddresses(null)
      setUploadCount(null)
      setComputedRoot(null)
    }
  }

  const savePhase = async () => {
    if (!uploadedAddresses || !computedRoot) return
    setErr(null)
    try {
      const col = await UserDatabase.findCollectionByContractAddress(drop)
      if (!col) {
        console.warn('[Allowlist] No collection found for', drop)
      }
      if (col) {
        const roundId = `${Date.now()}`
        await UserDatabase.addAllowlistRound(col.id, {
          id: roundId,
          name: roundName || 'Allowlist Phase',
          root: computedRoot,
          size: uploadCount || uploadedAddresses.length,
          priceWei: roundPrice ? parseEther(roundPrice).toString() : undefined,
          startsAt: roundStart ? new Date(roundStart) : undefined,
          endsAt: roundEnd ? new Date(roundEnd) : undefined,
          maxPerWallet: phaseMaxPerWallet ? Number(phaseMaxPerWallet) : undefined,
          maxPerTx: phaseMaxPerTx ? Number(phaseMaxPerTx) : undefined,
          addresses: uploadedAddresses,
        })
        await UserDatabase.setCurrentAllowlist(col.id, roundId)
        setAllowlistVersion(v => v + 1)
      }
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || 'Failed to save phase')
    }
  }

  const activateAllowlist = async () => {
    if (!uploadedAddresses || !computedRoot) return
    setErr(null)
    try {
      // Read fresh on-chain sale config to avoid stale fields
      let cur: any = saleObj
      try { if (publicClient) { cur = await publicClient.readContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'saleConfig', args: [] as any }) } } catch {}

      const toTs = (s: string) => (s ? Math.floor(new Date(s).getTime() / 1000) : 0)
      const getNum = (k: string, i: number) => (typeof cur?.[k] !== 'undefined' ? Number(cur[k]) : (typeof cur?.[i] !== 'undefined' ? Number(cur[i]) : 0))
      const getBig = (k: string, i: number) => (typeof cur?.[k] !== 'undefined' ? BigInt(cur[k]) : (typeof cur?.[i] !== 'undefined' ? BigInt(cur[i]) : 0n))
      const next = {
        publicPriceWei: getBig('publicPriceWei', 0),
        allowlistPriceWei: roundPrice ? parseEther(roundPrice) : getBig('allowlistPriceWei', 1),
        publicStart: BigInt(getNum('publicStart', 2)),
        publicEnd: BigInt(getNum('publicEnd', 3)),
        allowlistStart: BigInt(toTs(roundStart) || getNum('allowlistStart', 4)),
        allowlistEnd: BigInt(toTs(roundEnd) || getNum('allowlistEnd', 5)),
        maxPerWallet: BigInt(phaseMaxPerWallet ? Number(phaseMaxPerWallet) : getNum('maxPerWallet', 6)),
        maxPerTx: BigInt(phaseMaxPerTx ? Number(phaseMaxPerTx) : getNum('maxPerTx', 7)),
      }

      const changed = (
        next.allowlistPriceWei !== BigInt(cur.allowlistPriceWei ?? 0) ||
        next.allowlistStart !== BigInt(cur.allowlistStart ?? 0) ||
        next.allowlistEnd !== BigInt(cur.allowlistEnd ?? 0) ||
        next.maxPerWallet !== BigInt(cur.maxPerWallet ?? 0) ||
        next.maxPerTx !== BigInt(cur.maxPerTx ?? 0)
      )

      if (changed) {
        openConfirm('Activate Allowlist Phase', next, computedRoot)
      } else {
        // Only merkle root change
        openConfirm('Activate Allowlist Phase (Root Only)', cur, computedRoot)
      }

      // Persist saved phase
      await savePhase()
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || 'Failed to activate allowlist')
    }
  }

  

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="space-y-3 p-6">
        <div className="text-xl font-semibold">Sale Controls</div>
        <div className="flex gap-2">
          <Button disabled={isPending} variant="outline" className="rounded-xl border border-[var(--stroke-soft)] px-3 py-1.5 hover:bg-[var(--hl-azure)]/10" onClick={() => call('pause')}>Pause</Button>
          <Button variant="outline" disabled={isPending} className="rounded-xl border border-[var(--stroke-soft)] px-3 py-1.5 hover:bg-[var(--hl-azure)]/10" onClick={() => call('unpause')}>Unpause</Button>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-[var(--fg-muted)]">Base URI (must end with /)</div>
          <input value={newBase} onChange={(e) => setNewBase(e.target.value)} placeholder={String(baseURI || '')} className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2 w-full" />
          <Button disabled={!newBase || isPending} variant="outline" className="rounded-xl border border-[var(--stroke-soft)] px-3 py-1.5 hover:bg-[var(--hl-azure)]/10" onClick={() => call('updateBaseURI', [newBase])}>Update BaseURI</Button>
          <div className="pt-2">
            <a href={`/mint-pro/${drop}`} target="_blank" rel="noreferrer" className="text-[var(--hl-cyan)] underline text-sm">Open Pro Mint Page</a>
          </div>
        </div>
        {/* Allowlist controls moved to Allowlist section below */}
        {err && <div className="text-red-400 text-sm">{err}</div>}
        {tx && <div className="text-sm">Tx: <a className="underline" target="_blank" rel="noreferrer" href={`https://hyperevmscan.io/tx/${tx}`}>{tx}</a></div>}
      </Card>
      {/* Confirmation modal */}
      {confirmVisible && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} onClick={()=>!confirming && setConfirmVisible(false)} />
          <div className="absolute inset-0 flex items-start justify-center pt-24 px-4">
            <div className="w-full max-w-2xl">
              <Card className="p-5 bg-[var(--bg-elevated)] border border-[var(--stroke-soft)]">
                <div className="text-lg font-semibold mb-3">{confirmTitle}</div>
                <div className="text-sm text-[var(--fg-muted)] mb-3">Please review the configuration before proceeding.</div>
                {confirmNext && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[var(--fg-muted)]">Public Price</div>
                      <div>{formatEther(BigInt(confirmNext.publicPriceWei||0))} HYPE</div>
                    </div>
                    <div>
                      <div className="text-[var(--fg-muted)]">Allowlist Price</div>
                      <div>{formatEther(BigInt(confirmNext.allowlistPriceWei||0))} HYPE</div>
                    </div>
                    <div>
                      <div className="text-[var(--fg-muted)]">Public Start</div>
                      <div>{Number(confirmNext.publicStart||0) ? new Date(Number(confirmNext.publicStart)*1000).toUTCString() : '—'}</div>
                    </div>
                    <div>
                      <div className="text-[var(--fg-muted)]">Public End</div>
                      <div>{Number(confirmNext.publicEnd||0) ? new Date(Number(confirmNext.publicEnd)*1000).toUTCString() : '—'}</div>
                    </div>
                    <div>
                      <div className="text-[var(--fg-muted)]">Allowlist Start</div>
                      <div>{Number(confirmNext.allowlistStart||0) ? new Date(Number(confirmNext.allowlistStart)*1000).toUTCString() : '—'}</div>
                    </div>
                    <div>
                      <div className="text-[var(--fg-muted)]">Allowlist End</div>
                      <div>{Number(confirmNext.allowlistEnd||0) ? new Date(Number(confirmNext.allowlistEnd)*1000).toUTCString() : '—'}</div>
                    </div>
                    <div>
                      <div className="text-[var(--fg-muted)]">Max / Wallet</div>
                      <div>{String(confirmNext.maxPerWallet||0)}</div>
                    </div>
                    <div>
                      <div className="text-[var(--fg-muted)]">Max / Tx</div>
                      <div>{String(confirmNext.maxPerTx||0)}</div>
                    </div>
                    {confirmMerkle && (
                      <div className="col-span-2">
                        <div className="text-[var(--fg-muted)]">Merkle Root</div>
                        <div className="font-mono break-all text-xs">{confirmMerkle}</div>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-5">
                  <Button
                    variant="outline"
                    disabled={confirming}
                    onClick={()=>setConfirmVisible(false)}
                    className="rounded-full border border-red-500 text-red-400 hover:bg-red-500/10 px-5"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={confirming}
                    onClick={proceedConfirm}
                    className="rounded-full border border-green-500 text-green-400 hover:bg-green-500/10 px-5"
                  >
                    {confirming ? 'Updating…' : 'Proceed'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
      <Card className="space-y-4 p-6">
        <div className="text-xl font-semibold">Collection Media & Links</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Header image */}
          <div className="space-y-3">
            <div className="text-sm">Header image</div>
            <div
              className={`relative rounded-xl border ${isDraggingHeader ? 'border-[var(--hl-azure)]' : 'border-[var(--stroke-soft)]'} bg-[var(--bg-elevated)] overflow-hidden grid place-items-center text-center`}
              style={{ aspectRatio: '1 / 1' }}
              onDragOver={(e) => { e.preventDefault(); if (!isDraggingHeader) setIsDraggingHeader(true) }}
              onDragLeave={() => setIsDraggingHeader(false)}
              onDrop={(e) => handleMediaDrop(e, 'header')}
            >
              {headerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={headerUrl} alt="Header" className="absolute inset-0 w-full h-full object-contain p-2" />
              ) : (
                <div className="px-4 text-sm text-[var(--fg-muted)]">
                  <div>Drag & drop header here</div>
                  <div className="text-xs">or click Upload</div>
                </div>
              )}
            </div>
            <div className="flex items-start gap-3">
              <label className="rounded-xl border border-[var(--stroke-soft)] px-3 py-2 text-sm cursor-pointer hover:bg-[var(--bg-elevated)]">
                <input className="hidden" type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'header') }} />
                Upload
              </label>
              <div className="flex-1">
                <div className="text-xs text-[var(--fg-muted)] mb-1">Header image URL</div>
                <input type="url" placeholder="https://" value={headerUrl} onChange={e => setHeaderUrl(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
              </div>
            </div>
            {headerUploadError && <div className="text-red-400 text-sm">{headerUploadError}</div>}
          </div>
          {/* Thumbnail */}
          <div className="space-y-3">
            <div className="text-sm">Thumbnail image</div>
            <div
              className={`relative rounded-xl border ${isDraggingThumb ? 'border-[var(--hl-azure)]' : 'border-[var(--stroke-soft)]'} bg-[var(--bg-elevated)] overflow-hidden grid place-items-center text-center`}
              style={{ aspectRatio: '1 / 1' }}
              onDragOver={(e) => { e.preventDefault(); if (!isDraggingThumb) setIsDraggingThumb(true) }}
              onDragLeave={() => setIsDraggingThumb(false)}
              onDrop={(e) => handleMediaDrop(e, 'thumb')}
            >
              {thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl} alt="Thumbnail" className="absolute inset-0 w-full h-full object-contain p-2" />
              ) : (
                <div className="px-4 text-sm text-[var(--fg-muted)]">
                  <div>Drag & drop thumbnail here</div>
                  <div className="text-xs">or click Upload</div>
                </div>
              )}
            </div>
            <div className="flex items-start gap-3">
              <label className="rounded-xl border border-[var(--stroke-soft)] px-3 py-2 text-sm cursor-pointer hover:bg-[var(--bg-elevated)]">
                <input className="hidden" type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'thumb') }} />
                Upload
              </label>
              <div className="flex-1">
                <div className="text-xs text-[var(--fg-muted)] mb-1">Thumbnail image URL</div>
                <input type="url" placeholder="https://" value={thumbUrl} onChange={e => setThumbUrl(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
              </div>
            </div>
            {thumbUploadError && <div className="text-red-400 text-sm">{thumbUploadError}</div>}
          </div>
        </div>
        {/* Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="flex justify-end">
          <Button onClick={saveMedia} disabled={savingMedia}>{savingMedia ? 'Saving…' : 'Save media'}</Button>
        </div>
      </Card>
      <Card className="space-y-3 p-6 md:col-span-2">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold">Allowlist</div>
          <Button size="sm" variant="outline" className="rounded-xl border border-red-500 text-red-400 hover:bg-red-500/10 px-3 py-1.5" onClick={()=>call('updateMerkleRoot', ['0x' + '0'.repeat(64) as any])}>Disable Allowlist</Button>
        </div>
        <div className="text-sm text-[var(--fg-muted)]">Upload a CSV or JSON of wallet addresses. We’ll compute the root and update the allowlist.</div>
        <input type="file" accept=".csv,.txt,.json" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) parseAddresses(f) }} />
        {uploadError && <div className="text-red-400 text-sm">{uploadError}</div>}
        {uploadCount !== null && (
          <div className="text-sm">Found {uploadCount} addresses. Root: <span className="font-mono text-xs">{computedRoot}</span></div>
        )}
        <div className="grid md:grid-cols-6 gap-4">
          <div>
            <div className="text-sm text-[var(--fg-muted)]">Phase Name</div>
            <input value={roundName} onChange={(e)=>setRoundName(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
          </div>
          <div>
            <div className="text-sm text-[var(--fg-muted)]">Allowlist Price (HYPE)</div>
            <input value={roundPrice} onChange={(e)=>setRoundPrice(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
          </div>
          <div>
            <div className="text-sm text-[var(--fg-muted)]">Allowlist Start</div>
            <input type="datetime-local" value={roundStart} onChange={(e)=>setRoundStart(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
          </div>
          <div>
            <div className="text-sm text-[var(--fg-muted)]">Allowlist End</div>
            <input type="datetime-local" value={roundEnd} onChange={(e)=>setRoundEnd(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
          </div>
          <div>
            <div className="text-sm text-[var(--fg-muted)]">Max Per Wallet (Phase)</div>
            <input type="number" value={phaseMaxPerWallet} onChange={(e)=>setPhaseMaxPerWallet(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
          </div>
          <div>
            <div className="text-sm text-[var(--fg-muted)]">Max Per Tx (Phase)</div>
            <input type="number" value={phaseMaxPerTx} onChange={(e)=>setPhaseMaxPerTx(e.target.value)} className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-[var(--fg-muted)]">
            Computed Root: {computedRoot ? <>
              <span className="font-mono">{computedRoot.slice(0, 10)}…{computedRoot.slice(-8)}</span>
              <Button size="sm" variant="ghost" onClick={()=>computedRoot && navigator.clipboard.writeText(computedRoot)}>Copy</Button>
            </> : '—'}
          </div>
          <div className="flex gap-2">
            <Button disabled={!uploadedAddresses} variant="outline" className="rounded-xl border border-[var(--stroke-soft)] px-3 py-1.5" onClick={() => { console.log('[Allowlist] Save Phase clicked'); savePhase() }}>Save Phase</Button>
            <Button disabled={!computedRoot || !uploadedAddresses} variant="outline" className="rounded-xl border border-green-500 hover:bg-green-500/10 px-3 py-1.5" onClick={activateAllowlist}>Activate Phase</Button>
          </div>
        </div>
        {uploadedAddresses && (
          <div className="space-y-3">
            <div className="text-sm text-[var(--fg-muted)]">Edit Addresses</div>
            <div className="flex items-center gap-2">
              <input value={addressSearch} onChange={(e)=>setAddressSearch(e.target.value)} placeholder="Search address" className="flex-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
              <input value={addressToAdd} onChange={(e)=>setAddressToAdd(e.target.value)} placeholder="Add 0x…" className="flex-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" />
              <Button size="sm" onClick={()=>{
                const a = addressToAdd.trim()
                if (/^0x[a-fA-F0-9]{40}$/.test(a)) {
                  setUploadedAddresses(prev => prev ? Array.from(new Set([...prev, a.toLowerCase()])) : [a.toLowerCase()])
                  setAddressToAdd('')
                  const { root } = computeRootFromAddresses((uploadedAddresses||[]).concat([a]))
                  setComputedRoot(root)
                  setUploadCount((uploadedAddresses?.length||0)+1)
                }
              }}>Add</Button>
            </div>
            <div className="h-56 overflow-auto rounded-xl border border-[var(--stroke-soft)]">
              <ul className="divide-y divide-[var(--stroke-soft)]">
                {(uploadedAddresses.filter(a=>!addressSearch || a.toLowerCase().includes(addressSearch.toLowerCase()))).map((a, idx) => (
                  <li key={a+idx} className="flex items-center justify-between px-3 py-2 text-sm font-mono">
                    <span className="truncate mr-2">{a}</span>
                    <Button size="sm" variant="ghost" onClick={()=>{
                      const next = (uploadedAddresses||[]).filter(x=>x!==a)
                      setUploadedAddresses(next)
                      const { root } = computeRootFromAddresses(next)
                      setComputedRoot(root)
                      setUploadCount(next.length)
                    }}>Remove</Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="pt-4 border-t border-[var(--stroke-soft)]" />
        <AllowlistRounds drop={drop} salePreview={salePreview} refreshToken={allowlistVersion} onLoad={(r:any)=>{
          setRoundName(r.name || 'Allowlist Phase')
          setRoundPrice(r.priceWei ? (Number(r.priceWei)/1e18).toString() : '')
          setRoundStart(r.startsAt?.seconds ? new Date(r.startsAt.seconds*1000).toISOString().slice(0,16) : '')
          setRoundEnd(r.endsAt?.seconds ? new Date(r.endsAt.seconds*1000).toISOString().slice(0,16) : '')
          setPhaseMaxPerWallet(typeof r.maxPerWallet==='number' ? String(r.maxPerWallet) : '')
          setPhaseMaxPerTx(typeof r.maxPerTx==='number' ? String(r.maxPerTx) : '')
          setComputedRoot(r.root as `0x${string}`)
          setUploadCount(r.size || null)
        }} onApplyRoot={async (root, price, start, end, maxPerWallet, maxPerTx) => {
          // Merge saved phase with fresh on-chain saleConfig
          let cur: any = saleObj
          try { if (publicClient) { cur = await publicClient.readContract({ address: drop, abi: IMPLEMENTATION_ABI as any, functionName: 'saleConfig', args: [] as any }) } } catch {}
          const getNum = (k: string, i: number) => (typeof cur?.[k] !== 'undefined' ? Number(cur[k]) : (typeof cur?.[i] !== 'undefined' ? Number(cur[i]) : 0))
          const getBig = (k: string, i: number) => (typeof cur?.[k] !== 'undefined' ? BigInt(cur[k]) : (typeof cur?.[i] !== 'undefined' ? BigInt(cur[i]) : 0n))
          const next = {
            publicPriceWei: getBig('publicPriceWei', 0),
            allowlistPriceWei: (typeof price !== 'undefined') ? BigInt(price) : getBig('allowlistPriceWei', 1),
            publicStart: BigInt(getNum('publicStart', 2)),
            publicEnd: BigInt(getNum('publicEnd', 3)),
            allowlistStart: BigInt(typeof start === 'number' ? start : getNum('allowlistStart', 4)),
            allowlistEnd: BigInt(typeof end === 'number' ? end : getNum('allowlistEnd', 5)),
            maxPerWallet: BigInt(typeof maxPerWallet === 'number' ? maxPerWallet : getNum('maxPerWallet', 6)),
            maxPerTx: BigInt(typeof maxPerTx === 'number' ? maxPerTx : getNum('maxPerTx', 7)),
          }
          await call('updateSaleConfig', [next as any])
          await call('updateMerkleRoot', [root])
        }} onDisable={()=>call('updateMerkleRoot', ['0x' + '0'.repeat(64) as any])} />
      </Card>

      <Card className="space-y-3 p-6">
        <div className="text-xl font-semibold">Withdraw</div>
        <div className="text-sm text-[var(--fg-muted)]">Contract Balance</div>
        <div>{bal.data ? `${bal.data.formatted} ${bal.data.symbol}` : '—'}</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-[var(--fg-muted)]">Platform ({feeBps / 100}%)</div>
            <div>{bal.data ? `${Number(platformFee) / 1e18} HYPE` : '—'}</div>
            <div className="text-xs text-[var(--fg-muted)]">to {String(platformFeeReceiver || '')}</div>
          </div>
          <div>
            <div className="text-[var(--fg-muted)]">Creator</div>
            <div>{bal.data ? `${Number(creatorAmount) / 1e18} HYPE` : '—'}</div>
          </div>
        </div>
        <Button disabled={!bal.data || bal.data?.value === 0n || isPending} variant="outline" className="rounded-xl border border-[var(--stroke-soft)] px-3 py-1.5 hover:bg-[var(--hl-azure)]/10" onClick={() => call('withdraw')}>Withdraw</Button>
      </Card>
      <Card className="space-y-3 p-6 md:col-span-2">
        <div className="text-xl font-semibold">Public Sale</div>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-[var(--fg-muted)]">Public Price (HYPE)</div>
            <input className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" placeholder={salePreview.publicPriceWei ? formatEther(salePreview.publicPriceWei) : ''} value={form.publicPrice} onChange={(e)=>setForm({...form, publicPrice: e.target.value})} />
          </div>
          <div>
            <div className="text-sm text-[var(--fg-muted)]">Max Per Wallet</div>
            <input type="number" className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" placeholder={String(salePreview.maxPerWallet)} value={form.maxPerWallet} onChange={(e)=>setForm({...form, maxPerWallet: e.target.value})} />
          </div>
          <div>
            <div className="text-sm text-[var(--fg-muted)]">Max Per Tx</div>
            <input type="number" className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" placeholder={String(salePreview.maxPerTx)} value={form.maxPerTx} onChange={(e)=>setForm({...form, maxPerTx: e.target.value})} />
          </div>
          <div>
            <div className="text-sm text-[var(--fg-muted)]">Public Start</div>
            <input type="datetime-local" className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" value={form.publicStart} onChange={(e)=>setForm({...form, publicStart: e.target.value})} />
            <div className="text-xs text-[var(--fg-muted)]">Current: {salePreview.publicStart ? new Date(salePreview.publicStart*1000).toLocaleString() : '—'}</div>
          </div>
          <div>
            <div className="text-sm text-[var(--fg-muted)]">Public End</div>
            <input type="datetime-local" className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2" value={form.publicEnd} onChange={(e)=>setForm({...form, publicEnd: e.target.value})} />
            <div className="text-xs text-[var(--fg-muted)]">Current: {salePreview.publicEnd ? new Date(salePreview.publicEnd*1000).toLocaleString() : '—'}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button disabled={isPending} variant="outline" className="rounded-xl border border-[var(--stroke-soft)] px-3 py-1.5 hover:bg-[var(--hl-azure)]/10" onClick={submitSale}>Update Public Sale</Button>
        </div>
      </Card>
    </div>
  )
}

export default function Manage(props: { params: { address: string } }) {
  return (
    <>
      <div className="fixed left-0 right-0 bottom-0 top-16 -z-40 pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} />
      <AuthGuard>
        <ManageContent {...props} />
      </AuthGuard>
    </>
  )
}
