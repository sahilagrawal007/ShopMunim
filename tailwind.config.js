/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",          // include root App files
    "./app/**/*.{js,jsx,ts,tsx}"      // include everything in /app/
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
