/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'Geist', 'system-ui', 'sans-serif'],
        display: ['Satoshi', 'Geist', 'system-ui', 'sans-serif'],
      },
      colors: {
        pivot: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#7189a3',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        alert: {
          yellow: '#f0b429',
          red: '#d64545',
          black: '#1a1a2e',
        },
        surface: {
          light: '#fafbfc',
          dark: '#0f172a',
          card: '#ffffff',
          'card-dark': '#1e293b',
        },
        accent: {
          blue: '#3b82f6',
          teal: '#14b8a6',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glass': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'glass-lg': '0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06)',
        'elevated': '0 10px 30px -10px rgba(0,0,0,0.08)',
        'elevated-dark': '0 10px 30px -10px rgba(0,0,0,0.3)',
      },
      animation: {
        'breathe': 'breathe 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
