/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ai: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcddff',
          300: '#8ec8ff',
          400: '#59a8ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#172554',
          950: '#0a1628',
        },
        neon: {
          cyan: '#00f0ff',
          blue: '#4d7cff',
          purple: '#a855f7',
          pink: '#ec4899',
          green: '#10b981',
        },
        vault: {
          dark: '#050a15',
          deeper: '#0a1128',
          surface: '#0f1a2e',
          card: '#141f35',
          border: '#1e2d4a',
          hover: '#1a2845',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'ai-gradient': 'linear-gradient(135deg, #0a1628 0%, #0f1a2e 25%, #141f35 50%, #0a1628 100%)',
        'ai-radial': 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        'neon-glow': 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(77, 124, 255, 0.1) 50%, rgba(168, 85, 247, 0.1) 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.3), 0 0 60px rgba(0, 240, 255, 0.1)',
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.3), 0 0 60px rgba(168, 85, 247, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-hover': '0 12px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'card-3d': '0 20px 60px -15px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 240, 255, 0.1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'neon-flicker': 'neonFlicker 2s ease-in-out infinite',
        'slide-up-fade': 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in-3d': 'scaleIn3D 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'particle-drift': 'particleDrift 20s linear infinite',
        'text-shimmer': 'textShimmer 3s linear infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
        'tilt-3d': 'tilt3D 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 240, 255, 0.4), 0 0 80px rgba(0, 240, 255, 0.1)' },
        },
        neonFlicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { textShadow: '0 0 7px rgba(0, 240, 255, 0.6), 0 0 42px rgba(0, 240, 255, 0.3)' },
          '20%, 24%, 55%': { textShadow: 'none' },
        },
        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn3D: {
          '0%': { opacity: '0', transform: 'perspective(1000px) rotateX(10deg) scale(0.9)' },
          '100%': { opacity: '1', transform: 'perspective(1000px) rotateX(0deg) scale(1)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        particleDrift: {
          '0%': { transform: 'translateY(0) translateX(0)' },
          '25%': { transform: 'translateY(-100px) translateX(50px)' },
          '50%': { transform: 'translateY(-200px) translateX(-30px)' },
          '75%': { transform: 'translateY(-300px) translateX(20px)' },
          '100%': { transform: 'translateY(-400px) translateX(0)' },
        },
        textShimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(0, 240, 255, 0.3)' },
          '50%': { borderColor: 'rgba(168, 85, 247, 0.5)' },
        },
        tilt3D: {
          '0%, 100%': { transform: 'perspective(1000px) rotateY(-2deg) rotateX(2deg)' },
          '50%': { transform: 'perspective(1000px) rotateY(2deg) rotateX(-2deg)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
