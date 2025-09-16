'use client'
import { useAccount, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAuth } from '@/lib/auth'
import { Button } from './ui/Button'
import { ChevronDown, User, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'

export function HeaderConnectButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { isAuthenticated, isLoading, signIn, signOut } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="w-24 h-8 bg-[var(--bg-subtle)] rounded-lg animate-pulse" />
    )
  }

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal, mounted: rainbowMounted }) => {
          if (!rainbowMounted) {
            return <div className="w-24 h-8 bg-[var(--bg-subtle)] rounded-lg animate-pulse" />
          }
          
          return (
            <Button
              onClick={openConnectModal}
              size="sm"
            >
              Connect Wallet
            </Button>
          )
        }}
      </ConnectButton.Custom>
    )
  }

  // Connected but not authenticated - show sign in button
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          onClick={signIn} 
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="min-w-[80px]"
        >
          {isLoading ? 'Signing...' : 'Sign In'}
        </Button>
        <Button
          onClick={() => disconnect()}
          variant="ghost"
          size="sm"
          className="text-[var(--fg-subtle)]"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  // Authenticated - show user menu
  return (
    <div className="relative">
      <ConnectButton.Custom>
        {({ 
          account, 
          chain, 
          openAccountModal, 
          openChainModal,
          mounted: rainbowMounted 
        }) => {
          if (!rainbowMounted) {
            return <div className="w-32 h-8 bg-[var(--bg-subtle)] rounded-lg animate-pulse" />
          }

          if (chain?.unsupported) {
            return (
              <Button onClick={openChainModal} variant="outline" size="sm">
                Wrong Network
              </Button>
            )
          }

          return (
            <div className="flex items-center gap-2">
              {/* Account Button */}
              <button
                onClick={openAccountModal}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] rounded-lg hover:bg-[var(--bg-subtle)] hover:border-[var(--stroke-strong)] transition-all duration-200"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {account?.displayName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Sign Out Button */}
              <Button
                onClick={signOut}
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className="text-[var(--fg-subtle)] hover:text-[var(--fg-default)]"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">
                  {isLoading ? 'Signing out...' : 'Sign Out'}
                </span>
              </Button>
            </div>
          )
        }}
      </ConnectButton.Custom>
    </div>
  )
}
