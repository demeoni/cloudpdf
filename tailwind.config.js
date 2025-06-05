/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      aspectRatio: {
        'a4-landscape': '297 / 210',
        'a4-portrait': '210 / 297',
      },
      screens: {
        'print': {'raw': 'print'},
      },
    },
  },
  plugins: [],
}