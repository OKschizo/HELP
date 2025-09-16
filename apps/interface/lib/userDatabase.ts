import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'

// User data structure
export interface User {
  id: string
  walletAddress: string
  createdAt: Timestamp
  updatedAt: Timestamp
  profile?: {
    displayName?: string
    bio?: string
    avatar?: string
    website?: string
    twitter?: string
    discord?: string
  }
}

// Collection data structure
export interface Collection {
  id: string
  userId: string
  walletAddress: string
  contractAddress?: string
  name: string
  symbol: string
  description: string
  // On-chain editable + sale settings
  baseURI?: string
  merkleRoot?: string
  payoutAddress?: string
  royaltyReceiver?: string
  royaltyBps?: number
  // Optional presentation and discovery fields
  bannerImageUrl?: string
  avatarImageUrl?: string
  categories?: string[]
  headerImageUrl?: string
  thumbnailUrl?: string
  // Public-facing mint page links
  websiteUrl?: string
  twitterUrl?: string
  discordUrl?: string
  openseaUrl?: string
  sale?: {
    publicPriceWei: string
    allowlistPriceWei: string
    publicStart: number
    publicEnd: number
    allowlistStart: number
    allowlistEnd: number
    maxPerWallet: number
    maxPerTx: number
  }
  // Derived and display-only
  totalSupply: number
  mintPrice: string // in ETH (for UI convenience)
  maxPerWallet: number
  status: 'draft' | 'deploying' | 'deployed' | 'minting' | 'sold-out' | 'paused'
  metadata: {
    baseURI?: string
    placeholderURI?: string
    revealDate?: Timestamp
    royaltyReceiver?: string
    royaltyBps?: number
  }
  deployment?: {
    transactionHash?: string
    blockNumber?: number
    deployedAt?: Timestamp
    gasUsed?: string
  }
  stats: {
    totalMinted: number
    totalRevenue: string
    uniqueHolders: number
    lastMintAt?: Timestamp
  }
  // Allowlist rounds metadata (optional)
  allowlists?: Array<{
    id: string
    name: string
    createdAt: Timestamp
    updatedAt: Timestamp
    root: string
    size: number
    startsAt?: Timestamp
    endsAt?: Timestamp
    priceWei?: string
    maxPerWallet?: number
    maxPerTx?: number
  }>
  currentAllowlistId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// User Database Service
export class UserDatabase {
  // Get or create user by wallet address
  static async getOrCreateUser(walletAddress: string): Promise<User> {
    const normalizedAddress = walletAddress.toLowerCase()
    
    // Try to find existing user
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('walletAddress', '==', normalizedAddress))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]
      return { id: userDoc.id, ...userDoc.data() } as User
    }
    
    // Create new user
    const newUser: Omit<User, 'id'> = {
      walletAddress: normalizedAddress,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    
    const docRef = await addDoc(usersRef, newUser)
    return { id: docRef.id, ...newUser }
  }
  
  // Update user profile
  static async updateUserProfile(
    userId: string, 
    profile: Partial<User['profile']>
  ): Promise<void> {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      profile,
      updatedAt: Timestamp.now()
    })
  }
  
  // Get user collections
  static async getUserCollections(userId: string): Promise<Collection[]> {
    const collectionsRef = collection(db, 'collections')
    const q = query(collectionsRef, where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Collection[]
  }
  
  // Create new collection
  static async createCollection(
    userId: string,
    walletAddress: string,
    collectionData: Omit<Collection, 'id' | 'userId' | 'walletAddress' | 'createdAt' | 'updatedAt' | 'stats'>
  ): Promise<Collection> {
    // Normalize contract address if present
    const normalizedContract = (collectionData as any).contractAddress
      ? String((collectionData as any).contractAddress).toLowerCase()
      : undefined

    // If a collection with this contract already exists for the user, return it
    if (normalizedContract) {
      const collectionsRef = collection(db, 'collections')
      const q = query(collectionsRef, where('userId', '==', userId), where('contractAddress', '==', normalizedContract))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const docRef = snap.docs[0]
        return { id: docRef.id, ...docRef.data() } as Collection
      }
    }

    const newCollection: Omit<Collection, 'id'> = {
      ...collectionData,
      ...(normalizedContract ? { contractAddress: normalizedContract } : {}),
      userId,
      walletAddress: walletAddress.toLowerCase(),
      stats: {
        totalMinted: 0,
        totalRevenue: '0',
        uniqueHolders: 0
      },
      // defaults for optional presentation fields
      bannerImageUrl: '',
      avatarImageUrl: '',
      categories: [],
      headerImageUrl: '',
      thumbnailUrl: '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    const collectionsRef = collection(db, 'collections')
    const docRef = await addDoc(collectionsRef, newCollection)
    
    return { id: docRef.id, ...newCollection }
  }
  
  // Update collection
  static async updateCollection(
    collectionId: string,
    updates: Partial<Omit<Collection, 'id' | 'createdAt'>>
  ): Promise<void> {
    const collectionRef = doc(db, 'collections', collectionId)
    await updateDoc(collectionRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
  }

  // Update by deployed contract address (helper for mint page edits)
  static async updateCollectionByContractAddress(
    contractAddress: string,
    updates: Partial<Omit<Collection, 'id' | 'createdAt'>>
  ): Promise<void> {
    const existing = await UserDatabase.findCollectionByContractAddress(contractAddress)
    if (!existing) throw new Error('Collection not found for contract address')
    await UserDatabase.updateCollection(existing.id, updates)
  }

  // Find a collection by deployed contract address
  static async findCollectionByContractAddress(contractAddress: string): Promise<Collection | null> {
    const collectionsRef = collection(db, 'collections')
    // Try lowercase (preferred)
    let snap = await getDocs(query(collectionsRef, where('contractAddress', '==', contractAddress.toLowerCase())))
    if (snap.empty) {
      // Fallback to exact value (legacy records may not be normalized)
      snap = await getDocs(query(collectionsRef, where('contractAddress', '==', contractAddress)))
    }
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as Collection
  }

  // Allowlist: save a round (meta + addresses) under a collection
  static async addAllowlistRound(
    collectionId: string,
    round: {
      id: string
      name: string
      root: string
      size: number
      startsAt?: Date
      endsAt?: Date
      priceWei?: string
      maxPerWallet?: number
      maxPerTx?: number
      addresses: string[]
    }
  ): Promise<void> {
    const base = doc(db, 'collections', collectionId)
    const metaRef = doc(collection(base, 'allowlists'), round.id)
    const addrsRef = doc(collection(base, 'allowlists'), `${round.id}-addresses`)
    const metaAny: any = {
      id: round.id,
      name: round.name,
      root: round.root,
      size: round.size,
      priceWei: round.priceWei || '0',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    if (typeof round.maxPerWallet === 'number') metaAny.maxPerWallet = round.maxPerWallet
    if (typeof round.maxPerTx === 'number') metaAny.maxPerTx = round.maxPerTx
    if (round.startsAt) metaAny.startsAt = Timestamp.fromDate(round.startsAt)
    if (round.endsAt) metaAny.endsAt = Timestamp.fromDate(round.endsAt)
    await setDoc(metaRef, metaAny)
    await setDoc(addrsRef, {
      addresses: round.addresses.map(a => a.toLowerCase()),
      updatedAt: Timestamp.now(),
    })
  }

  static async deleteAllowlistRound(collectionId: string, roundId: string): Promise<void> {
    const base = doc(db, 'collections', collectionId)
    await deleteDoc(doc(collection(base, 'allowlists'), roundId))
    await deleteDoc(doc(collection(base, 'allowlists'), `${roundId}-addresses`))
  }

  static async setCurrentAllowlist(collectionId: string, roundId: string): Promise<void> {
    await UserDatabase.updateCollection(collectionId, { currentAllowlistId: roundId })
  }

  static async getAllowlistAddresses(collectionId: string, roundId: string): Promise<string[]> {
    const base = doc(db, 'collections', collectionId)
    const addrsRef = doc(collection(base, 'allowlists'), `${roundId}-addresses`)
    const snap = await getDoc(addrsRef)
    if (!snap.exists()) return []
    const data = snap.data() as any
    return Array.isArray(data.addresses) ? (data.addresses as string[]) : []
  }

  static async listAllowlistRounds(collectionId: string): Promise<Collection['allowlists']> {
    const base = doc(db, 'collections', collectionId)
    const qSnap = await getDocs(collection(base, 'allowlists'))
    const rounds: any[] = []
    qSnap.forEach((d: any) => {
      const v = d.data()
      if (v && v.root && v.id) rounds.push(v)
    })
    return rounds as any
  }

  static async getAllowlistMeta(collectionId: string, roundId: string): Promise<any | null> {
    const base = doc(db, 'collections', collectionId)
    const metaRef = doc(collection(base, 'allowlists'), roundId)
    const snap = await getDoc(metaRef)
    if (!snap.exists()) return null
    return snap.data()
  }
  
  // Get collection by ID
  static async getCollection(collectionId: string): Promise<Collection | null> {
    const collectionRef = doc(db, 'collections', collectionId)
    const docSnap = await getDoc(collectionRef)
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Collection
    }
    
    return null
  }
  
  // Delete collection
  static async deleteCollection(collectionId: string): Promise<void> {
    const collectionRef = doc(db, 'collections', collectionId)
    await deleteDoc(collectionRef)
  }
  
  // Update collection deployment info
  static async updateCollectionDeployment(
    collectionId: string,
    deployment: Collection['deployment']
  ): Promise<void> {
    const collectionRef = doc(db, 'collections', collectionId)
    await updateDoc(collectionRef, {
      deployment,
      status: 'deployed',
      updatedAt: Timestamp.now()
    })
  }
  
  // Update collection stats
  static async updateCollectionStats(
    collectionId: string,
    stats: Partial<Collection['stats']>
  ): Promise<void> {
    const collectionRef = doc(db, 'collections', collectionId)
    await updateDoc(collectionRef, {
      stats,
      updatedAt: Timestamp.now()
    })
  }
}
