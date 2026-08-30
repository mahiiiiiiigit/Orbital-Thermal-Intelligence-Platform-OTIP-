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
          950: '#0c111a',
          900: '#111722', // Main operations charcoal/navy background
          850: '#161e2c', // Panel & Sidebar background
          800: '#1c2536', // Card container surface
          750: '#232f44', // Elevated surface & hover state
          700: '#2d3b54', // Low-contrast subtle borders
          600: '#3d4f6e', // Outline & secondary borders
        },
        accent: {
          blue: '#38bdf8',
          cyan: '#06b6d4',
          teal: '#14b8a6',
          green: '#10b981',
          amber: '#f59e0b',
          yellow: '#eab308',
          orange: '#f97316',
          red: '#ef4444',
          purple: '#8b5cf6',
          slate: '#64748b',
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
