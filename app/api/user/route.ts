import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/session'

export const GET = async (req: Request) => {
  const res = new NextResponse()
  const session = await getIronSession(req, res, sessionOptions)
  
  // @ts-ignore
  if (session.address) {
    return NextResponse.json({
      // @ts-ignore
      address: session.address,
      isAuthenticated: true,
    })
  }
  
  return NextResponse.json(
    { message: 'Not authenticated' },
    { status: 401 }
  )
}
