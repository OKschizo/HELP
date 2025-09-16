import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

export const POST = async (req: Request) => {
  const res = new NextResponse();
  const session = await getIronSession(req, res, sessionOptions);
  await session.destroy();
  return NextResponse.json({ ok: true });
};
