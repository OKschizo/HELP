'use client'
import { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAuth } from '@/lib/auth'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { isAuthenticated, isLoading, signIn, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state during hydration
  if (!mounted) {
    return (
      <Card className="max-w-md mx-auto text-center">
        <div className="h-8 bg-[var(--bg-subtle)] rounded animate-pulse mb-4" />
        <div className="h-4 bg-[var(--bg-subtle)] rounded animate-pulse mb-6" />
        <div className="h-10 bg-[var(--bg-subtle)] rounded animate-pulse" />
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
        <p className="text-[var(--fg-muted)] mb-6">
          Connect your wallet to access HELP
        </p>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== 'loading'
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === 'authenticated')

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  'style': {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <Button onClick={openConnectModal} type="button">
                        Connect Wallet
                      </Button>
                    )
                  }

                  return null
                })()}
              </div>
            )
          }}
        </ConnectButton.Custom>
      </Card>
    )
  }

  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4">Sign In</h2>
        <p className="text-[var(--fg-muted)] mb-2">
          Wallet connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
        <p className="text-[var(--fg-muted)] mb-6">
          Sign a message to authenticate with HELP
        </p>
        <div className="flex gap-3 justify-center">
          <Button 
            onClick={signIn} 
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? 'Signing...' : 'Sign In'}
          </Button>
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors"
          >
            Disconnect
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-[var(--fg-muted)]">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading'
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated')

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <Button onClick={openConnectModal} type="button">
                      Connect Wallet
                    </Button>
                  )
                }

                if (chain.unsupported) {
                  return (
                    <Button onClick={openChainModal} type="button" variant="outline">
                      Wrong network
                    </Button>
                  )
                }

                return (
                  <div className="flex gap-2">
                    <button
                      onClick={openAccountModal}
                      className="px-3 py-1 text-sm border border-[var(--stroke-soft)] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
                    >
                      {account.displayName}
                    </button>
                    <button
                      onClick={signOut}
                      disabled={isLoading}
                      className="px-3 py-1 text-sm text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors"
                    >
                      {isLoading ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                )
              })()}
            </div>
          )
        }}
      </ConnectButton.Custom>
    </div>
  )
}
