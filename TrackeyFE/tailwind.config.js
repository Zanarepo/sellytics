/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enable dark mode via a class on an ancestor element (e.g., <html>)
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}" // This will include all your React components and HTML files in the src folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
