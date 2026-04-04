/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream:    '#FFFDF6',
        cream2:   '#FAF6E9',
        limelt:   '#DDEB9D',
        green:    '#A0C878',
        greendk:  '#7aaa52',
        textmain: '#1a2010',
        textmid:  '#4a5a30',
        textdim:  '#8a9a70',
      },
      fontFamily: { inter: ['Inter', 'sans-serif'] },
      boxShadow: {
        soft:  '0 4px 24px rgba(100,140,60,0.10)',
        card:  '0 8px 32px rgba(100,140,60,0.13)',
        hover: '0 16px 48px rgba(100,140,60,0.20)',
      },
    },
  },
  plugins: [],
}
