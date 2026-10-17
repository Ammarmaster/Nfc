/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        milky: {
          50: '#FDFCF9',
          100: '#FAF8F5',
          200: '#F5F0E6',
          300: '#EBE3D3',
          400: '#DCD1BD',
          500: '#C2B49D',
          600: '#9B8B73',
          700: '#756855',
          800: '#4D4336',
          900: '#2A241C',
        },
        espresso: {
          950: '#120F0D',
          900: '#1C1917',
          800: '#292524',
          700: '#44403C',
          600: '#57534E',
          500: '#78716C',
          400: '#A8A29E',
        },
        champagne: {
          50: '#FFFDF5',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#E8C872',
          500: '#D4AF37',
          600: '#C59B27',
          700: '#B3801A',
          800: '#8A6010',
        },
        sage: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Space Grotesk"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'milky-sm': '0 2px 8px -1px rgba(70, 55, 40, 0.05)',
        'milky-md': '0 10px 30px -8px rgba(70, 55, 40, 0.07), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'milky-lg': '0 20px 45px -12px rgba(70, 55, 40, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        'milky-gold': '0 8px 25px -4px rgba(197, 155, 39, 0.35)',
        'glow-gold': '0 0 25px -3px rgba(212, 175, 55, 0.4)',
      },
      keyframes: {
        'scan-laser': {
          '0%, 100%': { transform: 'translateY(10%)' },
          '50%': { transform: 'translateY(85%)' },
        },
        'milky-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      animation: {
        'scan-laser': 'scan-laser 2.2s ease-in-out infinite',
        'milky-shimmer': 'milky-shimmer 1.8s infinite',
        fadeIn: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
