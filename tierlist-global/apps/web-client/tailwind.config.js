/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ── Design System: The Institutional Pulse ──────────────
      // Fuente: DESIGN.md — "Obsidian & Neon Data Streams"
      colors: {
        'surface':                '#0d1321',   // Void base
        'surface-container':      '#191f2e',   // Level 1 cards
        'surface-container-high': '#242a39',   // Level 2 in-card
        'surface-container-highest': '#2e3447',
        'surface-container-low':  '#141929',
        'primary':                '#0052ff',   // Electric Blue — CTA
        'primary-container':      '#0052ff',
        'on-primary':             '#ffffff',
        'on-primary-container':   '#dde2f6',
        'secondary':              '#4edea3',   // Emerald Green — Winner
        'secondary-container':    '#4edea3',
        'on-secondary':           '#0d1321',
        'tertiary':               '#ffb95f',   // Amber — Audit/Warning
        'tertiary-container':     '#ffb95f',
        'on-surface':             '#dde2f6',   // High-contrast off-white
        'on-surface-variant':     '#8892a4',
        'outline-variant':        '#2e3447',
        'surface-bright':         '#3a4255',
        'error':                  '#ef4444',
      },
      fontFamily: {
        'headline': ['Manrope', 'sans-serif'],   // Display/headlines
        'body':     ['Inter', 'sans-serif'],      // Body/data
        'mono':     ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display-lg': ['3.5rem',  { lineHeight: '1', fontWeight: '700' }],
        'headline-sm': ['1.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'title-md':    ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body-md':     ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'label-sm':    ['0.6875rem', { lineHeight: '1', fontWeight: '700', letterSpacing: '0.08em' }],
      },
      letterSpacing: {
        'tight-headline': '-0.02em',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'ledger-in': 'ledgerIn 0.3s ease-out',
      },
      keyframes: {
        ledgerIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
};
