/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Rententio Brand Colors
        'rich-black': 'rgb(var(--color-rich-black) / <alpha-value>)',
        'pure-white': 'rgb(var(--color-pure-white) / <alpha-value>)',
        'luxury-gold': 'rgb(var(--color-luxury-gold) / <alpha-value>)',
        'charcoal': 'rgb(var(--color-charcoal) / <alpha-value>)',
        'soft-white': 'rgb(var(--color-soft-white) / <alpha-value>)',
        'muted-gold': 'rgb(var(--color-muted-gold) / <alpha-value>)',
        'pale-gold': 'rgb(var(--color-pale-gold) / <alpha-value>)',
        'dark-gold': 'rgb(var(--color-dark-gold) / <alpha-value>)',
        'divider-dark': 'rgb(var(--color-divider-dark) / <alpha-value>)',
        'divider-light': 'rgb(var(--color-divider-light) / <alpha-value>)',
        'text-secondary-dark': 'rgb(var(--color-text-secondary-dark) / <alpha-value>)',
        'text-secondary-light': 'rgb(var(--color-text-secondary-light) / <alpha-value>)',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        formula: ['var(--font-formula)', 'sans-serif'],
        // Keep legacy class usage mapped to PP Formula for now
        inter: ['var(--font-formula)', 'sans-serif'],
      },
      letterSpacing: {
        'button': '0.1em',
      },
    },
  },
  plugins: [],
}
