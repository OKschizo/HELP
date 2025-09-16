'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { usePublicClient } from 'wagmi'
import { UserDatabase, User, Collection } from '@/lib/userDatabase'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FACTORY_ADDRESS, FACTORY_ABI, IMPLEMENTATION_ABI } from '@/lib/contracts'
import { 
  Plus, 
  Settings, 
  ExternalLink, 
  Copy, 
  TrendingUp, 
  Users, 
  Coins,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause
} from 'lucide-react'

function DashboardContent() {
  const { address } = useAuth()
  const publicClient = usePublicClient()
  const [user, setUser] = useState<User | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onchainByAddress, setOnchainByAddress] = useState<Record<string, any>>({})

  useEffect(() => {
    if (address) {
      loadUserData()
    }
  }, [address])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get or create user
      const userData = await UserDatabase.getOrCreateUser(address!)
      setUser(userData)
      
      // Load user collections
      let userCollections = await UserDatabase.getUserCollections(userData.id)

      // Backfill from on-chain factory if needed
      if (publicClient && FACTORY_ADDRESS) {
        try {
          const onchainDrops = await publicClient.readContract({
            address: FACTORY_ADDRESS as `0x${string}`,
            abi: FACTORY_ABI as any,
            functionName: 'getCreatorDrops',
            args: [address as `0x${string}`]
          }) as `0x${string}`[]

          const existing = new Set(userCollections.map(c => (c.contractAddress || '').toLowerCase()))
          for (const drop of onchainDrops) {
            if (!existing.has(drop.toLowerCase())) {
              const created = await UserDatabase.createCollection(userData.id, address!, {
                contractAddress: drop,
                name: 'Collection',
                symbol: '',
                description: '',
                baseURI: '',
                merkleRoot: '0x' + '0'.repeat(64),
                payoutAddress: address!,
                royaltyReceiver: address!,
                royaltyBps: 0,
                sale: { publicPriceWei: '0', allowlistPriceWei: '0', publicStart: 0, publicEnd: 0, allowlistStart: 0, allowlistEnd: 0, maxPerWallet: 0, maxPerTx: 0 },
                totalSupply: 0,
                mintPrice: '0',
                maxPerWallet: 0,
                status: 'deployed',
                metadata: {}
              })
              userCollections = [...userCollections, created]
            }
          }
        } catch (err) {
          // Non-fatal if read fails
        }
      }

      // De-duplicate by contract address (prefer entries with contractAddress)
      const dedup = new Map<string, Collection>()
      for (const c of userCollections) {
        const key = (c.contractAddress || c.id).toLowerCase()
        if (!dedup.has(key)) dedup.set(key, c)
      }
      setCollections(Array.from(dedup.values()))
    } catch (err) {
      console.error('Failed to load user data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // On-chain data via multicall
  useEffect(() => {
    (async () => {
      try {
        if (!publicClient) return
        const addrs = (collections || []).map(c => (c.contractAddress || '').toLowerCase()).filter(Boolean) as string[]
        if (!addrs.length) { setOnchainByAddress({}); return }
        const contracts: any[] = []
        for (const a of addrs) {
          const addr = a as `0x${string}`
          contracts.push(
            { address: addr, abi: IMPLEMENTATION_ABI as any, functionName: 'name' },
            { address: addr, abi: IMPLEMENTATION_ABI as any, functionName: 'symbol' },
            { address: addr, abi: IMPLEMENTATION_ABI as any, functionName: 'totalSupply' },
            { address: addr, abi: IMPLEMENTATION_ABI as any, functionName: 'maxSupply' },
            { address: addr, abi: IMPLEMENTATION_ABI as any, functionName: 'paused' },
            { address: addr, abi: IMPLEMENTATION_ABI as any, functionName: 'saleConfig' },
          )
        }
        let res: any
        try {
          res = await publicClient.multicall({ contracts: contracts as any, allowFailure: true } as any)
        } catch {}
        const out: Record<string, any> = {}
        const fillFromMulticall = () => {
          if (!res) return false
          for (let i = 0; i < addrs.length; i++) {
            const base = i * 6
            const safe = (idx: number) => {
              const r: any = (res as any)[base + idx]
              return r && r.status === 'success' ? r.result : undefined
            }
            const rec = {
              name: safe(0) as string | undefined,
              symbol: safe(1) as string | undefined,
              totalSupply: Number(safe(2) ?? 0),
              maxSupply: Number(safe(3) ?? 0),
              paused: Boolean(safe(4)),
              sale: safe(5),
            }
            out[addrs[i]] = rec
          }
          return true
        }
        let ok = fillFromMulticall()
        if (!ok) {
          for (const a of addrs) {
            try {
              const addr = a as `0x${string}`
              const [name, symbol, totalSupply, maxSupply, paused, sale] = await Promise.all([
                publicClient.readContract({ address: addr, abi: IMPLEMENTATION_ABI as any, functionName: 'name', args: [] }) as any,
                publicClient.readContract({ address: addr, abi: IMPLEMENTATION_ABI as any, functionName: 'symbol', args: [] }) as any,
                publicClient.readContract({ address: addr, abi: IMPLEMENTATION_ABI as any, functionName: 'totalSupply', args: [] }) as any,
                publicClient.readContract({ address: addr, abi: IMPLEMENTATION_ABI as any, functionName: 'maxSupply', args: [] }) as any,
                publicClient.readContract({ address: addr, abi: IMPLEMENTATION_ABI as any, functionName: 'paused', args: [] }) as any,
                publicClient.readContract({ address: addr, abi: IMPLEMENTATION_ABI as any, functionName: 'saleConfig', args: [] }) as any,
              ])
              out[a] = {
                name: name as string,
                symbol: symbol as string,
                totalSupply: Number(totalSupply ?? 0),
                maxSupply: Number(maxSupply ?? 0),
                paused: Boolean(paused),
                sale,
              }
            } catch {}
          }
        }
        setOnchainByAddress(out)
      } catch {}
    })()
  }, [publicClient, JSON.stringify(collections.map(c => c.contractAddress))])

  const deriveStatus = (info: any): Collection['status'] => {
    if (!info) return 'deployed'
    if (info.paused) return 'paused'
    const s: any = info.sale || {}
    const getNum = (k: string, i: number) => {
      if (typeof s[k] !== 'undefined') return Number(s[k])
      if (typeof s[i] !== 'undefined') return Number(s[i])
      return 0
    }
    const now = Math.floor(Date.now() / 1000)
    const publicStart = getNum('publicStart', 2)
    const publicEnd = getNum('publicEnd', 3)
    const allowlistStart = getNum('allowlistStart', 4)
    const allowlistEnd = getNum('allowlistEnd', 5)
    const inPublic = (!publicStart || now >= publicStart) && (!publicEnd || now <= publicEnd)
    const inWL = (allowlistStart && now >= allowlistStart) && (!allowlistEnd || now <= allowlistEnd)
    if (inPublic || inWL) return 'minting'
    return 'deployed'
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add toast notification here
  }

  const getStatusColor = (status: Collection['status']) => {
    switch (status) {
      case 'deployed':
      case 'minting':
        return 'text-green-400'
      case 'deploying':
        return 'text-yellow-400'
      case 'draft':
        return 'text-gray-400'
      case 'paused':
        return 'text-orange-400'
      case 'sold-out':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: Collection['status']) => {
    switch (status) {
      case 'deployed':
      case 'minting':
        return <CheckCircle className="w-4 h-4" />
      case 'deploying':
        return <Clock className="w-4 h-4" />
      case 'draft':
        return <AlertCircle className="w-4 h-4" />
      case 'paused':
        return <Pause className="w-4 h-4" />
      case 'sold-out':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--hl-cyan)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--fg-muted)]">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[var(--fg-default)] mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-[var(--fg-muted)] mb-4">{error}</p>
          <Button onClick={loadUserData}>Try Again</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--fg-default)] mb-2">
                Dashboard
              </h1>
              <p className="text-[var(--fg-muted)]">
                Manage your NFT collections and track performance
              </p>
            </div>
            <Link href="/create">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Collection
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--fg-muted)] mb-1">Collections</p>
                <p className="text-2xl font-bold text-[var(--fg-default)]">
                  {collections.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--hl-cyan)]/10 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-[var(--hl-cyan)]" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--fg-muted)] mb-1">Total Minted</p>
                <p className="text-2xl font-bold text-[var(--fg-default)]">
                  {collections.reduce((sum, col) => sum + col.stats.totalMinted, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--hl-azure)]/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[var(--hl-azure)]" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--fg-muted)] mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-[var(--fg-default)]">
                  {collections.reduce((sum, col) => sum + parseFloat(col.stats.totalRevenue || '0'), 0).toFixed(4)} HYPE
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--hl-violet)]/10 rounded-xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-[var(--hl-violet)]" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--fg-muted)] mb-1">Unique Holders</p>
                <p className="text-2xl font-bold text-[var(--fg-default)]">
                  {collections.reduce((sum, col) => sum + col.stats.uniqueHolders, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Collections Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--fg-default)]">
              Your Collections
            </h2>
          </div>

          {collections.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-[var(--hl-cyan)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-[var(--hl-cyan)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--fg-default)] mb-2">
                No Collections Yet
              </h3>
              <p className="text-[var(--fg-muted)] mb-6 max-w-md mx-auto">
                Create your first NFT collection to get started with the Hyper Ethereal Launch Platform.
              </p>
              <Link href="/create">
                <Button>Create Your First Collection</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="p-6 hover:border-[var(--hl-cyan)]/30 transition-all duration-200">
                  {/* Collection media */}
                  <div className="mb-4">
                    {collection.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={collection.thumbnailUrl}
                        alt={`${collection.name} thumbnail`}
                        className="w-full h-40 object-cover rounded-xl border border-[var(--stroke-soft)]"
                      />
                    ) : (
                      <div className="w-full h-40 rounded-xl border border-[var(--stroke-soft)] bg-gradient-to-br from-[var(--hl-azure)]/25 via-[var(--hl-violet)]/25 to-[var(--hl-cyan)]/25 flex items-center justify-center">
                        <div className="text-lg font-semibold text-[var(--fg-default)] truncate px-4 text-center">
                          {collection.name}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--fg-default)] mb-1">
                        {collection.name}
                      </h3>
                      <p className="text-sm text-[var(--fg-muted)] mb-2">
                        {(() => {
                          const addr = (collection.contractAddress || '').toLowerCase()
                          const info = onchainByAddress[addr]
                          const sym = (info?.symbol as string) || collection.symbol
                          const max = typeof info?.maxSupply === 'number' && info.maxSupply > 0 ? info.maxSupply : collection.totalSupply
                          return `${sym} • ${max} items`
                        })()}
                      </p>
                      {(() => {
                        const addr = (collection.contractAddress || '').toLowerCase()
                        const info = onchainByAddress[addr]
                        const status = deriveStatus(info)
                        return (
                          <div className={`flex items-center gap-1 text-sm ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                            <span className="capitalize">{status}</span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--fg-muted)]">Minted</span>
                      {(() => {
                        const addr = (collection.contractAddress || '').toLowerCase()
                        const info = onchainByAddress[addr]
                        const minted = typeof info?.totalSupply === 'number' ? info.totalSupply : collection.stats.totalMinted
                        const max = typeof info?.maxSupply === 'number' && info.maxSupply > 0 ? info.maxSupply : collection.totalSupply
                        return <span className="text-[var(--fg-default)]">{minted} / {max}</span>
                      })()}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--fg-muted)]">Price</span>
                      <span className="text-[var(--fg-default)]">
                        {collection.mintPrice} HYPE
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--fg-muted)]">Revenue</span>
                      <span className="text-[var(--fg-default)]">
                        {collection.stats.totalRevenue} HYPE
                      </span>
                    </div>
                  </div>

                  {collection.contractAddress && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 p-2 bg-[var(--bg-subtle)] rounded-lg">
                        <code className="text-xs text-[var(--fg-muted)] flex-1 truncate">
                          {collection.contractAddress}
                        </code>
                        <button
                          onClick={() => copyToClipboard(collection.contractAddress!)}
                          className="text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/manage/${collection.contractAddress || collection.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                    </Link>
                    {collection.contractAddress && (
                      <Link href={`/mint-pro/${collection.contractAddress}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <>
      <div className="fixed left-0 right-0 bottom-0 top-16 bg-black/50 -z-40 pointer-events-none" />
      <AuthGuard>
        <DashboardContent />
      </AuthGuard>
    </>
  )
}
