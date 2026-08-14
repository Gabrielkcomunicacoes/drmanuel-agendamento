/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#3B82F6',
          soft: '#EFF6FF',
        },
        canvas: '#F4F6F9',
        ink: '#1E293B',
        muted: '#64748B',
        hairline: '#E2E8F0',
        positive: '#10B981',
        negative: '#EF4444',
        neutral: '#F1F5F9',
        zebra: '#F8FAFC',
      },
      borderRadius: {
        xl: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)',
        pop: '0 10px 15px -3px rgb(16 24 40 / 0.10), 0 4px 6px -4px rgb(16 24 40 / 0.10)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'zoom-in': {
          from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.97)' },
          to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'zoom-in': 'zoom-in 150ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
