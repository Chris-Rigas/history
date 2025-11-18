/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Historical theme colors
        parchment: {
          50: '#fdfcfb',
          100: '#f9f6f1',
          200: '#f3ebe1',
          300: '#e8dbc8',
          400: '#d9c5a5',
          500: '#c9ae82',
        },
        antiqueBronze: {
          100: '#f3e7d8',
          200: '#e6cfb1',
          300: '#d8b689',
          400: '#c99e62',
          500: '#b7864b',
          600: '#9d6e39',
          700: '#7f562c',
          800: '#5e3d20',
          900: '#3f2914',
        },
        historical: {
          ancient: '#8b4513',
          medieval: '#4a5568',
          renaissance: '#d4af37',
          modern: '#2c5282',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.800'),
            h1: {
              color: theme('colors.gray.900'),
              fontWeight: '700',
            },
            h2: {
              color: theme('colors.gray.900'),
              fontWeight: '600',
            },
            h3: {
              color: theme('colors.gray.900'),
              fontWeight: '600',
            },
            a: {
              color: theme('colors.blue.600'),
              '&:hover': {
                color: theme('colors.blue.800'),
              },
            },
          },
        },
      }),
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
