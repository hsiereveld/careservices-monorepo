/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Updated Brand Colors with logo green (#2d8484)
        primary: {
          50: '#E8F0F0',
          100: '#D1E1E1',
          200: '#A3C3C3',
          300: '#75A5A5',
          400: '#478787',
          500: '#2d8484', // Your logo's green
          600: '#246A6A',
          700: '#1B5050',
          800: '#123636',
          900: '#091C1C',
        },
        secondary: {
          50: '#E8F0EF',
          100: '#D1E1DF',
          200: '#A3C3BF',
          300: '#75A59F',
          400: '#47877F',
          500: '#12302D',
          600: '#0E2624',
          700: '#0B1D1B',
          800: '#071312',
          900: '#040A09',
        },
        text: {
          primary: '#4C5B5B',
          secondary: '#6B7B7B',
          light: '#8A9A9A',
        },
        accent: {
          50: '#F0F7F3',
          100: '#E1EFE7',
          200: '#C3DFCF',
          300: '#A5CFB7',
          400: '#87BF9F',
          500: '#5D9573',
          600: '#4A775C',
          700: '#385945',
          800: '#253B2E',
          900: '#131E17',
        },
        background: {
          primary: '#FFFFFF',
          accent: '#EAF7F1',
          light: '#F8FBF9',
        }
      }
    },
  },
  plugins: [],
};