'use client'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  help?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'premium'
}

export function FormField({ 
  label, 
  help, 
  error, 
  required, 
  children, 
  className,
  variant = 'default'
}: FormFieldProps) {
  return (
    <div className={cn(
      'space-y-3 transition-all duration-200',
      variant === 'premium' && 'p-1 rounded-xl bg-gradient-to-r from-[var(--hl-cyan)]/5 to-[var(--hl-azure)]/5',
      className
    )}>
      <div className="flex items-center gap-2">
        <label className={cn(
          'text-sm font-semibold transition-colors',
          variant === 'premium' 
            ? 'text-gradient' 
            : 'text-[var(--fg-default)]'
        )}>
          {label}
          {required && (
            <span className={cn(
              'ml-1 font-bold',
              variant === 'premium' ? 'text-[var(--hl-red)]' : 'text-red-500'
            )}>
              *
            </span>
          )}
        </label>
      </div>
      {children}
      {help && (
        <div className="text-xs text-[var(--fg-muted)]">{help}</div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="w-1 h-1 bg-red-500 rounded-full" />
          <p className="text-sm text-red-400 font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}
