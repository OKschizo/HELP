import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AnimatedLogo } from '@/components/AnimatedLogo'
import { FactoryStatusCard } from '@/components/FactoryStatusCard'
import { Sparkles, Zap, Settings, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-32 relative">
      {/* Clean Hero Section - Reference Layout */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[var(--hl-azure)]/5 to-[var(--hl-cyan)]/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--fg-default)] mb-6 leading-tight">
                Launch NFTs<br />
                on <span className="text-gradient">HyperEVM</span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg md:text-xl text-[var(--fg-muted)] mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Hyper Ethereal Launch Platform powered by HyperEVM
              </p>
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Link href="/create">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto px-8 py-3 text-base font-semibold bg-[var(--hl-cyan)] hover:bg-[var(--hl-azure)] text-[#07131A] rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    New Collection
                  </Button>
                </Link>
                <Link href="/create/generate">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto px-8 py-3 text-base font-semibold border-2 border-[var(--stroke-soft)] text-[var(--fg-default)] hover:border-[var(--hl-azure)] hover:bg-[var(--bg-elevated)] rounded-xl transition-all duration-200"
                  >
                    Generate Collection
                  </Button>
                </Link>
              </div>
              
              {/* Factory Status */}
              <div className="mt-8">
                <FactoryStatusCard />
              </div>
            </div>
            
            {/* Right Logo - Large Animated */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-80 h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[32rem] xl:h-[32rem]">
                <AnimatedLogo 
                  fps={24}
                  autoPlay={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Feature Cards - Reference Layout */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Deploy Card */}
          <Card className="text-center p-8 bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] rounded-2xl hover:border-[var(--hl-cyan)]/30 transition-all duration-300">
            <div className="w-16 h-16 bg-[var(--hl-cyan)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-[#07131A]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--fg-default)] mb-4">Deploy</h3>
            <p className="text-[var(--fg-muted)] leading-relaxed">
              EVM deployment contract
            </p>
          </Card>
          
          {/* Mint Card */}
          <Card className="text-center p-8 bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] rounded-2xl hover:border-[var(--hl-azure)]/30 transition-all duration-300">
            <div className="w-16 h-16 bg-[var(--hl-azure)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[var(--fg-default)] mb-4">Mint</h3>
            <p className="text-[var(--fg-muted)] leading-relaxed">
              Powerful minting configurations
            </p>
          </Card>
          
          {/* Manage Card */}
          <Card className="text-center p-8 bg-[var(--bg-elevated)] border border-[var(--stroke-soft)] rounded-2xl hover:border-[var(--hl-violet)]/30 transition-all duration-300">
            <div className="w-16 h-16 bg-[var(--hl-violet)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[var(--fg-default)] mb-4">Manage</h3>
            <p className="text-[var(--fg-muted)] leading-relaxed">
              Collection management tools
            </p>
          </Card>
        </div>
      </section>

    </div>
  )
}
