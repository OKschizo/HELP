import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AuthGuard } from '@/components/AuthGuard'
import { Sparkles, Settings } from 'lucide-react'

export default function CreatePage() {
  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold text-gradient mb-4">
            Create Your Collection
          </h1>
          <p className="text-lg text-[var(--fg-muted)] max-w-2xl mx-auto">
            Choose how you want to create your NFT collection on HyperEVM
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* New Collection Card - Premium Design */}
          <Card variant="premium" padding="none" className="group overflow-hidden hover:shadow-2xl hover:shadow-[var(--hl-cyan)]/20 transition-all duration-500" glow>
            <Link href="/create/new" className="block p-8 text-center h-full relative">
              {/* Floating badge */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-[var(--hl-green)] to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                POPULAR
              </div>
              
              <div className="relative mb-8">
                {/* Glow effect behind icon */}
                <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-br from-[var(--hl-cyan)]/30 to-[var(--hl-azure)]/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                {/* Icon container */}
                <div className="relative w-20 h-20 bg-gradient-to-br from-[var(--hl-cyan)] to-[var(--hl-azure)] rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-2xl">
                  <Sparkles className="w-10 h-10 text-[#07131A]" />
                </div>
              </div>
              
              <h2 className="text-subheading font-bold text-[var(--fg-default)] mb-4 group-hover:text-gradient transition-colors duration-300">
                New Collection
              </h2>
              
              <p className="text-body text-[var(--fg-muted)] mb-8 leading-relaxed">
                Already have your NFT assets? Launch your collection with our modern 4-step wizard designed for creators.
              </p>
              
              <Button variant="premium" size="lg" className="w-full">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Creating
              </Button>
              
              <div className="mt-4 text-caption text-[var(--hl-green)] font-medium">
                ✨ Most popular choice
              </div>
            </Link>
          </Card>

          {/* Generate Collection Card - Coming Soon */}
          <Card variant="glass" padding="none" className="relative overflow-hidden group hover:shadow-xl hover:shadow-[var(--hl-violet)]/10 transition-all duration-500">
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-gradient-to-r from-[var(--hl-violet)] to-[var(--hl-magenta)] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                COMING SOON
              </div>
            </div>
            
            <div className="p-8 text-center h-full relative">
              {/* Subtle overlay for disabled state */}
              <div className="absolute inset-0 bg-[var(--bg)]/20 backdrop-blur-[1px] rounded-2xl" />
              
              <div className="relative mb-8">
                {/* Glow effect behind icon */}
                <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-br from-[var(--hl-violet)]/20 to-[var(--hl-magenta)]/20 rounded-3xl blur-lg transition-all duration-300" />
                {/* Icon container */}
                <div className="relative w-20 h-20 bg-gradient-to-br from-[var(--hl-violet)]/60 to-[var(--hl-magenta)]/60 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                  <Settings className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h2 className="text-subheading font-bold text-[var(--fg-default)] mb-4">
                Generate Collection
              </h2>
              
              <p className="text-body text-[var(--fg-muted)] mb-8 leading-relaxed">
                AI-powered collection generator with automated trait distribution and metadata creation.
              </p>
              
              <Button variant="outline" disabled size="lg" className="w-full cursor-not-allowed opacity-60">
                <Settings className="w-5 h-5 mr-2" />
                Generate Collection
              </Button>
              
              <div className="mt-4 text-caption text-[var(--hl-violet)] font-medium">
                🤖 AI-powered generation
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <Card variant="elevated" className="hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[var(--hl-azure)] to-[var(--hl-cyan)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">💡</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--fg-default)] mb-3">
                Need help getting started?
              </h3>
              <p className="text-[var(--fg-muted)] mb-6 max-w-md mx-auto">
                Check out our documentation for IPFS best practices and deployment guides.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/docs">
                  <Button variant="ghost" className="hover:bg-[var(--bg-subtle)] hover:text-[var(--hl-azure)]">
                    📚 Read Documentation
                  </Button>
                </Link>
                <Link href="mailto:support@hyperlaunch.xyz">
                  <Button variant="ghost" className="hover:bg-[var(--bg-subtle)] hover:text-[var(--hl-cyan)]">
                    💬 Get Support
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
