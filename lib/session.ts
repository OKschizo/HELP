import { SessionOptions } from 'iron-session';
export type SessionData = { address?: `0x${string}`; nonce?: string };
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName:'hl_siwe',
  // Persist SIWE for 30 days
  ttl: 60 * 60 * 24 * 30,
  cookieOptions:{
    secure: process.env.NODE_ENV==='production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30
  }
};
