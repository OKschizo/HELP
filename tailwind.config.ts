import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/shared/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          elevated: 'var(--bg-elevated)',
          soft: 'var(--bg-soft)',
          subtle: 'var(--bg-subtle)'
        },
        fg: {
          DEFAULT: 'var(--fg-default)',
          muted: 'var(--fg-muted)',
          subtle: 'var(--fg-subtle)',
          ghost: 'var(--fg-ghost)'
        },
        brand: {
          cyan: 'var(--hl-cyan)',
          azure: 'var(--hl-azure)',
          blue: 'var(--hl-blue)',
          violet: 'var(--hl-violet)',
          magenta: 'var(--hl-magenta)'
        },
        accent: {
          green: 'var(--hl-green)',
          amber: 'var(--hl-amber)'
        },
        stroke: {
          soft: 'var(--stroke-soft)',
          strong: 'var(--stroke-strong)'
        }
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px'
      },
      boxShadow: {
        glow: '0 0 24px rgba(0,240,255,.25)',
        card: '0 6px 30px rgba(0,0,0,.35)'
      },
      backgroundImage: {
        'gradient-brand': 'var(--gradient-brand)',
        'gradient-brand-2': 'var(--gradient-brand-2)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
}

export default config
