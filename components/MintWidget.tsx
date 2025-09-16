'use client';
import { useMemo, useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatEther } from 'viem';
import abiJson from '@/lib/abis/Hyper721A.json';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
export default function MintWidget({ address }: { address: `0x${string}` }){
  const { address: user } = useAccount();
  const [qty,setQty]=useState(1);
  const { data: price } = useReadContract({ address, abi: (abiJson as any).abi, functionName: 'price' });
  const { data: total } = useReadContract({ address, abi: (abiJson as any).abi, functionName: 'totalSupply' });
  const { data: maxSupply } = useReadContract({ address, abi: (abiJson as any).abi, functionName: 'maxSupply' });
  const { data: saleActive } = useReadContract({ address, abi: (abiJson as any).abi, functionName: 'saleActive' });
  const { writeContract, isPending } = useWriteContract();
  const cost = useMemo(()=> (price ? BigInt(price as any)*BigInt(qty) : 0n), [price,qty]);
  return (
    <Card className="space-y-4 max-w-xl mx-auto">
      <div className="text-xl font-semibold text-gradient">Mint</div>
      <div className="text-fg-muted">Supply: {Number(total||0)} / {Number(maxSupply||0)}</div>
      <div className="text-fg">Price: {price ? formatEther(price as any) : '...'} HYPE</div>
      <div className="flex items-center gap-3">
        <input type="number" min={1} max={10} value={qty} onChange={(e)=>setQty(parseInt(e.target.value||'1'))} className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] px-3 py-2 w-24 focus:border-[var(--hl-azure)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--hl-azure)_40%,transparent)]" />
        <Button disabled={!saleActive || isPending} onClick={()=>{ writeContract({ address, abi: (abiJson as any).abi, functionName:'mint', args:[BigInt(qty)], value: cost }); }}>{isPending?'Minting…':'Mint'}</Button>
      </div>
      {!saleActive && <div className="text-sm text-red-400">Sale is not active.</div>}
    </Card>
  );
}
