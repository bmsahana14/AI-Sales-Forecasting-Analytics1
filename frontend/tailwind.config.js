/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neural-bg':      '#050505',
        'neural-card':    'rgba(15, 23, 42, 0.8)',
        'neural-primary': '#2563eb',
        'neural-accent':  '#00d2ff',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        grotesk: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          from: { boxShadow: '0 0 10px rgba(37,99,235,0.3)' },
          to:   { boxShadow: '0 0 25px rgba(0,210,255,0.5)' },
        },
      },
    },
  },
  plugins: [],
}
