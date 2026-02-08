/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      colors: {
        brand: '#47c5d6',
        navy: '#13346c',
        royal: '#064497',
        accent: '#0058CA',
      },
    },
  },
  plugins: [],
}
