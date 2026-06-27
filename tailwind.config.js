/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        rounded: ["'M PLUS Rounded 1c'", 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1EB980',
          dark: '#138A60',
          light: '#E4F6EE',
        },
        ink: '#19231E',
        bg: '#F5F7F4',
        surface: '#FFFFFF',
        muted: '#6E7B73',
        faint: '#A6B0A8',
        border: {
          DEFAULT: '#E6EAE5',
          light: '#F0F3EF',
        },
        rowalt: '#FAFBFA',
        toggle: '#EEF2EE',
        accent1: '#8FD9BC',
        accent2: '#CDEBDD',
        accent3: '#BFE9D6',
      },
      borderRadius: {
        field: '13px',
        card: '20px',
        result: '26px',
        bigcard: '24px',
        cta: '16px',
        pill: '20px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,.04)',
        float: '0 4px 14px rgba(30,185,128,.16)',
        cta: '0 6px 16px rgba(30,185,128,.35)',
        result: '0 10px 28px rgba(30,185,128,.35)',
        fab: '0 8px 20px rgba(30,185,128,.45)',
        icon: '0 1px 3px rgba(0,0,0,.06)',
      },
    },
  },
  plugins: [],
};
