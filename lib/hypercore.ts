import { type Address } from 'viem'

// Client-side helper to enable/disable big blocks by signing a message
export async function enableBigBlocksViaSignature(params: {
  address: Address,
  chainId: number,
  usingBigBlocks: boolean,
  signMessage: (msg: string) => Promise<`0x${string}`>,
}): Promise<{ ok: boolean, message?: string }>{
  const { address, chainId, usingBigBlocks, signMessage } = params

  // Construct a deterministic message to sign
  const message = [
    'HyperCore Big Blocks Toggle',
    `address: ${address}`,
    `chainId: ${chainId}`,
    `usingBigBlocks: ${usingBigBlocks}`,
    `timestamp: ${Date.now()}`,
  ].join('\n')

  const signature = await signMessage(message)

  const res = await fetch('/api/hypercore/big-blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, chainId, usingBigBlocks, message, signature })
  })

  if (!res.ok) {
    try {
      const { error, body } = await res.json()
      return { ok: false, message: error || body }
    } catch {
      return { ok: false, message: 'Failed to enable big blocks' }
    }
  }
  return { ok: true }
}


