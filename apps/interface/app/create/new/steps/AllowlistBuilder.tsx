'use client'
import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { computeRootFromAddresses } from '@/lib/merkle'

interface AllowlistBuilderProps {
  valueAddresses?: string[]
  onApply: (opts: {
    root: `0x${string}`
    addresses: string[]
    allowlistPrice?: string
    allowlistStart?: string | null
    allowlistEnd?: string | null
    maxPerWalletOverride?: number
    maxPerTxOverride?: number
  }) => void
}

export function AllowlistBuilder({ valueAddresses = [], onApply }: AllowlistBuilderProps) {
  const [raw, setRaw] = useState<string>(valueAddresses.join('\n'))
  const [allowlistPrice, setAllowlistPrice] = useState<string>('')
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')
  const [maxPerWallet, setMaxPerWallet] = useState<string>('')
  const [maxPerTx, setMaxPerTx] = useState<string>('')

  const addresses = useMemo(() => {
    return raw
      .split(/\r?\n/) 
      .map(s => s.trim())
      .filter(Boolean)
  }, [raw])

  const root = useMemo(() => {
    if (addresses.length === 0) return ('0x' + '0'.repeat(64)) as `0x${string}`
    try {
      return computeRootFromAddresses(addresses).root
    } catch {
      return ('0x' + '0'.repeat(64)) as `0x${string}`
    }
  }, [addresses])

  const canApply = addresses.length > 0

  return (
    <Card className="mt-6">
      <h3 className="text-md font-semibold text-[var(--fg-default)] mb-4">Allowlist Builder</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <FormField label="Wallet Addresses" help="One address per line; mixed case accepted">
          <textarea
            className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2 text-sm placeholder:text-[var(--fg-subtle)] text-[var(--fg-default)] focus:outline-none focus:ring-2 focus:ring-[var(--hl-cyan)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] min-h-[140px]"
            placeholder={"0xabc...\n0xdef..."}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <div className="text-xs text-[var(--fg-muted)] mt-2">{addresses.length} address{addresses.length === 1 ? '' : 'es'}</div>
        </FormField>

        <div className="space-y-4">
          <FormField label="Allowlist Price (HYPE)" help="Optional; defaults to public price">
            <Input value={allowlistPrice} onChange={(e) => setAllowlistPrice(e.target.value)} placeholder="0.04" />
          </FormField>
          <FormField label="Allowlist Start" help="Optional">
            <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </FormField>
          <FormField label="Allowlist End" help="Optional">
            <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Wallet Limit (override)" help="Optional">
              <Input type="number" value={maxPerWallet} onChange={(e) => setMaxPerWallet(e.target.value)} placeholder="leave blank" />
            </FormField>
            <FormField label="Tx Limit (override)" help="Optional">
              <Input type="number" value={maxPerTx} onChange={(e) => setMaxPerTx(e.target.value)} placeholder="leave blank" />
            </FormField>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-[var(--bg-subtle)] rounded-lg">
        <div className="text-xs text-[var(--fg-muted)]">Computed Merkle Root</div>
        <code className="text-xs font-mono break-all text-[var(--fg-default)]">{root}</code>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={() => onApply({
            root,
            addresses,
            allowlistPrice: allowlistPrice || undefined,
            allowlistStart: start || null,
            allowlistEnd: end || null,
            maxPerWalletOverride: maxPerWallet ? parseInt(maxPerWallet) : undefined,
            maxPerTxOverride: maxPerTx ? parseInt(maxPerTx) : undefined,
          })}
          disabled={!canApply}
        >
          Use This Allowlist
        </Button>
      </div>
    </Card>
  )
}


