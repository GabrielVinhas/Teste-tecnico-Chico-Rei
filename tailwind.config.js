export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#FBF7F0', dim: '#F2EBE0', deep: '#E7DECF' },
        ink: { DEFAULT: '#1A1612', soft: '#4A4139', muted: '#8A7D70' },
        banana: { DEFAULT: '#F0B429', dark: '#D4970F', light: '#FCE9BC' },
        leaf: { DEFAULT: '#2F6D4F', light: '#DCEBE1' },
        clay: '#C1452B',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(26,22,18,.05), 0 8px 24px -12px rgba(26,22,18,.18)',
        lift: '0 2px 4px rgba(26,22,18,.06), 0 18px 36px -16px rgba(26,22,18,.28)',
        drawer: '-24px 0 48px -24px rgba(26,22,18,.45)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(.22,1,.36,1)',
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'slide-in': 'slide-in .32s cubic-bezier(.22,1,.36,1)',
        'fade-up': 'fade-up .4s cubic-bezier(.22,1,.36,1) both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
