import { keccak256, toBytes, getAddress } from 'viem'

// Hash a leaf as keccak256(abi.encodePacked(address))
export function hashLeaf(address: string): `0x${string}` {
  const checksummed = getAddress(address)
  const addrBytes = toBytes(checksummed)
  return keccak256(addrBytes)
}

// Build a Merkle tree using OpenZeppelin's sorted pair convention
export function buildMerkleTree(leaves: `0x${string}`[]): `0x${string}`[][] {
  if (leaves.length === 0) return []
  let level: `0x${string}`[] = [...leaves]
  const layers: `0x${string}`[][] = [level]
  while (level.length > 1) {
    const next: `0x${string}`[] = []
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i]
      const right = i + 1 < level.length ? level[i + 1] : left
      next.push(hashPair(left, right))
    }
    level = next
    layers.push(level)
  }
  return layers
}

export function getRoot(layers: `0x${string}`[][]): `0x${string}` {
  return layers.length ? layers[layers.length - 1][0] : ('0x' + '0'.repeat(64)) as `0x${string}`
}

// Generate Merkle proof for the leaf at a given index
export function getProof(layers: `0x${string}`[][], index: number): `0x${string}`[] {
  const proof: `0x${string}`[] = []
  for (let i = 0; i < layers.length - 1; i++) {
    const level = layers[i]
    const pairIndex = index ^ 1 // sibling
    if (pairIndex < level.length) {
      proof.push(level[pairIndex])
    }
    index = Math.floor(index / 2)
  }
  return proof
}

// Utilities
function hashPair(a: `0x${string}`, b: `0x${string}`): `0x${string}` {
  // OpenZeppelin sorts pair lexicographically before hashing
  const [x, y] = sortHex(a, b)
  const bytes = new Uint8Array([...toBytes(x), ...toBytes(y)])
  return keccak256(bytes)
}

function sortHex(a: `0x${string}`, b: `0x${string}`): [`0x${string}`, `0x${string}`] {
  return a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a]
}

export function computeRootFromAddresses(addresses: string[]): { root: `0x${string}`; layers: `0x${string}`[][]; leaves: `0x${string}`[] } {
  const leaves = addresses.map(hashLeaf)
  const layers = buildMerkleTree(leaves)
  const root = getRoot(layers)
  return { root, layers, leaves }
}

export function computeProofForAddress(addresses: string[], address: string): `0x${string}`[] {
  const { layers, leaves } = computeRootFromAddresses(addresses)
  const leaf = hashLeaf(address)
  const index = leaves.findIndex((l) => l.toLowerCase() === leaf.toLowerCase())
  if (index === -1) return []
  return getProof(layers, index)
}


