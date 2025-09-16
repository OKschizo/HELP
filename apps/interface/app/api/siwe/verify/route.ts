import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { SiweMessage } from 'siwe';

export const POST = async (req: Request) => {
  const res = new NextResponse();
  const session = await getIronSession(req, res, sessionOptions);
  const body = await req.json();
  const { message, signature } = body;
  
  const msg = new SiweMessage(message);
  const fields = await msg.verify({ signature });
  
  if (!fields.success) {
    return new NextResponse(JSON.stringify({ ok: false }), { status: 401, headers: res.headers });
  }
  
  // @ts-ignore
  if (session.nonce && session.nonce !== msg.nonce) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  
  // @ts-ignore
  session.address = msg.address as `0x${string}`;
  await session.save();
  
  return new NextResponse(JSON.stringify({ ok: true, address: msg.address }), { headers: res.headers });
};
