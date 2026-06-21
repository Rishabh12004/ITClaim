/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0F1117',
        'bg-card': '#1A1D27',
        'bg-elevated': '#22263A',
        'accent-green': '#00D4AA',
        'accent-amber': '#F5A623',
        'accent-red': '#FF4D4D',
        'text-primary': '#FFFFFF',
        'text-secondary': '#8B90A7',
        'text-muted': '#4A4F6A',
        'border-color': '#2A2F45',
      },
      fontFamily: {
        'space': ['Space Grotesk', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
      },
      animation: {
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'count-up': 'countUp 0.3s ease-out',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 212, 170, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 212, 170, 0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
