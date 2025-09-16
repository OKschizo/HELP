"use client"
import { useEffect, useMemo, useState } from 'react'
import { Button } from './ui/Button'

interface NFTAttribute { trait_type: string; value: string | number }
interface NFTMetadata { name: string; description: string; image: string; attributes: NFTAttribute[] }

export function NFTEditorModal({ isOpen, onClose, onSave, initialData, imagePreview }:{
  isOpen: boolean;
  onClose: () => void;
  onSave: (meta: NFTMetadata) => void;
  initialData: NFTMetadata;
  imagePreview: string;
}){
  const [data, setData] = useState<NFTMetadata>(initialData)
  useEffect(()=>{ setData(initialData) },[initialData])
  if(!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit NFT</h3>
          <button onClick={onClose} className="text-[var(--fg-muted)]">✕</button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <img src={imagePreview} alt="preview" className="w-full h-auto rounded-lg border border-[var(--stroke-soft)]" />
          </div>
          <div className="col-span-2 space-y-3">
            <input className="input-modern" placeholder="Name" value={data.name} onChange={e=>setData({...data,name:e.target.value})} />
            <textarea className="input-modern" placeholder="Description" value={data.description} onChange={e=>setData({...data,description:e.target.value})} />
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-sm text-[var(--fg-muted)]">Attributes</span></div>
              <div className="space-y-2">
                {data.attributes.map((attr,idx)=>(
                  <div key={idx} className="flex gap-2">
                    <input className="input-modern flex-1" placeholder="Trait" value={attr.trait_type} onChange={e=>{
                      const attrs=[...data.attributes]; attrs[idx]={...attr,trait_type:e.target.value}; setData({...data,attributes:attrs})
                    }} />
                    <input className="input-modern flex-1" placeholder="Value" value={String(attr.value)} onChange={e=>{
                      const attrs=[...data.attributes]; attrs[idx]={...attr,value:e.target.value}; setData({...data,attributes:attrs})
                    }} />
                    <Button variant="ghost" onClick={()=>{ const attrs=[...data.attributes]; attrs.splice(idx,1); setData({...data,attributes:attrs}) }}>Remove</Button>
                  </div>
                ))}
                <Button variant="secondary" onClick={()=>setData({...data,attributes:[...data.attributes,{trait_type:'',value:''}]})}>Add Attribute</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={()=>onSave(data)}>Save</Button>
        </div>
      </div>
    </div>
  )
}

