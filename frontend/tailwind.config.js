/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom Campus Colors
        oxford: '#192338',
        'space-cadet': '#1E2E4F',
        'ylnmn-blue': '#31487A',
        'jordy-blue': '#8FB3E2',
        lavender: '#D9E1F1',
        
        // Primary palette based on the color scheme
        primary: {
          50: '#D9E1F1',
          100: '#C5D1E8',
          200: '#B1C1DF',
          300: '#8FB3E2',
          400: '#6BA3E0',
          500: '#31487A',
          600: '#1E2E4F',
          700: '#192338',
          800: '#151D2D',
          900: '#0F1723',
        },
        accent: {
          50: '#D9E1F1',
          100: '#C5D1E8',
          200: '#8FB3E2',
          300: '#31487A',
          400: '#1E2E4F',
          500: '#192338',
          600: '#151D2D',
          700: '#0F1723',
          800: '#0A0F17',
          900: '#050710',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #192338 0%, #1E2E4F 50%, #31487A 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #31487A 0%, #8FB3E2 100%)',
        'gradient-warm': 'linear-gradient(135deg, #1E2E4F 0%, #192338 100%)',
        'gradient-light': 'linear-gradient(135deg, #8FB3E2 0%, #D9E1F1 100%)',
        'gradient-main': 'linear-gradient(135deg, #f8fafc 0%, #f0f4f8 50%, #e8ecf1 100%)',
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgb(25 35 56 / 0.1), 0 1px 2px -1px rgb(25 35 56 / 0.1)',
        'medium': '0 4px 6px -1px rgb(25 35 56 / 0.15), 0 2px 4px -2px rgb(25 35 56 / 0.1)',
        'lg': '0 10px 15px -3px rgb(25 35 56 / 0.2), 0 4px 6px -4px rgb(25 35 56 / 0.1)',
      },
    },
  },
  plugins: [],
}
