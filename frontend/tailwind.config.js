/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#111827',
        chat: '#1a1a2e',
        surface: '#16213e',
        accent: '#6366f1',
        'accent-hover': '#4f46e5',
        'user-bubble': '#312e81',
        'ai-bubble': '#1e293b',
        border: '#2d3748',
      },
      animation: {
        'bounce-dot': 'bounceDot 1.2s infinite ease-in-out',
      },
      keyframes: {
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.3' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
