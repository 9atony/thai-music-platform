/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'thai-cream': '#F9F7F0',
        'thai-brown': '#A67B5B',
        'thai-gold': '#D4AF37',
        'thai-dark': '#4A3B32',
      },
      fontFamily: {
        sans: ['"Kanit"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}