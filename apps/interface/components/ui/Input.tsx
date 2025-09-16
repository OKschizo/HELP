'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  variant?: 'default' | 'filled' | 'premium'
  glow?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, variant = 'default', glow = false, ...props }, ref) => {
    return (
      <input
        className={cn(
          // Base modern styles
          'w-full transition-all duration-300 ease-out',
          'placeholder:text-[var(--fg-subtle)] text-[var(--fg-default)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--hl-azure)]/50 focus:ring-offset-2 focus:ring-offset-[var(--bg)]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-soft)]',
          
          // Variant styles
          {
            // Default: Clean elevated style
            'bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] rounded-xl px-4 py-3 hover:border-[var(--stroke-strong)] hover:shadow-md': variant === 'default',
            
            // Filled: Subtle background
            'bg-[var(--bg-subtle)] border border-transparent rounded-xl px-4 py-3 hover:bg-[var(--bg-soft)] hover:shadow-sm': variant === 'filled',
            
            // Premium: Enhanced with gradient border
            'bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] rounded-xl px-4 py-3 relative hover:shadow-lg focus:shadow-xl focus:shadow-[var(--hl-azure)]/10': variant === 'premium',
          },
          
          // Border and error states
          {
            // Error states
            'border-[var(--hl-red)] focus:border-[var(--hl-red)] focus:ring-red-500/20 shadow-red-500/10': error,
            
            // Focus states for non-error inputs
            'focus:border-[var(--hl-azure)] focus:shadow-[var(--hl-azure)]/20': !error && variant !== 'premium',
            
            // Premium focus state
            'focus:border-[var(--hl-azure)] focus:ring-[var(--hl-azure)]/30 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-[var(--hl-cyan)]/5 before:to-[var(--hl-azure)]/5 before:-z-10': !error && variant === 'premium',
          },
          
          // Optional glow effect
          {
            'shadow-lg shadow-[var(--hl-azure)]/10 hover:shadow-[var(--hl-azure)]/20 focus:shadow-[var(--hl-azure)]/30': glow && !error,
          },
          
          // Typography
          'text-sm font-medium',
          
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
