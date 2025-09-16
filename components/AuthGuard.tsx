'use client'
import { useAuth } from '@/lib/auth'
import { ConnectWallet } from './ConnectWallet'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--hl-cyan)]"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || <ConnectWallet />
  }

  return <>{children}</>
}
