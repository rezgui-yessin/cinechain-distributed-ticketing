/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cinema-bg': '#0a0a1a',
        'cinema-card': '#12122a',
        'cinema-sidebar': '#0d0d20',
        'cinema-accent': '#f59e0b',
        'cinema-gold': '#d97706',
        'cinema-blue': '#3b82f6',
        'admin-bg': '#0f1629',
        'admin-sidebar': '#0a0f1e',
        'admin-card': '#1a2444',
        'admin-accent': '#3b82f6',
        'admin-secondary': '#8b5cf6',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d1b2a 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { transform: 'translateX(-20px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 10px rgba(245,158,11,0.3)' }, '50%': { boxShadow: '0 0 20px rgba(245,158,11,0.6)' } }
      }
    },
  },
  plugins: [],
};
