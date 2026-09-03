/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'book': '0 20px 30px -10px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 0, 0, 0.1), inset -5px 0 10px rgba(0, 0, 0, 0.1)',
        'book-hover': '0 25px 40px -10px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 0, 0, 0.15), inset -5px 0 15px rgba(0, 0, 0, 0.15)',
        'page': '0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        bookOpen: {
          '0%': { transform: 'scale(0.95) rotateY(-10deg)', opacity: '0.8' },
          '100%': { transform: 'scale(1) rotateY(0deg)', opacity: '1' },
        },
        pageFlip: {
          '0%': { transform: 'rotateY(-15deg)', opacity: '0.9' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        }
      },
      animation: {
        'book-open': 'bookOpen 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'page-flip': 'pageFlip 0.3s ease-out forwards',
      }
    },
  },
  plugins: [],
}
