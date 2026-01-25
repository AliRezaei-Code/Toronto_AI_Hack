/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /**
       * RENTENTIO BRAND FONTS
       * Per Lightweight Brand Kit typography section
       */
      fontFamily: {
        playfair: ['var(--font-playfair)', 'serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },

      /**
       * RENTENTIO BRAND COLORS
       * Per Lightweight Brand Kit color system (Black, White & Gold)
       */
      colors: {
        // Core Palette
        'rich-black': 'rgb(var(--color-rich-black) / <alpha-value>)',
        'pure-white': 'rgb(var(--color-pure-white) / <alpha-value>)',
        'luxury-gold': 'rgb(var(--color-luxury-gold) / <alpha-value>)',

        // Extended Palette
        'charcoal': 'rgb(var(--color-charcoal) / <alpha-value>)',
        'soft-white': 'rgb(var(--color-soft-white) / <alpha-value>)',
        'muted-gold': 'rgb(var(--color-muted-gold) / <alpha-value>)',
        'pale-gold': 'rgb(var(--color-pale-gold) / <alpha-value>)',
        'dark-gold': 'rgb(var(--color-dark-gold) / <alpha-value>)',

        // Functional
        'divider-dark': 'rgb(var(--color-divider-dark) / <alpha-value>)',
        'divider-light': 'rgb(var(--color-divider-light) / <alpha-value>)',
        'text-secondary-dark': 'rgb(var(--color-text-secondary-dark) / <alpha-value>)',
        'text-secondary-light': 'rgb(var(--color-text-secondary-light) / <alpha-value>)',
      },

      /**
       * LETTER SPACING
       * Per Brand Kit typography guidelines
       */
      letterSpacing: {
        'playfair-tight': '-0.02em',
        'playfair-normal': '-0.01em',
        'button': '0.1em',
        'gold': '0.02em',
      },

      /**
       * LINE HEIGHT
       * Per Brand Kit typography guidelines
       */
      lineHeight: {
        'playfair': '1.15',
        'inter-body': '1.7',
      },
    },
  },
  plugins: [],
}
