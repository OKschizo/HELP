import './globals.css'

export const metadata = {
  title: 'HELP - Hyper Ethereal Launch Platform',
  description: 'Professional NFT launch platform for HyperEVM.',
  icons: {
    icon: '/HELP.png',
    apple: '/HELP.png',
  }
}

import Providers from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en">
      <body>
        <Providers>
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  )
}

