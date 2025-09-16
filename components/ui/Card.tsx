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
        variant === 'default' && 'bg-[var(--bg-elevated)] border-[var(--stroke-soft)] shadow-[var(--shadow-lg)]',
        variant === 'elevated' && 'bg-[var(--bg-elevated)] border-[var(--stroke-soft)] shadow-[var(--shadow-xl)] hover:shadow-2xl hover:border-[var(--stroke-strong)]/50',
        variant === 'glass' && 'card-glass',
        variant === 'interactive' && 'bg-[var(--bg-elevated)] border-[var(--stroke-soft)] shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)] hover:border-[var(--stroke-strong)] cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] hover:bg-[var(--bg-elevated)]/90',
        variant === 'premium' && 'bg-[var(--bg-elevated)] border-[var(--stroke-soft)] shadow-[var(--shadow-xl)] hover:shadow-2xl relative overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-r before:from-[var(--hl-cyan)]/20 before:to-[var(--hl-azure)]/20 before:-z-10 hover:before:from-[var(--hl-cyan)]/40 hover:before:to-[var(--hl-azure)]/40',
        variant === 'glow' && 'bg-[var(--bg-elevated)] border-[var(--stroke-soft)] shadow-[var(--shadow-xl)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-[var(--hl-cyan)]/10 before:to-[var(--hl-azure)]/10 before:blur-xl before:-z-10 hover:before:from-[var(--hl-cyan)]/20 hover:before:to-[var(--hl-azure)]/20 animate-glow',
        
        // Optional glow effect
        glow && 'relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-[var(--hl-cyan)]/5 before:to-[var(--hl-azure)]/5 before:blur-lg before:-z-10 hover:before:from-[var(--hl-cyan)]/15 hover:before:to-[var(--hl-azure)]/15',
        
        // Padding system
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-5',
        padding === 'lg' && 'p-6',
        padding === 'xl' && 'p-8',
        
        className
      )} 
      {...props} 
    />
  )
}
