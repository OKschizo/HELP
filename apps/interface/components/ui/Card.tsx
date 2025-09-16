import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive' | 'premium' | 'glow'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
}

export function Card({ 
  className, 
  variant = 'default', 
  padding = 'md',
  glow = false,
  ...props 
}: CardProps) {
  return (
    <div 
      className={cn(
        // Base modern card styles
        'rounded-2xl border transition-all duration-300 ease-out',
        
        // Variants with sophisticated styling
        {
          // Default: Clean and minimal
          'bg-[var(--bg-elevated)] border-[var(--stroke-soft)] shadow-[var(--shadow-lg)]': variant === 'default',
          
          // Elevated: More prominent with better shadow
          'bg-[var(--bg-elevated)] border-[var(--stroke-soft)] shadow-[var(--shadow-xl)] hover:shadow-2xl hover:border-[var(--stroke-strong)]/50': variant === 'elevated',
          
          // Glass: Modern glass morphism
          'card-glass': variant === 'glass',
          
          // Interactive: Hover and click effects
          'bg-[var(--bg-elevated)] border-[var(--stroke-soft)] shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)] hover:border-[var(--stroke-strong)] cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] hover:bg-[var(--bg-elevated)]/90': variant === 'interactive',
          
          // Premium: Enhanced with gradient borders and glow
          'bg-[var(--bg-elevated)] border-[var(--stroke-soft)] shadow-[var(--shadow-xl)] hover:shadow-2xl relative overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-r before:from-[var(--hl-cyan)]/20 before:to-[var(--hl-azure)]/20 before:-z-10 hover:before:from-[var(--hl-cyan)]/40 hover:before:to-[var(--hl-azure)]/40': variant === 'premium',
          
          // Glow: Animated glow effects
          'bg-[var(--bg-elevated)] border-[var(--stroke-soft)] shadow-[var(--shadow-xl)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-[var(--hl-cyan)]/10 before:to-[var(--hl-azure)]/10 before:blur-xl before:-z-10 hover:before:from-[var(--hl-cyan)]/20 hover:before:to-[var(--hl-azure)]/20 animate-glow': variant === 'glow',
        },
        
        // Optional glow effect
        {
          'relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-[var(--hl-cyan)]/5 before:to-[var(--hl-azure)]/5 before:blur-lg before:-z-10 hover:before:from-[var(--hl-cyan)]/15 hover:before:to-[var(--hl-azure)]/15': glow,
        },
        
        // Padding system
        {
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-5': padding === 'md',
          'p-6': padding === 'lg',
          'p-8': padding === 'xl',
        },
        
        className
      )} 
      {...props} 
    />
  )
}
