# Rententio UI Style Guide

> Complete design system for implementing consistent Rententio brand across all application pages
>
> **Version**: 1.0.0
> **Last Updated**: 2026-01-24
> **Foundation**: Based on lightweight-brand-kit.md and landing-page-brand-application.md

---

## Table of Contents

1. [Brand Foundation](#brand-foundation)
2. [Typography System](#typography-system)
3. [Color System](#color-system)
4. [Component Patterns](#component-patterns)
5. [Page Layouts](#page-layouts)
6. [Animation & Motion](#animation--motion)
7. [Accessibility](#accessibility)

---

## Brand Foundation

### Core Identity
- **Aesthetic**: Professional editor tool with luxury feel
- **Colors**: Black, White & Gold
- **Mood**: Elegant, sophisticated, modern
- **Feel**: Confident, premium, trustworthy

### Design Principles
1. **Clarity over complexity** - Clean, uncluttered interfaces
2. **Speed to value** - Remove friction, streamline flows
3. **Environmental creativity** - Subtle effects that don't interrupt
4. **Professional polish** - Every detail matters

---

## Typography System

### Font Stack

```tsx
// In layout.tsx
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
})

// Use PP Formula SemiExtended for UI/body
// Provide local font files and wire via next/font/local
```

### Typography Scale

| Element | Font | Weight | Size | Usage |
|---------|------|--------|------|-------|
| **Page Title** | Playfair Display | Bold (700) | 48-64px | Main page headings |
| **Section Header** | Playfair Display | SemiBold (600) | 32-40px | Section titles |
| **Card Title** | Playfair Display | SemiBold (600) | 24px | Card headings |
| **Body Large** | PP Formula SemiExtended | Regular (400) | 18-20px | Subheadings, emphasis |
| **Body Default** | PP Formula SemiExtended | Regular (400) | 16px | Standard text |
| **Body Small** | PP Formula SemiExtended | Regular (400) | 14px | Supporting text |
| **Caption** | PP Formula SemiExtended | Light (300) | 12px | Labels, metadata |
| **Button** | PP Formula SemiExtended | SemiBold (600) | 14px | ALL CAPS, +0.1em tracking |
| **Form Input** | PP Formula SemiExtended | Regular (400) | 16px | Input fields |
| **Form Label** | PP Formula SemiExtended | Medium (500) | 14px | Field labels |

### Typography Classes

```tsx
// Copy these exact classNames for consistency

const TYPOGRAPHY = {
  // Headings
  pageTitle: "font-playfair font-bold text-5xl md:text-6xl tracking-playfair-tight",
  sectionHeader: "font-playfair font-semibold text-3xl md:text-4xl tracking-playfair-normal",
  cardTitle: "font-playfair font-semibold text-2xl",

  // Body
  bodyLarge: "font-formula text-lg md:text-xl leading-inter-body",
  bodyDefault: "font-formula text-base leading-inter-body",
  bodySmall: "font-formula text-sm",
  caption: "font-formula font-light text-xs",

  // Interactive
  button: "font-formula font-semibold text-sm tracking-button uppercase",
  link: "font-formula font-medium text-sm hover:text-luxury-gold transition-colors",

  // Forms
  input: "font-formula text-base",
  label: "font-formula font-medium text-sm",
}
```

---

## Color System

### Core Palette

```css
/* In globals.css and tailwind.config.js */

--color-rich-black: #0A0A0A;      /* Backgrounds, primary surfaces */
--color-pure-white: #FFFFFF;       /* Primary text, highlights */
--color-luxury-gold: #D4AF37;      /* Primary accent, CTAs, focus */
```

### Extended Palette

```css
--color-charcoal: #1A1A1A;         /* Elevated surfaces, cards */
--color-soft-white: #F8F8F8;       /* Light mode backgrounds (future) */
--color-muted-gold: #B8941E;       /* Hover states on gold */
--color-pale-gold: #F4E7C3;        /* Subtle accents, gradients */
--color-dark-gold: #8B7028;        /* Gradients, depth */
```

### Functional Colors

```css
--color-divider-dark: #2A2A2A;           /* Borders on dark */
--color-text-secondary-dark: #A0A0A0;    /* Muted text on dark */
```

### Semantic Colors

```tsx
// Status & Feedback
const SEMANTIC = {
  // Success
  successBg: "bg-green-500/10",
  successBorder: "border-green-500",
  successText: "text-green-400",

  // Error
  errorBg: "bg-red-500/10",
  errorBorder: "border-red-500",
  errorText: "text-red-400",

  // Warning
  warningBg: "bg-yellow-500/10",
  warningBorder: "border-yellow-500",
  warningText: "text-yellow-400",

  // Info
  infoBg: "bg-luxury-gold/10",
  infoBorder: "border-luxury-gold/30",
  infoText: "text-pale-gold",
}
```

### Color Usage Rules

✅ **DO USE GOLD FOR:**
- Primary action buttons
- Focus states
- Icons that need emphasis
- Hover states on navigation
- Progress indicators
- Accent elements
- Stat highlights

❌ **DO NOT USE GOLD FOR:**
- Body text (use Text Secondary Dark)
- Large backgrounds
- Long text blocks
- Multiple elements simultaneously (creates visual noise)

---

## Light Mode

Light mode uses the same brand palette with inverted surfaces and adjusted gold for contrast.

### Light Mode Principles
- **Backgrounds** switch to Soft White.
- **Primary text** switches to Rich Black.
- **Gold accents** shift darker for legibility (Dark Gold).
- **Contrast** must stay WCAG AA or better.

### Light Mode Token Mapping
These are applied via CSS variables in `frontend/app/globals.css`:

```
--color-rich-black: 248 248 248;   /* Soft White surfaces */
--color-pure-white: 10 10 10;      /* Rich Black text */
--color-charcoal: 255 255 255;     /* Card surfaces */
--color-divider-dark: 229 229 229; /* Light borders */
--color-text-secondary-dark: 102 102 102; /* Muted text */
--color-grid-dot: 10 10 10;        /* Dotted grid */
--color-luxury-gold: 139 112 40;   /* Dark Gold for text */
```

### Light Mode Usage Rules
- Use **`bg-rich-black`** for page backgrounds (now Soft White in light mode).
- Use **`text-pure-white`** for primary text (now Rich Black in light mode).
- Keep **`bg-luxury-gold`** for primary CTAs (gold remains the signature accent).
- Use **`text-luxury-gold`** sparingly for short labels and accents.
- Avoid large gold text blocks on light backgrounds.

---

## Component Patterns

### 1. Buttons

#### Primary Button (Gold)
```tsx
<button className="px-10 py-4 bg-luxury-gold hover:bg-muted-gold text-rich-black font-formula font-semibold text-sm tracking-button uppercase rounded-xl transition-all duration-300 shadow-xl shadow-luxury-gold/30 hover:shadow-2xl hover:shadow-luxury-gold/60 hover:scale-[1.03] relative overflow-hidden">
  {/* Optional shimmer effect */}
  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

  <span className="relative z-10">
    ACTION TEXT
  </span>
</button>
```

#### Secondary Button (Outlined Gold)
```tsx
<button className="px-10 py-4 bg-transparent hover:bg-luxury-gold/10 text-luxury-gold border-2 border-luxury-gold/40 hover:border-luxury-gold font-formula font-semibold text-sm tracking-button uppercase rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-luxury-gold/20">
  ACTION TEXT
</button>
```

#### Tertiary Button (Ghost)
```tsx
<button className="px-6 py-2 text-text-secondary-dark hover:text-luxury-gold font-formula font-medium text-sm transition-colors">
  Action Text
</button>
```

#### Disabled State
```tsx
<button className="disabled:bg-luxury-gold/50 disabled:cursor-not-allowed disabled:shadow-none" disabled>
  ACTION TEXT
</button>
```

### 2. Form Inputs

#### Text Input
```tsx
<div className="space-y-2">
  <label htmlFor="field" className="block font-formula font-medium text-sm text-pure-white">
    Field Label
  </label>
  <input
    id="field"
    type="text"
    className="w-full px-4 py-3 bg-charcoal border border-divider-dark rounded-xl text-pure-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all"
    placeholder="Placeholder text"
  />
</div>
```

#### Input with Error
```tsx
<div className="space-y-2">
  <label className="block font-formula font-medium text-sm text-pure-white">
    Field Label
  </label>
  <input
    className="w-full px-4 py-3 bg-charcoal border border-red-500 rounded-xl text-pure-white focus:outline-none focus:ring-2 focus:ring-red-500"
  />
  <p className="text-sm text-red-400 font-formula">Error message here</p>
</div>
```

### 3. Cards

#### Standard Card
```tsx
<div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-rich-black via-charcoal to-rich-black border border-divider-dark/50 backdrop-blur-xl">
  {/* Card content */}
</div>
```

#### Elevated Card (with gold accent)
```tsx
<div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-rich-black via-charcoal to-rich-black border border-luxury-gold/20 backdrop-blur-xl shadow-2xl shadow-luxury-gold/10 ring-1 ring-luxury-gold/10">
  {/* Card content */}
</div>
```

### 4. Alerts & Messages

#### Success Message
```tsx
<div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-xl">
  <p className="font-medium">Success!</p>
  <p className="mt-1 text-sm">Your action completed successfully.</p>
</div>
```

#### Error Message
```tsx
<div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-xl">
  <p className="font-medium">Error</p>
  <p className="mt-1 text-sm">Something went wrong. Please try again.</p>
</div>
```

#### Info Badge
```tsx
<div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-charcoal/80 border border-luxury-gold/20 backdrop-blur-md shadow-lg shadow-luxury-gold/10">
  <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-pulse" />
  <span className="text-sm font-formula font-light text-pale-gold tracking-wide italic">
    Info text here
  </span>
</div>
```

### 5. Loading States

#### Spinner
```tsx
<div className="flex items-center justify-center">
  <div className="relative w-12 h-12">
    <div className="absolute inset-0 rounded-full border-4 border-divider-dark"></div>
    <div className="absolute inset-0 rounded-full border-4 border-luxury-gold border-t-transparent animate-spin"></div>
  </div>
</div>
```

#### Full Page Loading
```tsx
<div className="min-h-screen bg-rich-black flex items-center justify-center">
  <div className="text-center space-y-4">
    <div className="relative w-16 h-16 mx-auto">
      <div className="absolute inset-0 rounded-full border-4 border-divider-dark"></div>
      <div className="absolute inset-0 rounded-full border-4 border-luxury-gold border-t-transparent animate-spin"></div>
    </div>
    <p className="font-playfair italic text-xl text-text-secondary-dark">
      Loading...
    </p>
  </div>
</div>
```

---

## Page Layouts

### 1. Full-Page Layout (Auth Pages)

```tsx
<div className="min-h-screen bg-rich-black text-pure-white relative overflow-hidden">
  {/* Background (Vanta.js or similar) */}
  <VantaBackground />

  {/* Optional static grid */}
  <div
    className="fixed inset-0 opacity-[0.08] pointer-events-none"
    style={{
      backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    }}
  />

  {/* Content */}
  <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
    <div className="max-w-md w-full">
      {/* Page content */}
    </div>
  </div>
</div>
```

### 2. Card-Based Layout (Login/Signup)

```tsx
<div className="min-h-screen bg-rich-black flex items-center justify-center px-4">
  <div className="max-w-md w-full space-y-6 p-8 rounded-2xl bg-gradient-to-br from-rich-black via-charcoal to-rich-black border border-luxury-gold/20 backdrop-blur-xl shadow-2xl shadow-luxury-gold/10">

    {/* Header */}
    <div className="text-center space-y-2">
      <h1 className="font-playfair font-bold text-4xl text-pure-white">
        Page Title
      </h1>
      <p className="font-formula text-text-secondary-dark">
        Supporting text
      </p>
    </div>

    {/* Content */}
    {/* ... */}

  </div>
</div>
```

### 3. Header Navigation

```tsx
<header className="relative z-50 px-6 py-4 border-b border-divider-dark/50 backdrop-blur-sm">
  <div className="max-w-7xl mx-auto flex items-center justify-between">

    {/* Logo */}
    <Link href="/" className="flex items-center gap-3 group">
      <div className="relative w-8 h-8">
        <Image
          src="/Retentio-logo.png"
          alt="Rententio"
          fill
          sizes="32px"
          className="object-contain transition-transform group-hover:scale-105"
        />
      </div>
      <span className="text-xl font-playfair font-semibold tracking-tight text-pure-white">
        Rententio
      </span>
    </Link>

    {/* Navigation */}
    <nav className="flex items-center gap-8">
      <Link
        href="/login"
        className="text-sm font-formula font-medium tracking-wide text-text-secondary-dark hover:text-luxury-gold transition-colors"
      >
        Sign in
      </Link>
    </nav>

  </div>
</header>
```

---

## Animation & Motion

### Timing Functions

```tsx
// Use these for consistent motion
const TIMING = {
  fast: "150ms",
  normal: "300ms",
  slow: "700ms",
  easing: "ease-in-out",
}

// In Tailwind:
// transition-all duration-150 ease-in-out  // Fast
// transition-all duration-300 ease-in-out  // Normal (default)
// transition-all duration-700 ease-in-out  // Slow
```

### Hover Effects

```tsx
// Scale on hover
className="hover:scale-[1.02] transition-transform duration-300"

// Glow on hover
className="hover:shadow-xl hover:shadow-luxury-gold/30 transition-shadow duration-300"

// Color shift on hover
className="text-text-secondary-dark hover:text-luxury-gold transition-colors duration-300"
```

### Entrance Animations

```tsx
// Fade in from below
className="animate-in fade-in slide-in-from-bottom-4 duration-500"

// Fade in
className="animate-in fade-in duration-500"

// Scale in
className="animate-in zoom-in-95 duration-300"
```

---

## Accessibility

### Color Contrast Ratios

| Combination | Ratio | WCAG Level |
|-------------|-------|------------|
| Pure White on Rich Black | 21:1 | AAA |
| Luxury Gold on Rich Black | 8.2:1 | AA |
| Text Secondary on Rich Black | 6.5:1 | AA |

### Focus States

All interactive elements MUST have visible focus states:

```tsx
// Standard focus ring
className="focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:ring-offset-2 focus:ring-offset-rich-black"

// For inputs
className="focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
```

### Screen Reader Support

```tsx
// Hide decorative elements
<div aria-hidden="true">...</div>

// Label interactive elements
<button aria-label="Submit form">
  <IconComponent />
</button>

// Use semantic HTML
<nav>...</nav>
<main>...</main>
<header>...</header>
<footer>...</footer>
```

---

## Quick Reference: Token Library

Copy-paste these for rapid development:

```tsx
const RENTENTIO_TOKENS = {
  // Colors
  bg: {
    primary: "bg-rich-black",
    card: "bg-charcoal",
    elevated: "bg-gradient-to-br from-rich-black via-charcoal to-rich-black",
  },

  text: {
    primary: "text-pure-white",
    secondary: "text-text-secondary-dark",
    gold: "text-luxury-gold",
  },

  border: {
    default: "border-divider-dark",
    gold: "border-luxury-gold/20",
    accent: "border-luxury-gold/30",
  },

  // Buttons
  button: {
    primary: "px-10 py-4 bg-luxury-gold hover:bg-muted-gold text-rich-black font-formula font-semibold text-sm tracking-button uppercase rounded-xl transition-all duration-300 shadow-xl shadow-luxury-gold/30",
    secondary: "px-10 py-4 bg-transparent hover:bg-luxury-gold/10 text-luxury-gold border-2 border-luxury-gold/40 hover:border-luxury-gold font-formula font-semibold text-sm tracking-button uppercase rounded-xl transition-all duration-300",
    ghost: "px-6 py-2 text-text-secondary-dark hover:text-luxury-gold font-formula font-medium text-sm transition-colors",
  },

  // Typography
  type: {
    h1: "font-playfair font-bold text-5xl md:text-6xl tracking-playfair-tight",
    h2: "font-playfair font-semibold text-3xl md:text-4xl",
    h3: "font-playfair font-semibold text-2xl",
    body: "font-formula text-base leading-inter-body",
    small: "font-formula text-sm",
    caption: "font-formula font-light text-xs",
  },
}
```

---

## Implementation Checklist

When creating a new page, ensure:

- [ ] Uses Rich Black (#0A0A0A) background
- [ ] Includes Vanta.js or animated background
- [ ] Uses Playfair Display for headlines
- [ ] Uses PP Formula SemiExtended for body text and UI
- [ ] Primary CTAs use Luxury Gold
- [ ] Focus states use Luxury Gold
- [ ] All interactive elements have hover states
- [ ] Maintains WCAG AA contrast (minimum 4.5:1)
- [ ] Includes loading states where applicable
- [ ] Uses consistent border radius (rounded-xl for cards, rounded-lg for inputs)
- [ ] Implements backdrop-blur on elevated surfaces
- [ ] Uses shadow-luxury-gold for depth on gold elements

---

## Related Documents

- [lightweight-brand-kit.md](lightweight-brand-kit.md) - Brand foundation
- [landing-page-brand-application.md](landing-page-brand-application.md) - Landing page specifics
- [business-ethos.md](business-ethos.md) - UX principles

---

**Questions?** Reference the landing page implementation at `frontend/components/LandingPage.tsx` for real-world examples of all patterns above.
