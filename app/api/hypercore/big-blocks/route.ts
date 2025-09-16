import { NextRequest } from 'next/server'

// Proxy to Hyperliquid HyperCore big-block toggle endpoint.
// Configure via env:
// - HYPERCORE_BIGBLOCKS_ENDPOINT (required): full URL to control-plane endpoint
// - HYPERCORE_AUTH_HEADER (optional): name of auth header to include
// - HYPERCORE_AUTH_TOKEN (optional): value for auth header

export async function POST(req: NextRequest) {
  try {
    const endpoint = process.env.HYPERCORE_BIGBLOCKS_ENDPOINT
    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Server not configured: HYPERCORE_BIGBLOCKS_ENDPOINT missing' }), { status: 500 })
    }

    const body = await req.json()
    // Expected body (frontend signed):
    // {
    //   address: string,
    //   usingBigBlocks: boolean,
    //   message: string,
    //   signature: string,
    //   chainId?: number,
    // }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const authHeader = process.env.HYPERCORE_AUTH_HEADER
    const authToken  = process.env.HYPERCORE_AUTH_TOKEN
    if (authHeader && authToken) headers[authHeader] = authToken

    // Pass-through payload. Many HyperCore implementations expect:
    // { type: 'evmUserModify', address, usingBigBlocks, message, signature, chainId }
    const payload = {
      // Primary shape used by some integrations
      type: 'evmUserModify',
      ...body,
      // Extra fields to satisfy SDK-style expectations
      action: 'use_big_blocks',
      use_big_blocks: Boolean(body?.usingBigBlocks),
      account_address: body?.address,
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      // Timeout via AbortSignal if needed (omitted for simplicity)
    })

    const text = await res.text()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'HyperCore error', status: res.status, body: text }), { status: 502 })
    }

    // Try to parse JSON, else echo text
    try {
      const json = JSON.parse(text)
      return new Response(JSON.stringify(json), { status: 200 })
    } catch {
      return new Response(text, { status: 200 })
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500 })
  }
}


