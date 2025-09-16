import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Trash } from 'lucide-react'
import { UserDatabase } from '@/lib/userDatabase'

export default function AllowlistRounds({ drop, salePreview, onApplyRoot, onDisable, onLoad, refreshToken }: {
  drop: `0x${string}`
  salePreview: any
  onApplyRoot: (root: `0x${string}`, priceWei?: bigint, startTs?: number, endTs?: number, maxPerWallet?: number, maxPerTx?: number) => Promise<any>
  onDisable: () => Promise<any>
  onLoad: (round: any) => void
  refreshToken?: number
}) {
  const [rounds, setRounds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        setError(null)
        const col = await UserDatabase.findCollectionByContractAddress(drop)
        if (!col) { setRounds([]); return }
        const list = await UserDatabase.listAllowlistRounds(col.id)
        // Normalize and sort by createdAt desc
        const normalized = (list || []).map((r: any) => ({
          ...r,
          createdAtMs: r.createdAt?.seconds ? Number(r.createdAt.seconds) * 1000 : 0
        }))
        normalized.sort((a: any, b: any) => b.createdAtMs - a.createdAtMs)
        setRounds(normalized)
      } catch (e: any) {
        setError(e?.message || 'Failed to load allowlist phases')
      } finally {
        setLoading(false)
      }
    })()
  }, [drop, refreshToken])

  if (loading) return <div className="text-sm text-[var(--fg-muted)]">Loading allowlist phases…</div>
  if (error) return <div className="text-sm text-red-400">{error}</div>
  if (!rounds.length) return <div className="text-sm text-[var(--fg-muted)]">No saved allowlist phases.</div>

  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">Saved Phases</div>
      <div className="grid md:grid-cols-2 gap-3">
        {rounds.map((r) => (
          <Card key={r.id} className="p-3 space-y-2 hover:border-[var(--hl-cyan)]/40 cursor-pointer" onClick={() => onLoad(r)}>
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.name}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-xl border border-green-500 text-green-400 hover:bg-green-500/10 px-3 py-1.5" onClick={(e) => { e.stopPropagation(); onApplyRoot(
                  r.root as `0x${string}`,
                  r.priceWei ? BigInt(r.priceWei) : undefined,
                  r.startsAt?.seconds ? Number(r.startsAt.seconds) : undefined,
                  r.endsAt?.seconds ? Number(r.endsAt.seconds) : undefined,
                  typeof r.maxPerWallet === 'number' ? r.maxPerWallet : undefined,
                  typeof r.maxPerTx === 'number' ? r.maxPerTx : undefined,
                )}}>Activate</Button>
                <Button size="sm" variant="outline" className="rounded-xl border border-red-500 text-red-400 hover:bg-red-500/10 px-3 py-1.5" onClick={async (e) => { e.stopPropagation();
                  const col = await UserDatabase.findCollectionByContractAddress(drop)
                  if (!col) return
                  await UserDatabase.deleteAllowlistRound(col.id, r.id)
                  // naive remove locally
                  setRounds(prev => prev.filter(p => p.id !== r.id))
                }}>
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-[var(--fg-muted)]">Root: <span className="font-mono break-all">{r.root}</span></div>
            <div className="text-xs text-[var(--fg-muted)]">Size: {r.size}</div>
            <div className="text-xs text-[var(--fg-muted)]">Limits: wallet {r.maxPerWallet ?? '—'}, tx {r.maxPerTx ?? '—'}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
