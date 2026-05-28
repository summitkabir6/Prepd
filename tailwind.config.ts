/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        sans:  ['"Work Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Override Tailwind's emerald with brand token — supports opacity via /N utilities
        emerald: {
          DEFAULT: 'rgb(6 78 59 / <alpha-value>)',
        },
        'emerald-soft': 'rgb(13 122 95 / <alpha-value>)',
        gold:   'rgb(201 168 76 / <alpha-value>)',
        cream:  'rgb(245 240 224 / <alpha-value>)',
        // shadcn semantic tokens (keep working)
        border:      'rgba(6, 78, 59, 0.12)',
        input:       'rgba(6, 78, 59, 0.12)',
        ring:        'rgba(6, 78, 59, 0.3)',
        background:  '#f5f0e0',
        foreground:  '#064e3b',
        primary: {
          DEFAULT:    '#064e3b',
          foreground: '#f5f0e0',
        },
        secondary: {
          DEFAULT:    '#0d7a5f',
          foreground: '#f5f0e0',
        },
        destructive: {
          DEFAULT:    '#b91c1c',
          foreground: '#f5f0e0',
        },
        muted: {
          DEFAULT:    'rgba(6, 78, 59, 0.05)',
          foreground: 'rgba(6, 78, 59, 0.6)',
        },
        accent: {
          DEFAULT:    '#c9a84c',
          foreground: '#064e3b',
        },
        popover: {
          DEFAULT:    '#faf6ea',
          foreground: '#064e3b',
        },
        card: {
          DEFAULT:    '#faf6ea',
          foreground: '#064e3b',
        },
      },
      borderRadius: {
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  '2px',
        xl:  'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
    },
  },
  plugins: [],
}
