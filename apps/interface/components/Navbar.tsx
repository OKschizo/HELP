'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Factory } from 'lucide-react'
import { HeaderConnectButton } from './HeaderConnectButton'
import { useAuth } from '@/lib/auth'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Create', href: '/create' },
    { name: 'Tools', href: '#', disabled: true },
    { name: 'Docs', href: '/docs' },
    { name: 'FAQ', href: '#', disabled: true },
    { name: 'Support', href: 'mailto:support@hyperlaunch.xyz' },
  ]

  // Admin navigation (only for authenticated users)
  const adminNavigation = isAuthenticated ? [
    { name: 'Deploy Factory', href: '/admin/deploy-factory', icon: Factory },
  ] : []

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--bg)]/80 border-b border-[var(--stroke-soft)]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              {/* Static Logo - Full Height */}
              <div className="relative h-12 w-auto group-hover:scale-105 transition-transform">
                <img 
                  src="/HELP.png" 
                  alt="HELP Logo" 
                  className="h-full w-auto object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm transition-colors ${
                  item.disabled
                    ? 'text-[var(--fg-subtle)] cursor-not-allowed'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg-default)]'
                }`}
                {...(item.disabled && { 'aria-disabled': true })}
              >
                {item.name}
                {item.disabled && (
                  <span className="ml-1 text-xs text-[var(--fg-subtle)]">(soon)</span>
                )}
              </Link>
            ))}
            
            {/* Admin Navigation */}
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-1 text-sm text-[var(--hl-cyan)] hover:text-[var(--hl-azure)] transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Desktop Connect Button */}
          <div className="hidden md:flex items-center">
            <HeaderConnectButton />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg-default)] hover:bg-[var(--bg-subtle)] transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-5 w-5" />
              ) : (
                <Menu className="block h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-[var(--stroke-soft)]">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-[var(--bg)]/95 backdrop-blur-md">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-base transition-colors ${
                  item.disabled
                    ? 'text-[var(--fg-subtle)] cursor-not-allowed'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg-default)] hover:bg-[var(--bg-subtle)]'
                }`}
                onClick={() => setIsOpen(false)}
                {...(item.disabled && { 'aria-disabled': true })}
              >
                {item.name}
                {item.disabled && (
                  <span className="ml-1 text-xs text-[var(--fg-subtle)]">(soon)</span>
                )}
              </Link>
            ))}
            
            {/* Mobile Connect Button */}
            <div className="px-3 py-2">
              <HeaderConnectButton />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
