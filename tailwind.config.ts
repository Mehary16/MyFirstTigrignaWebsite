import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        ethiopic: ['var(--font-ethiopic)', 'var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          700: '#b45309',
          800: '#92400e',
          900: '#0f172a'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
        'card-lg': '0 4px 6px rgba(15, 23, 42, 0.04), 0 20px 48px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
