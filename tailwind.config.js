/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bps: {
          blue: '#005596',
          darkBlue: '#003a66',
          lightBlue: '#e6f0fa',
          orange: '#f26522',
          green: '#2e7d32',
        }
      }
    },
  },
  plugins: [],
}
