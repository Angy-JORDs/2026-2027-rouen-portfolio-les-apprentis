/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#030014',
          900: '#050124',
          800: '#0a0240',
          700: '#100560',
        },
        electric: {
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
        },
        cyber: {
          cyan: '#06B6D4',
          cyanPastel: '#CFFAFE',
          violet: '#FF003C',
          violetPastel: '#FFE5EC',
          emerald: '#10B981',
          amber: '#F59E0B',
        },
        offwhite: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
