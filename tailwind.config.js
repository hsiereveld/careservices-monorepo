/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./apps/**/*.{js,ts,jsx,tsx,mdx}",
    "./packages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primaire kleuren
        'primary-50':   'var(--primary-50)',
        'primary-100':  'var(--primary-100)',
        'primary-200':  'var(--primary-200)',
        'primary-300':  'var(--primary-300)',
        'primary-400':  'var(--primary-400)',
        'primary-500':  'var(--primary-500)',
        'primary-600':  'var(--primary-600)',
        'primary-700':  'var(--primary-700)',
        'primary-800':  'var(--primary-800)',
        'primary-900':  'var(--primary-900)',

        // Accent kleuren
        'accent-50':    'var(--accent-50)',
        'accent-100':   'var(--accent-100)',
        'accent-200':   'var(--accent-200)',
        'accent-400':   'var(--accent-400)',
        'accent-500':   'var(--accent-500)',
        'accent-600':   'var(--accent-600)',
        'accent-700':   'var(--accent-700)',
        'accent-800':   'var(--accent-800)',

        // Secundaire kleuren
        'secondary-100': 'var(--secondary-100)',
        'secondary-400': 'var(--secondary-400)',
        'secondary-500': 'var(--secondary-500)',
        'secondary-600': 'var(--secondary-600)',

        // Overige
        'background-primary': 'var(--background-primary)',
        'background-accent': 'var(--background-accent)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-light': 'var(--text-light)',
        'white': 'var(--white)',
        'gray-50': 'var(--gray-50)',
        'gray-100': 'var(--gray-100)',
        'gray-200': 'var(--gray-200)',
        'gray-300': 'var(--gray-300)',
        'border': 'var(--border)',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          'Segoe UI Symbol',
          '"Noto Color Emoji"',
        ],
      },
    },
  },
  plugins: [],
} 