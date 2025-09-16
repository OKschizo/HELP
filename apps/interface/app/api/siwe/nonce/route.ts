import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

export const GET = async (req: Request) => {
  const res = new NextResponse();
  const session = await getIronSession(req, res, sessionOptions);
  const nonce = randomBytes(16).toString('base64url');
  // @ts-ignore
  session.nonce = nonce;
  await session.save();
  return new NextResponse(nonce, { headers: res.headers });
};
