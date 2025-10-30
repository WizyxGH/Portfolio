/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 👈 Active le mode sombre via la classe .dark
  content: [
    "./*.html",
    "./**/*.html",
    "./**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
