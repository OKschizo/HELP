import './globals.css';
import Providers from './providers';
import { Navbar } from '@/components/Navbar';
export const metadata = { 
  title: 'HELP - Hyper Ethereal Launch Platform', 
  description: 'Professional NFT launch platform for HyperEVM. Deploy, manage, and mint ERC-721A collections with ease.',
  icons: {
    icon: '/HELP.png',
    apple: '/HELP.png',
  }
};
export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* Global Background */}
          <div className="fixed inset-0 -z-50">
            {/* Flowing background image */}
            <div className="absolute inset-0">
              <img 
                src="/site_bg1.png" 
                alt="" 
                className="w-full h-full object-cover opacity-20"
              />
            </div>
            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/70 via-[var(--bg)]/50 to-[var(--bg)]/70" />
          </div>
          
          <div className="min-h-screen flex flex-col relative">
            <Navbar />
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="border-t border-[var(--stroke-soft)]/50 bg-[var(--bg)]/60 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--fg-default)] mb-4">Want to say hey?</h3>
                    <ul className="space-y-2">
                      <li><a href="#" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors">Discord</a></li>
                      <li><a href="#" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors">Twitter</a></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--fg-default)] mb-4">Collections</h3>
                    <ul className="space-y-2">
                      <li><a href="#" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors">Explore <span className="text-xs">(soon)</span></a></li>
                      <li><a href="#" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors">Hot <span className="text-xs">(soon)</span></a></li>
                      <li><a href="#" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors">Latest <span className="text-xs">(soon)</span></a></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--fg-default)] mb-4">Support</h3>
                    <ul className="space-y-2">
                      <li><a href="#" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors">FAQ <span className="text-xs">(soon)</span></a></li>
                      <li><a href="#" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors">Discord</a></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--fg-default)] mb-4">Info</h3>
                    <ul className="space-y-2">
                      <li><a href="#" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors">Privacy Policy <span className="text-xs">(soon)</span></a></li>
                      <li><a href="#" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors">Terms of Use <span className="text-xs">(soon)</span></a></li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-[var(--stroke-soft)] flex items-center justify-between">
                  <p className="text-sm text-[var(--fg-subtle)]">© 2025 HELP - Hyper Ethereal Launch Platform. All rights reserved.</p>
                  <div className="w-12 h-12 opacity-30">
                    <img 
                      src="/HELP.png" 
                      alt="HELP Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
