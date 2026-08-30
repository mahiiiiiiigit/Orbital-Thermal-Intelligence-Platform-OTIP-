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
          950: '#0c1119',
          900: '#111722', // Main operations console charcoal/navy background
          850: '#161f2e', // Card and panel surface
          800: '#1c273a', // Elevated surface & dropdowns
          750: '#233148', // Active/hover surface
          700: '#2a3b56', // Low-contrast subtle borders
          600: '#3a4f72', // Dividers & secondary outlines
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
