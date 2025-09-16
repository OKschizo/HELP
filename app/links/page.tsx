'use client'
import links from '@/links/links.json'
import { BrandButton } from '@/components/ui/BrandButton'
export default function Links(){
  const addNetwork = async()=>{
    if(typeof window==='undefined' || !(window as any).ethereum) return alert('No wallet found');
    const params=[{ chainId:'0x3E7', chainName:'Hyperliquid', nativeCurrency:{ name:'HYPE', symbol:'HYPE', decimals:18 },
      rpcUrls:['https://rpc.hyperliquid.xyz/evm'], blockExplorerUrls:['https://hyperevmscan.io'] }];
    await (window as any).ethereum.request({ method:'wallet_addEthereumChain', params });
  };
  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-semibold text-gradient">{links.title}</h1>
        <p className="text-fg-muted mt-2">{links.subtitle}</p>
      </div>
      <div className="grid gap-3">
        {links.items.map((it:any, i:number)=>{
          const btn = it.variant==='primary' ? (
            <BrandButton className="w-full">{it.label}</BrandButton>
          ) : (
            <button className="w-full rounded-2xl px-4 py-3 border border-[var(--stroke-soft)] hover:border-[var(--stroke-strong)] text-left">{it.label}</button>
          );
          const onClick = it.href?.startsWith('action:') ? (e:any)=>{ e.preventDefault(); if(it.href==='action:add-network') addNetwork(); } : undefined;
          return (<a key={i} href={it.href?.startsWith('action:') ? '#' : it.href} onClick={onClick}>{btn}</a>)
        })}
      </div>
    </div>
  )
}
