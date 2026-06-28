/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: '#70C653',
          dark: '#52a33a',
        },
        teal: {
          DEFAULT: '#46AF8E',
          dark: '#2f8a6d',
        },
        navy: {
          DEFAULT: '#325F85',
          dark: '#1e3d57',
          light: '#4a7aa3',
        },
        rust: {
          DEFAULT: '#B6663E',
          dark: '#8f4d2a',
        },
        lime: {
          DEFAULT: '#DFF263',
          dark: '#c4d940',
        },
        cream: {
          DEFAULT: '#fdf6e8',
          dark: '#ede4cc',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        handwriting: ['Caveat', 'cursive'],
        marker: ['MarkerPens', 'cursive'],
      },
    },
  },
  plugins: [],
}
