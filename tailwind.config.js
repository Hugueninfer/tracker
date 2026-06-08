/** @type {import('tailwindcss').Config} */
// Tokens derived directly from design.json (Hebats Dashboard Style)
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // tokens driven by CSS variables (flip with .dark) — RGB channels so
        // opacity utilities like bg-accent/30 keep working.
        page: 'rgb(var(--c-page) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        cardAlt: 'rgb(var(--c-card-alt) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
          soft: 'rgb(var(--c-accent-soft) / <alpha-value>)',
          tint: 'rgb(var(--c-accent-tint) / <alpha-value>)',
        },
        // pastel category tints (static — decorative card backgrounds)
        tint: {
          yellow: '#FBE9C6',
          coral: '#EE6B6E',
          sage: '#7C9070',
          cream: '#FFF6E5',
          ink: '#2B2B2B',
        },
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          soft: 'rgb(var(--c-ink-soft) / <alpha-value>)',
        },
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        hairline: 'rgb(var(--c-hairline) / <alpha-value>)',
        done: 'rgb(var(--c-done) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        meta: ['12px', { lineHeight: '1.5' }],
        micro: ['11px', { lineHeight: '1.4' }],
        item: ['14px', { lineHeight: '1.4' }],
        cardTitle: ['16px', { lineHeight: '1.4' }],
        stat: ['22px', { lineHeight: '1.2' }],
        pageTitle: ['30px', { lineHeight: '1.15' }],
      },
      borderRadius: {
        badge: '14px',
        card: '24px',
        outer: '22px',
        pill: '999px',
      },
      boxShadow: {
        // soft, diffuse, low-opacity — theme-aware via CSS var so dark mode
        // gets a visible (stronger) shadow instead of a near-invisible light one.
        card: 'var(--shadow-card)',
        cardHover: 'var(--shadow-card-hover)',
        drawer: 'var(--shadow-drawer)',
      },
      spacing: {
        card: '22px',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
