/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: 'var(--color-brand-primary)',
          'primary-hover': 'var(--color-brand-primary-hover)',
          'primary-light': 'var(--color-brand-primary-light)',
          amber: 'var(--color-brand-amber)',
          'amber-light': 'var(--color-brand-amber-light)',
          'amber-border': 'var(--color-brand-amber-border)',
        },
      },
      boxShadow: {
        sm: '0 1px 3px rgba(15, 23, 42, 0.08)',
        md: '0 4px 16px rgba(15, 23, 42, 0.10)',
        lg: '0 20px 60px rgba(15, 23, 42, 0.08)',
        xl: '0 24px 80px rgba(15, 23, 42, 0.16)',
        card: '0 8px 32px rgba(15, 23, 42, 0.08)',
      },
      zIndex: {
        base: 'var(--z-base)',
        raised: 'var(--z-raised)',
        dropdown: 'var(--z-dropdown)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      }
    },
  },
  plugins: [],
}
