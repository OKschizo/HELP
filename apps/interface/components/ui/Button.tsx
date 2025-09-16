'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'premium' | 'glow'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', glow = false, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles - modern and clean
          'inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-[var(--hl-azure)] focus:ring-opacity-50 focus:ring-offset-2 focus:ring-offset-[var(--bg)]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          'transform active:scale-95',
          
          // Variants with modern styling
          {
            // Primary: Modern gradient with subtle shadow
            'btn-gradient hover:shadow-[var(--shadow-glow-cyan)] hover:scale-[1.02] relative overflow-hidden': variant === 'primary',
            
            // Secondary: Elevated with subtle hover
            'bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] text-[var(--fg-default)] hover:bg-[var(--bg-subtle)] hover:border-[var(--stroke-strong)] hover:scale-[1.01] hover:shadow-lg': variant === 'secondary',
            
            // Ghost: Minimal with smooth transitions
            'bg-transparent border border-transparent text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg-default)] hover:border-[var(--stroke-soft)] hover:shadow-md': variant === 'ghost',
            
            // Outline: Modern border style
            'bg-transparent border-2 border-[var(--hl-azure)] text-[var(--hl-azure)] hover:bg-[var(--hl-azure)] hover:text-[#07131A] hover:scale-[1.01] hover:shadow-lg hover:shadow-[var(--hl-azure)]/25': variant === 'outline',
            
            // Premium: Enhanced gradient with glow
            'relative overflow-hidden bg-gradient-to-r from-[var(--hl-cyan)] via-[var(--hl-azure)] to-[var(--hl-violet)] text-[#07131A] font-bold hover:scale-[1.02] hover:shadow-2xl hover:shadow-[var(--hl-cyan)]/30 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700': variant === 'premium',
            
            // Glow: Animated glow effects
            'btn-gradient relative before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-r before:from-[var(--hl-cyan)]/20 before:to-[var(--hl-azure)]/20 before:blur-lg before:-z-10 hover:before:from-[var(--hl-cyan)]/40 hover:before:to-[var(--hl-azure)]/40 hover:scale-[1.02] animate-glow': variant === 'glow',
          },
          
          // Optional glow effect
          {
            'relative before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-r before:from-[var(--hl-cyan)]/10 before:to-[var(--hl-azure)]/10 before:blur-md before:-z-10 hover:before:from-[var(--hl-cyan)]/25 hover:before:to-[var(--hl-azure)]/25': glow,
          },
          
          // Modern size system
          {
            'px-3 py-2 text-sm rounded-lg': size === 'sm',
            'px-4 py-2.5 text-sm rounded-xl': size === 'md',
            'px-6 py-3 text-base rounded-xl': size === 'lg',
            'px-8 py-4 text-lg rounded-2xl': size === 'xl',
          },
          
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }
