/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0e1a',
          800: '#0d1321',
          700: '#111827',
          600: '#1a2235',
          500: '#1e2a3b',
          400: '#243044',
        },
      },
    },
  },
  plugins: [],
};
