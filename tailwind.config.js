/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        bps: {
          navy: '#003366',
          blue: '#005596',
          darkBlue: '#00284d',
          lightBlue: '#edf4fa',
          border: '#cfe0f0',
          orange: '#f26522',
          green: '#1b7e3c',
        }
      }
    },
  },
  plugins: [],
}
