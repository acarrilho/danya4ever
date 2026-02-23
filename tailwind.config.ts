import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ivory: {
          50: '#fdfcf9',
          100: '#faf7f0',
          200: '#f4ede0',
          300: '#ead9c4',
          400: '#d9bfa0',
          500: '#c4a07c',
        },
        slate: {
          750: '#2d3748',
          850: '#1a202c',
        },
        warm: {
          50: '#fdf8f0',
          100: '#faefd8',
          200: '#f2d9a8',
          300: '#e8be72',
          400: '#d9a035',
          500: '#c4871e',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
