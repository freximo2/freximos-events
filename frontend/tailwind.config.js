/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8fbf8',
          100: '#c6f5ee',
          200: '#94ebdc',
          300: '#63dcca',
          400: '#45e2cc',
          500: '#35D6C0',
          600: '#22C8E8',
          700: '#1aa8c4',
          800: '#17788a',
          900: '#0f4f5c',
        },
        gray: {
          50: '#0b0d12',
          100: '#10131a',
          200: '#1a1e28',
          300: '#262b38',
          400: '#5b6275',
          500: '#7d8498',
          600: '#a7adbd',
          700: '#c9cedb',
          800: '#e1e5ee',
          900: '#f1f3f8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 180, 216, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 180, 216, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
