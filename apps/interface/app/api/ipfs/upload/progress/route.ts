import { NextResponse } from 'next/server'
import { getProgress } from './store'

export const runtime = 'nodejs'

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') || ''
  if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 })
  const p = getProgress(id)
  return NextResponse.json({ ok: true, progress: p || { uploaded: 0, total: 0, done: false } })
}




