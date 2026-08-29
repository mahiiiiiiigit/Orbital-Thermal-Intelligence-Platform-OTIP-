/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#070d19',
          850: '#0b1324',
          800: '#101a33',
          750: '#172445',
          700: '#1e2f57',
          600: '#2d4378',
        },
        accent: {
          blue: '#38bdf8',
          cyan: '#06b6d4',
          green: '#22c55e',
          amber: '#f59e0b',
          yellow: '#facc15',
          orange: '#f97316',
          red: '#ef4444',
          purple: '#8b5cf6',
          pink: '#ec4899',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
