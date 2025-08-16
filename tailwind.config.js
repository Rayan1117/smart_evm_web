/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        evmBlue: '#1E4FA4',
        evmYellow: '#FBC02D',
        evmGreen: '#388E3C',
        ledRed: '#D32F2F',
        ledGreen: '#43A047',
        softGray: '#F3F4F6',
        textGray: '#4B5563',
      }
    }
  }
  ,
  plugins: [],
}

