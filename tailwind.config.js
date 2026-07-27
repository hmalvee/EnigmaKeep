/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic tokens (Graphite & Brass system)
        bg: c('--bg'),
        'bg-deep': c('--bg-deep'),
        surface: c('--surface'),
        surface2: c('--surface-2'),
        line: c('--line'),
        ink: c('--ink'),
        muted: c('--muted'),
        accent: c('--accent'),
        'accent-2': c('--accent-2'),
        'accent-ink': c('--accent-ink'),
        danger: c('--danger'),
        success: c('--success'),
        slate: c('--slate'),

        // Back-compat aliases so existing markup restyles automatically
        vault: {
          dark: c('--bg'),
          deeper: c('--bg-deep'),
          surface: c('--surface'),
          card: c('--surface'),
          border: c('--line'),
          hover: c('--surface-2'),
        },
        neon: {
          cyan: c('--accent'),
          blue: c('--accent-2'),
          purple: c('--slate'),
          pink: c('--accent-2'),
          green: c('--success'),
        },
        ai: {
          50: c('--surface-2'),
          100: c('--surface-2'),
          200: c('--line'),
          300: c('--muted'),
          400: c('--accent'),
          500: c('--accent'),
          600: c('--accent-2'),
          700: c('--accent-2'),
          800: c('--bg-deep'),
          900: c('--bg'),
          950: c('--bg-deep'),
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'ai-gradient': 'linear-gradient(135deg, rgb(var(--bg)) 0%, rgb(var(--surface)) 100%)',
        'ai-radial': 'radial-gradient(ellipse at center, rgb(var(--accent) / 0.10) 0%, transparent 70%)',
        'neon-glow': 'linear-gradient(135deg, rgb(var(--accent) / 0.10) 0%, rgb(var(--accent-2) / 0.08) 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgb(255 255 255 / 0.04) 0%, rgb(255 255 255 / 0.01) 100%)',
      },
      boxShadow: {
        'neon-cyan': '0 0 0 1px rgb(var(--accent) / 0.25), 0 10px 30px -12px rgb(var(--accent) / 0.35)',
        'neon-blue': '0 0 0 1px rgb(var(--accent-2) / 0.25), 0 10px 30px -12px rgb(var(--accent-2) / 0.3)',
        'neon-purple': '0 0 0 1px rgb(var(--slate) / 0.25), 0 10px 30px -12px rgb(var(--slate) / 0.3)',
        glass: '0 12px 40px -18px rgb(0 0 0 / 0.65), inset 0 1px 0 rgb(255 255 255 / 0.04)',
        'glass-hover': '0 18px 50px -20px rgb(0 0 0 / 0.7), inset 0 1px 0 rgb(255 255 255 / 0.06)',
        'card-3d': '0 20px 60px -24px rgb(0 0 0 / 0.6)',
        soft: '0 1px 2px rgb(0 0 0 / 0.3), 0 8px 24px -16px rgb(0 0 0 / 0.5)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'slide-up-fade': 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 1px rgb(var(--accent) / 0.2)' },
          '50%': { boxShadow: '0 0 0 1px rgb(var(--accent) / 0.4), 0 0 30px -6px rgb(var(--accent) / 0.3)' },
        },
        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
