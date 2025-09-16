'use client'
import { useState, useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { Toaster } from 'sonner'
import '@rainbow-me/rainbowkit/styles.css'
import { makeWagmiConfig } from '@/lib/wagmi'
import { AuthProvider } from '@/lib/auth'

const queryClient = new QueryClient()

export default function Providers({ children }: { children: React.ReactNode }){
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark">
        <div className="min-h-screen bg-[var(--bg)] text-[var(--fg-default)] flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </ThemeProvider>
    )
  }
  // Temporarily disable wagmi/auth to isolate the issue
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster 
          theme="dark" 
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--stroke-soft)',
              color: 'var(--fg-default)',
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
