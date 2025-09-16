'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { UserDatabase, type Collection } from '@/lib/userDatabase'

export default function ExplorePage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        // Lightweight fetch: query all shared collections that have a header image
        // We don't have a direct method; query Firestore here
        const { db } = await import('@/lib/firebase') as any
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const ref = collection(db, 'collections')
        const q = query(ref, where('shareOnExplore', '==', true))
        const snap = await getDocs(q)
        const items: Collection[] = [] as any
        snap.forEach(d => {
          const v: any = d.data()
          if (v?.headerImageUrl && v?.contractAddress) {
            items.push({ id: d.id, ...v })
          }
        })
        // Newest first by updatedAt if available
        items.sort((a: any, b: any) => (b?.updatedAt?.toMillis?.() || 0) - (a?.updatedAt?.toMillis?.() || 0))
        setCollections(items)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="py-6">
      <div className="fixed left-0 right-0 bottom-0 top-16 bg-black/50 -z-40 pointer-events-none" />
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <div className="px-[20px]">
          <h1 className="text-2xl font-semibold mb-6">Explore Collections</h1>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-elevated)] animate-pulse" style={{ aspectRatio: '3 / 1' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {collections.map((c) => (
                <Link key={c.id} href={`/mint-pro/${c.contractAddress}`}>
                  <Card className="overflow-hidden group hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300">
                    <div className="relative w-full bg-[var(--bg-subtle)]" style={{ aspectRatio: '3 / 1' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={String((c as any).headerImageUrl)} alt={c.name || 'Collection'} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    <div className="p-4">
                      <div className="text-base font-semibold truncate">{c.name || 'Untitled'}</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


