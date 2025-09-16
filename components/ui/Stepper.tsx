'use client'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
  id: string
  title: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: string
  completedSteps: string[]
  className?: string
}

export function Stepper({ steps, currentStep, completedSteps, className }: StepperProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep)
  
  return (
    <nav aria-label="Progress" className={cn('mb-12', className)}>
      <ol className="flex items-center justify-center space-x-2 md:space-x-8">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = step.id === currentStep
          const isUpcoming = index > currentIndex
          
          return (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                {/* Modern step indicator */}
                <div
                  className={cn(
                    'relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ease-out',
                    'border-2 font-semibold text-sm',
                    isCompleted && 'bg-gradient-to-r from-[var(--hl-cyan)] to-[var(--hl-azure)] border-transparent text-[#07131A] shadow-[var(--shadow-glow-cyan)]',
                    isCurrent && 'bg-[var(--bg-elevated)] border-[var(--hl-azure)] text-[var(--hl-azure)] shadow-[0_0_0_4px_rgba(59,130,246,0.1)]',
                    isUpcoming && 'bg-[var(--bg-subtle)] border-[var(--stroke-soft)] text-[var(--fg-subtle)]'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                
                {/* Modern step labels */}
                <div className="mt-3 text-center">
                  <div className={cn(
                    'text-sm font-semibold transition-all duration-200',
                    isCurrent && 'text-[var(--hl-azure)]',
                    isCompleted && 'text-[var(--fg-default)]',
                    isUpcoming && 'text-[var(--fg-muted)]'
                  )}>
                    <span className="hidden sm:inline">{step.title}</span>
                    <span className="sm:hidden">{index + 1}</span>
                  </div>
                  {step.description && (
                    <div className="hidden md:block text-xs text-[var(--fg-subtle)] mt-1 max-w-[80px]">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Modern connector line */}
              {index < steps.length - 1 && (
                <div className="flex items-center ml-4 mr-4">
                  <div
                    className={cn(
                      'w-8 md:w-16 h-0.5 rounded-full transition-all duration-300',
                      index < currentIndex 
                        ? 'bg-gradient-to-r from-[var(--hl-cyan)] to-[var(--hl-azure)]' 
                        : 'bg-[var(--stroke-soft)]'
                    )}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
