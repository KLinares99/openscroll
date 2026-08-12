/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0b0f',
          900: '#121218',
          800: '#1b1b24',
          700: '#272733',
          600: '#3a3a4a',
        },
        gold: {
          400: '#e8c98a',
          500: '#d4ac60',
          600: '#b8903f',
        },
        blood: '#c8553d',
      },
      fontFamily: {
        serif: ['Iowan Old Style', 'Palatino', 'Georgia', 'ui-serif', 'serif'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
