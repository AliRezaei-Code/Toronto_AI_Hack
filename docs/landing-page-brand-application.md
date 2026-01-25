# Rententio Landing Page - Brand Application Guide

> How the Rententio brand identity (Black, White & Gold) is applied to the landing page
>
> **Brand System**: Lightweight Brand Kit (updated 2026-01-24)
> **Typography**: Playfair Display + Inter
> **Color System**: Rich Black, Pure White, Luxury Gold
> **Specs Compliance**: landing-page-spec.md, business-ethos.md

---

## Brand Identity Overview

Rententio uses a **luxury, premium aesthetic** with:
- **Black & white** for clarity and sophistication
- **Gold** for emphasis and prestige
- **Serif headlines** (Playfair Display) for elegance
- **Sans-serif body** (Inter) for readability

This creates a professional, high-end feel that differentiates from typical SaaS products.

---

## Typography Application

### Fonts Loaded

**In `layout.tsx`:**
```tsx
const playfair = Playfair_Display({
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
})

const inter = Inter({
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
})
```

### Usage By Element

| Element | Font | Weight | Size | Tracking | Line Height |
|---------|------|--------|------|----------|-------------|
| **Hero Headline** | Playfair Display | Bold (700) | 64-96px | -0.02em | 1.15 |
| **Logo** | Playfair Display | SemiBold (600) | 20px | tight | - |
| **Stats Numbers** | Playfair Display | Bold (700) | 30px | - | - |
| **Body Large** | Inter | Regular (400) | 18-20px | 0 | 1.7 |
| **Navigation** | Inter | Medium (500) | 14px | wide | - |
| **Buttons** | Inter | SemiBold (600) | 14px | +0.1em | - |
| **Feature Labels** | Inter | Regular (400) | 14px | 0 | - |
| **Stats Labels** | Inter | Light (300) | 12px | +0.1em | - |
| **Footer** | Inter | Light (300) | 14px | 0 | - |

### Code Examples

**Hero Headline:**
```tsx
<h1 className="font-playfair font-bold tracking-playfair-tight leading-playfair text-6xl lg:text-8xl">
  AI video editing
</h1>
```

**Button (ALL CAPS per Brand Kit):**
```tsx
<Link className="font-inter font-semibold text-sm tracking-button uppercase">
  Get started
</Link>
```

**Body Text:**
```tsx
<p className="font-inter text-xl leading-inter-body text-text-secondary-dark">
  Upload clips and get a retention‑optimized cut in minutes.
</p>
```

---

## Color Application

### Core Palette Usage

| Color | Hex | Usage |
|-------|-----|-------|
| **Rich Black** | #0A0A0A | Page background, text on light |
| **Pure White** | #FFFFFF | Headline text, card text |
| **Luxury Gold** | #D4AF37 | Primary CTA, gradient accent, icons |

### Extended Palette Usage

| Color | Hex | Usage |
|-------|-----|-------|
| **Charcoal** | #1A1A1A | Cards, elevated surfaces, badge |
| **Soft White** | #F8F8F8 | (Reserved for light mode) |
| **Muted Gold** | #B8941E | Hover states on gold buttons |
| **Pale Gold** | #F4E7C3 | Badge text, gradient stops |
| **Dark Gold** | #8B7028 | Logo gradient, glow effects |

### Functional Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Divider Dark** | #2A2A2A | Borders on dark backgrounds |
| **Text Secondary Dark** | #A0A0A0 | Body text, muted labels |

### Gradient Recipes

**Gold Shimmer (headline accent):**
```tsx
className="bg-gradient-to-r from-luxury-gold via-pale-gold to-luxury-gold bg-clip-text text-transparent"
```

**Dark Depth (cards):**
```tsx
className="bg-gradient-to-br from-rich-black via-charcoal to-rich-black"
```

**Gold Glow (environmental depth):**
```tsx
className="bg-gradient-to-b from-luxury-gold/20 to-dark-gold/20 blur-3xl"
```

### Accessibility Compliance

Per Brand Kit accessibility notes:

| Combination | Contrast Ratio | WCAG Level |
|-------------|----------------|------------|
| Pure White on Rich Black | 21:1 | AAA |
| Luxury Gold on Rich Black | 8.2:1 | AA |
| Text Secondary on Rich Black | 6.5:1 | AA |

✅ All text meets WCAG AA minimum (4.5:1 for normal text, 3:1 for large text)

---

## Component-by-Component Brand Application

### 1. Navigation Header

**Design:**
- Background: Rich Black
- Border: Divider Dark (#2A2A2A)
- Logo: Playfair Display + Gold gradient icon
- Links: Inter Medium with gold hover

**Code:**
```tsx
<header className="bg-rich-black border-b border-divider-dark">
  <div className="w-7 h-7 bg-gradient-to-br from-luxury-gold to-dark-gold" />
  <span className="font-playfair font-semibold">Rententio</span>
  <Link className="font-inter font-medium text-text-secondary-dark hover:text-luxury-gold">
    Sign in
  </Link>
</header>
```

### 2. Hero Badge

**Design:**
- Background: Charcoal with gold border
- Dot: Luxury Gold (pulsing)
- Text: Pale Gold, Inter Regular

**Code:**
```tsx
<div className="bg-charcoal border border-luxury-gold/20">
  <div className="w-2 h-2 bg-luxury-gold animate-pulse" />
  <span className="font-inter text-pale-gold">AI-powered retention editing</span>
</div>
```

### 3. Hero Headline

**Design (per Brand Kit Hero typography):**
- Font: Playfair Display Bold
- Size: 64-96px (responsive)
- Line 1: Pure White
- Line 2: Gold Shimmer gradient
- Tracking: -0.02em (tighter for large text)
- Line height: 1.15

**Code:**
```tsx
<h1 className="font-playfair font-bold tracking-playfair-tight leading-playfair">
  <span className="text-6xl lg:text-8xl text-pure-white">
    AI video editing
  </span>
  <span className="text-6xl lg:text-8xl bg-gradient-to-r from-luxury-gold via-pale-gold to-luxury-gold bg-clip-text text-transparent">
    that keeps viewers watching.
  </span>
</h1>
```

### 4. Hero Subtext

**Design (per Brand Kit Body Large):**
- Font: Inter Regular
- Size: 18-20px
- Color: Text Secondary Dark (#A0A0A0)
- Line height: 1.7

**Code:**
```tsx
<p className="font-inter text-xl text-text-secondary-dark leading-inter-body">
  Upload clips and get a retention‑optimized cut in minutes.
</p>
```

### 5. Primary CTA Button

**Design (per Brand Kit Button Guidelines):**
- Background: Luxury Gold
- Text: Rich Black (high contrast)
- Font: Inter SemiBold
- Size: 14px
- Tracking: +0.1em
- Transform: ALL CAPS
- Shadow: Gold glow

**Code:**
```tsx
<Link className="bg-luxury-gold hover:bg-muted-gold text-rich-black font-inter font-semibold text-sm tracking-button uppercase shadow-lg shadow-luxury-gold/30">
  Get started
</Link>
```

**Why this works:**
- Gold is Rententio's signature accent color
- Black text on gold = 8.2:1 contrast (WCAG AA)
- ALL CAPS + wide tracking = premium feel
- Gold glow creates depth and luxury

### 6. Secondary CTA

**Design:**
- No background (text only)
- Color: Text Secondary Dark → Luxury Gold on hover
- Font: Inter Medium
- Transform: Lowercase (contrast with primary)

**Code:**
```tsx
<Link className="text-text-secondary-dark hover:text-luxury-gold font-inter font-medium">
  Sign in
</Link>
```

**Visual hierarchy:**
- Primary (gold button) is brightest element
- Secondary blends with body text until hover

### 7. Product Mockup Card

**Design (per Brand Kit Card styling):**
- Background: Dark Depth gradient
- Border: Gold at 20% opacity
- Stats: Playfair Bold for numbers, Inter Light for labels
- Icons: Luxury Gold

**Code:**
```tsx
<div className="border border-luxury-gold/20 bg-gradient-to-br from-rich-black via-charcoal to-rich-black">
  {/* Stats */}
  <div className="bg-charcoal border border-divider-dark">
    <div className="font-playfair font-bold text-pure-white">47</div>
    <div className="font-inter font-light text-text-secondary-dark uppercase tracking-button">
      Cuts Made
    </div>
  </div>
</div>
```

### 8. Feature Strip Icons

**Design:**
- Background: Charcoal
- Border: Gold at 30% opacity
- Icon: Luxury Gold
- Label: Text Secondary Dark

**Code:**
```tsx
<div className="bg-charcoal border border-luxury-gold/30">
  <svg className="text-luxury-gold">...</svg>
</div>
<span className="font-inter text-text-secondary-dark">Real-time analysis</span>
```

---

## Environmental Creativity (Gold Glow Effects)

Per spec Rule #4, visuals must frame content, not interrupt it.

**Background glow layers:**
```tsx
<div className="absolute inset-0 -z-10">
  {/* Subtle gold ambient glow */}
  <div className="bg-luxury-gold/5 blur-[120px]" />
  <div className="bg-dark-gold/5 blur-[100px]" />
</div>
```

**Mockup glow:**
```tsx
<div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/20 to-dark-gold/20 blur-3xl -z-10" />
```

**Key principles:**
- Very low opacity (5-20%)
- Heavy blur (100-120px)
- Behind content (`-z-10`)
- Adds depth without demanding attention

---

## Brand Consistency Rules

### DO Use Gold For:
✅ Primary CTA background
✅ Headline gradient accent
✅ Icon colors
✅ Hover states on navigation
✅ Badge dot and borders
✅ Stat highlights (+34%)
✅ Environmental glow (low opacity)

### DO NOT Use Gold For:
❌ Body text (use Text Secondary Dark)
❌ Large blocks (overwhelming)
❌ Long words (legibility issues)
❌ Backgrounds without dark text overlay

### DO Use Playfair Display For:
✅ Hero headline
✅ Logo
✅ Stat numbers
✅ Section headers (if added later)

### DO NOT Use Playfair Display For:
❌ Body paragraphs
❌ Buttons/CTAs
❌ Navigation
❌ Form inputs
❌ Any text that needs high readability at small sizes

### DO Use Inter For:
✅ All body text
✅ Buttons (ALL CAPS)
✅ Navigation
✅ Feature labels
✅ Form inputs
✅ Captions

---

## Responsive Typography Scaling

Per Brand Kit hierarchy scale (64-96px for hero):

```tsx
// Mobile → Desktop
text-6xl      // 60px (3.75rem)
md:text-7xl   // 72px (4.5rem)
lg:text-8xl   // 96px (6rem)

// Maintains:
// - Same font (Playfair)
// - Same tracking (-0.02em)
// - Same line height (1.15)
// - Same color
```

**Why this scale:**
- 60px readable on mobile (doesn't overflow)
- 96px impactful on desktop (fills viewport)
- Smooth progression through breakpoints

---

## Future Brand Extensions

### Adding New Colors

If brand evolves, follow these rules:

1. **Maintain contrast ratios** (WCAG AA minimum)
2. **Test with both Playfair and Inter** at all sizes
3. **Update tailwind.config.js** first
4. **Document in Brand Kit** before using

### Adding New Typography Weights

Current weights loaded:
- Playfair: 400, 600, 700
- Inter: 300, 400, 500, 600

To add new weight:
1. Update `layout.tsx` font config
2. Update `tailwind.config.js` if needed
3. Document usage guidelines in Brand Kit
4. Add to this guide's typography table

### Adding New Component Patterns

When creating new components:
1. **Choose typography**: Playfair for emphasis, Inter for function
2. **Choose colors**: Rich Black base, White text, Gold accents
3. **Apply spacing**: Consistent with landing page (px-6, py-4, etc.)
4. **Test contrast**: Use browser DevTools or contrast checker
5. **Document here**: Add to "Component-by-Component" section

---

## Quick Reference: Brand Tokens

**Copy these exact classNames for consistent brand application:**

```tsx
// Typography
const TOKENS = {
  // Headlines
  heroHeadline: "font-playfair font-bold tracking-playfair-tight leading-playfair",
  sectionHeader: "font-playfair font-semibold",

  // Body
  bodyLarge: "font-inter text-xl leading-inter-body",
  bodyDefault: "font-inter text-base leading-inter-body",
  bodySmall: "font-inter text-sm",
  caption: "font-inter font-light text-xs",

  // Interactive
  button: "font-inter font-semibold text-sm tracking-button uppercase",
  nav: "font-inter font-medium text-sm tracking-wide",

  // Colors
  bg: "bg-rich-black",
  bgCard: "bg-charcoal",
  textPrimary: "text-pure-white",
  textSecondary: "text-text-secondary-dark",
  textGold: "text-luxury-gold",
  borderSubtle: "border-divider-dark",
  borderGold: "border-luxury-gold/20",

  // Gradients
  goldGradient: "bg-gradient-to-r from-luxury-gold via-pale-gold to-luxury-gold bg-clip-text text-transparent",
  darkDepth: "bg-gradient-to-br from-rich-black via-charcoal to-rich-black",
  logoGradient: "bg-gradient-to-br from-luxury-gold to-dark-gold",
}
```

---

## Related Documents

- **Brand Kit**: [lightweight-brand-kit.md](lightweight-brand-kit.md) (source of truth)
- **Landing Spec**: [landing-page-spec.md](landing-page-spec.md) (structure rules)
- **Business Ethos**: [business-ethos.md](business-ethos.md) (UX principles)
- **Implementation**: [landing-page-implementation.md](landing-page-implementation.md) (technical)

---

## Change Log

**2026-01-24 - Brand Identity Applied**
- Implemented Black, White & Gold color system
- Applied Playfair Display + Inter typography
- Created gold CTA button as brand signature
- Added gold gradient to headline
- Established luxury dark aesthetic throughout
- All Brand Kit typography and color guidelines followed
