'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { SiweMessage } from 'siwe'
import { UserDatabase, User } from './userDatabase'

interface AuthContextType {
  address: `0x${string}` | undefined
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  signIn: () => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check authentication status on mount and when address changes
  useEffect(() => {
    if (mounted) {
      checkAuthStatus()
    }
  }, [address, isConnected, mounted])

  const checkAuthStatus = async () => {
    if (!address || !isConnected) {
      setIsAuthenticated(false)
      return
    }

    setIsLoading(true)
    try {
      // Check if we have a valid session by trying to get user info
      const response = await fetch('/api/user')
      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(data.address === address)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (): Promise<boolean> => {
    if (!address || !isConnected) return false

    setIsLoading(true)
    try {
      // 1. Get nonce
      const nonceResponse = await fetch('/api/siwe/nonce')
      if (!nonceResponse.ok) throw new Error('Failed to get nonce')
      const nonce = await nonceResponse.text()

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to HELP - Hyper Ethereal Launch Platform',
        uri: window.location.origin,
        version: '1',
        chainId: 999, // Hyperliquid EVM chain ID
        nonce,
      })

      const messageString = message.prepareMessage()

      // 3. Sign message
      const signature = await signMessageAsync({
        message: messageString,
      })

      // 4. Verify signature
      const verifyResponse = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageString,
          signature,
        }),
      })

      if (verifyResponse.ok) {
        const result = await verifyResponse.json()
        if (result.ok) {
          setIsAuthenticated(true)
          // Create or get user in Firebase
          try {
            const userData = await UserDatabase.getOrCreateUser(address)
            setUser(userData)
          } catch (error) {
            console.error('Failed to create/get user:', error)
          }
          return true
        }
      }

      throw new Error('Verification failed')
    } catch (error) {
      console.error('Sign in failed:', error)
      setIsAuthenticated(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/siwe/logout', { method: 'POST' })
      setIsAuthenticated(false)
      setUser(null)
    } catch (error) {
      console.error('Sign out failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        address: mounted ? address : undefined,
        isAuthenticated: mounted ? isAuthenticated : false,
        isLoading: mounted ? isLoading : false,
        user: mounted ? user : null,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
