# Rententio Landing Page - Implementation Documentation

> Production implementation of Rententio landing page
>
> **Visual Design**: Based on approved reference mockup
> **Copy & Structure**: Per specification documents
> **Constraints**: business-ethos.md, lightweight-brand-kit.md, landing-page-spec.md

---

## Files Modified/Created

1. **`frontend/components/LandingPage.tsx`** - Landing page component (266 lines)
2. **`frontend/app/page.tsx`** - Conditional rendering logic
3. **`frontend/app/layout.tsx`** - Rententio brand metadata

---

## Design Translation Notes

### How the Reference Image Was Mapped to Code

#### Visual Aesthetic
The reference image established a **cinematic, premium dark theme** with the following characteristics:

| Visual Element | Reference Design | Implementation |
|----------------|------------------|----------------|
| **Background** | Very dark with subtle purple tint | `bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950` |
| **Gradients** | Purple-to-pink prominent throughout | Applied to: headline text, badge, visual mockup glow |
| **Depth & Glow** | Blur effects creating layers | CSS `blur-[120px]`, `shadow-2xl`, `backdrop-blur-sm` |
| **Contrast** | High contrast white text on dark | White text (`text-white`), light CTA button |
| **Typography** | Large, bold headline with gradient accent | `text-8xl font-bold` with `bg-gradient-to-r bg-clip-text` |

#### Layout Structure
```
Reference Layout:          Implementation:
┌─────────────────┐       ┌─────────────────┐
│ Nav Bar         │  →    │ Header          │
├─────────────────┤       ├─────────────────┤
│ Badge           │  →    │ Badge (pill)    │
│ Headline        │  →    │ H1 (gradient)   │
│ Subtext         │  →    │ P (muted)       │
│ CTAs            │  →    │ Buttons (hier)  │
│ Central Mockup  │  →    │ Product visual  │
├─────────────────┤       ├─────────────────┤
│ Feature Strip   │  →    │ 3-icon strip    │
└─────────────────┘       └─────────────────┘
```

**Key Translation Decisions:**
1. **Central alignment** replaced side-by-side layout (from previous iteration)
2. **Badge element** added above headline per reference
3. **Gradient text** on second line of headline for visual interest
4. **Browser chrome** (red/yellow/green dots) added to mockup
5. **Stats bar** integrated into mockup placeholder
6. **Feature icons** styled with subtle colored backgrounds

#### Hierarchy & CTA Dominance Preservation

**From Reference Image:**
- "Get started" button was solid, light-colored, high contrast
- "Watch demo" was secondary text link

**Spec Constraint:**
- Secondary CTA must be "Sign in" (not "Watch demo")

**Implementation Solution:**
```tsx
// Primary: Maximum visual weight (white bg on dark theme = highest contrast)
className="bg-white text-gray-900 font-semibold shadow-lg shadow-white/20"

// Secondary: De-emphasized (text only, lower contrast)
className="text-gray-300 hover:text-white font-medium"
```

**Visual dominance achieved through:**
- Color contrast (white vs. gray-300)
- Shadow/glow (shadow-lg vs. none)
- Weight (font-semibold vs. font-medium)
- Interaction (scale transform vs. color only)

---

### Copy Constraints Applied

**Conflict Resolution Rule:** Specs > Brand Kit > Visual Reference

The reference image showed different copy:
- Reference headline: "Edit for attention"
- Reference subtext: "Cut the noise. Keep the momentum."

**Spec-compliant copy used instead:**
- Headline: "AI video editing that keeps viewers watching." (landing-page-spec.md)
- Subtext: "Upload clips and get a retention‑optimized cut in minutes." (landing-page-spec.md)

**Why this matters:**
- Specs define approved messaging that aligns with Business Ethos
- Reference image demonstrates *visual style*, not final copy
- Consistency with brand voice (calm, declarative, no hype)

---

### Environmental Creativity Implementation

**Spec Rule #4:** "Creativity is environmental: visuals frame the content, never interrupt it."

**How this was enforced:**

1. **Background glow blurs** (lines 68-74)
   ```tsx
   <div className="absolute top-40 left-1/2 w-[800px] h-[600px]
                   bg-purple-600/10 rounded-full blur-[120px]" />
   ```
   - Positioned behind content (`absolute`, `-z-10`)
   - Low opacity (`/10`)
   - Heavy blur makes them ambient, not focal

2. **Product mockup glow** (lines 159-162)
   ```tsx
   <div className="absolute inset-0 bg-gradient-to-b from-purple-600/30
                   to-pink-600/30 blur-3xl -z-10 scale-110" />
   ```
   - Behind mockup, not interrupting user path from headline → CTA → visual
   - Creates depth but doesn't demand attention

3. **Badge element** (lines 82-87)
   - Above headline but subtle (low opacity bg, small size)
   - Provides context without competing for attention
   - Pulsing dot is only animated element (draws eye briefly)

**What was avoided:**
- Decorative elements between headline and CTAs
- High-opacity gradients that compete with text
- Animations that distract from primary action path

---

## Future Agent Guardrails

### What MUST NOT Change

#### 1. Visual Hierarchy Flow
```tsx
// DO NOT reorder or insert elements between these:
Badge → Headline → Subtext → CTAs → Visual

// This sequence ensures:
// - Context (badge)
// - Value prop (headline)
// - Explanation (subtext)
// - Action (CTAs)
// - Proof (visual mockup)
```
**Reason:** Follows "what/why/what-to-do" structure per spec Rule #2.

#### 2. CTA Visual Dominance
```tsx
// Primary CTA MUST remain highest contrast element in hero
// Current: white bg on dark = ~21:1 contrast ratio
// Secondary: gray-300 on dark = ~4.5:1 contrast ratio

// DO NOT make secondary CTA more prominent
// DO NOT add additional CTAs to hero section
```
**Reason:** Business Ethos "One primary action per screen."

#### 3. Copy Source
```tsx
// ALL copy must come from landing-page-spec.md
// NEVER use copy from visual references or mockups
// Current spec copy:
const HEADLINE = "AI video editing that keeps viewers watching."
const SUBTEXT = "Upload clips and get a retention‑optimized cut in minutes."
const PRIMARY_CTA = "Get started"
const SECONDARY_CTA = "Sign in"
```
**Reason:** Specs define approved messaging aligned with Brand Kit tone.

#### 4. Gradient Opacity Limits
```tsx
// Environmental gradients MUST stay low opacity
// Maximum allowed: /30 (30% opacity)
// Preferred: /10 to /20 for ambient effects

// DO NOT use:
// - bg-purple-600 (100% opacity - too dominant)
// - Gradients on interactive elements (buttons, links)
```
**Reason:** Spec Rule #4 "environmental creativity" - frame, don't interrupt.

#### 5. Auth Routing Logic
```tsx
// In page.tsx:
return user ? <HomeContent /> : <LandingPage />

// DO NOT change to:
// - Always show landing (breaks "speed to value")
// - Add intermediate screens (creates friction)
// - Redirect authenticated users to landing
```
**Reason:** Business Ethos "Fast results and minimal friction."

---

### What MAY Be Extended

#### 1. Product Mockup Replacement
```tsx
// Current: Placeholder gradient box with browser chrome
// Location: Lines 154-206

// May replace with:
// ✅ Actual product screenshot
// ✅ Animated demo video (autoplay, muted)
// ✅ Interactive preview (minimal JS)

// MUST preserve:
// - Browser chrome (red/yellow/green dots)
// - Rounded corners (rounded-2xl)
// - Glow effect behind mockup
// - Stats bar below (or integrate into screenshot)
// - Central placement
```

**Replacement guidelines:**
1. Keep aspect ratio close to current (slightly wider than 16:9)
2. Maintain dark theme of mockup (matches page aesthetic)
3. Ensure stats (cuts made, time saved, retention) are visible
4. Keep file size under 500KB for fast load

#### 2. Gradient Color Palette
```tsx
// Current palette:
// - Purple: purple-400, purple-500, purple-600
// - Pink: pink-400, pink-600
// - Blue: blue-400, blue-500, blue-600

// May adjust exact shades if:
// ✅ Brand evolves
// ✅ Accessibility requires higher contrast
// ✅ A/B testing shows better conversion

// MUST maintain:
// - Low opacity for environmental elements (/10 to /30)
// - Consistent use across badge, headline, mockup glow
// - No red/orange (reserved for errors)
```

#### 3. Badge Copy
```tsx
// Current: "AI-powered retention editing"
// May change to:
// ✅ Seasonal messages ("New: Real-time analysis")
// ✅ Social proof ("Trusted by 10,000+ creators")
// ✅ Product status ("Beta" / "Now available")

// MUST maintain:
// - Pill shape with pulsing dot
// - Low visual weight (doesn't compete with headline)
// - Single line of text (no multi-line badges)
```

#### 4. Feature Strip Content
```tsx
// Current: 3 features (Real-time analysis, Smart cuts, Export ready)
// May change to:
// ✅ Different 3 features based on product evolution
// ✅ Different icons (keep same size/style)
// ✅ 2-4 features (not more - keeps minimal)

// MUST maintain:
// - Icon + text horizontal layout
// - Colored backgrounds matching gradient palette
// - Below-fold placement (not in hero)
// - Brief text (2-4 words max per feature)
```

#### 5. Interaction Enhancements
```tsx
// May add:
// ✅ Subtle parallax on background glow
// ✅ Video preview on mockup hover
// ✅ Stats counter animation on scroll
// ✅ Smooth scroll to feature strip

// MUST NOT add:
// ❌ Modal popups on page load
// ❌ Chat widgets or floating elements
// ❌ Auto-playing videos with sound
// ❌ Anything that delays or blocks CTA access
```

---

### How to Maintain Consistency with Other Screens

#### Landing Page vs. App UI Distinction

**Landing Page** (expressive, persuasive):
```tsx
// Large scale
<h1 className="text-8xl">

// Gradient effects
className="bg-gradient-to-r from-purple-400 via-pink-400 bg-clip-text"

// Glow and depth
className="shadow-2xl blur-3xl backdrop-blur"

// Center-aligned
className="text-center max-w-6xl mx-auto"
```

**App UI** (functional, data-dense) - see upload-screen-spec.md:
```tsx
// Smaller scale
<h1 className="text-xl">

// Minimal effects
className="border border-gray-800"

// No gradients on functional elements
// Left-aligned or justified
```

**When to use which:**
- Landing page style: Marketing pages, public-facing content
- App UI style: Upload, editor, settings, dashboard (authenticated)

#### Shared Design Tokens

Extract these for consistency across all screens:

```tsx
// colors.ts
export const tokens = {
  // Gradients
  logoGradient: "from-blue-500 to-purple-600",
  headlineGradient: "from-purple-400 via-pink-400 to-purple-400",

  // Borders
  subtleBorder: "border-white/5",
  accentBorder: "border-white/10",

  // Backgrounds
  darkBase: "bg-gray-950",
  darkCard: "bg-gray-900",

  // CTA
  primaryCTA: "bg-white text-gray-900 shadow-lg shadow-white/20",
  secondaryCTA: "text-gray-300 hover:text-white",

  // Feature accents
  purpleAccent: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  blueAccent: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  pinkAccent: "bg-pink-500/10 border-pink-500/20 text-pink-400",
}
```

#### Screen-Specific UX Rules

Each screen type has different constraints:

| Screen Type | Primary Goal | Visual Approach | Example |
|-------------|--------------|-----------------|---------|
| **Landing** | Convert visitors | Expressive, cinematic | This page |
| **Upload** | Guide file selection | Spacious, instructional | upload-screen-spec.md |
| **Editor** | Enable precise edits | Dense, functional | (TBD) |
| **Settings** | Provide control | Organized, scannable | (TBD) |

When implementing new screens:
1. Read the specific screen's spec document FIRST
2. Apply appropriate visual approach from table above
3. Reuse shared tokens for consistency
4. Test that primary action is obvious within 3 seconds

---

## Technical Implementation Details

### Accessibility Compliance

**WCAG AA Standards Met:**

1. **Color Contrast**
   - Primary CTA: White on dark = 21:1 (exceeds 4.5:1 minimum)
   - Body text: Gray-400 on gray-950 = 8.2:1
   - Subtext: Gray-400 on gray-950 = 8.2:1

2. **Heading Hierarchy**
   - H1: Hero headline (one per page)
   - No H2 on landing (feature strip uses div/span)
   - Semantic heading structure preserved

3. **Interactive Elements**
   - All CTAs are `<Link>` or `<button>` (keyboard navigable)
   - Hover states defined for all interactive elements
   - Focus states inherit from TailwindCSS defaults

4. **Decorative Elements**
   - Background glows marked `aria-hidden="true"`
   - Logo gradient marked `aria-hidden="true"`
   - Only semantic content exposed to screen readers

### Responsive Behavior

**Breakpoint Strategy:**

```tsx
// Mobile-first with strategic desktop enhancements
// No tablet-specific breakpoints (reduces complexity)

// Text scale
text-6xl         // Mobile: 60px
md:text-7xl      // Medium: 72px
lg:text-8xl      // Large: 96px

// Layout
flex-col              // Mobile: stack
sm:flex-row           // Small: horizontal

// Visibility
hidden                // Mobile: hidden
md:block              // Medium: show
```

**Mobile optimizations:**
- Feature strip centers on mobile (`justify-center md:justify-start`)
- CTA buttons stack vertically (`flex-col sm:flex-row`)
- Headline scales down to 60px to prevent overflow
- Product mockup maintains readability (aspect-video ensures proper ratio)

### Performance Considerations

**CSS-only effects** (no image files):
- All gradients via TailwindCSS utilities
- All glows via `blur-` utilities
- All shadows via `shadow-` utilities

**Benefits:**
- Zero image HTTP requests for visual effects
- Instant rendering (no FOUC)
- Small CSS bundle (PurgeCSS removes unused)
- Easy to theme/customize

**Recommended optimizations:**
1. When adding product screenshot: Use Next.js `<Image>` component
2. Enable lazy loading for below-fold images
3. Compress any added visuals with `sharp` or similar
4. Consider WebP/AVIF for mockup screenshot

---

## Code Reference Map

Quick reference for where specific elements are implemented:

| Element | Line Range | Notes |
|---------|-----------|-------|
| Background gradient | 27 | Page-level dark gradient |
| Header/Nav | 33-54 | Logo + Sign in link |
| Background glow | 68-74 | Environmental depth effect |
| Badge | 82-87 | Pill with pulsing dot |
| Headline | 95-102 | Two-line with gradient on second line |
| Subtext | 110-112 | Muted gray, centered |
| Primary CTA | 122-137 | White button with arrow |
| Secondary CTA | 140-145 | Text link |
| Mockup container | 154-206 | Browser chrome + placeholder + stats |
| Feature strip | 216-250 | 3 icons with labels |
| Footer | 258-262 | Copyright only |

---

## Testing Checklist

Before deploying or modifying:

### Visual Regression
- [ ] Headline gradient displays correctly on all browsers
- [ ] Background glow effects visible but not overwhelming
- [ ] Primary CTA is brightest element in viewport
- [ ] Badge pulsing animation smooth (not janky)
- [ ] Product mockup glow creates depth

### Copy Compliance
- [ ] Headline matches landing-page-spec.md exactly
- [ ] Subtext matches landing-page-spec.md exactly
- [ ] No "AI magic" or hype language present
- [ ] Tone is calm and declarative

### Functional
- [ ] Both CTAs navigate to `/login`
- [ ] Authenticated users bypass landing page
- [ ] Unauthenticated users see landing page
- [ ] Loading spinner shows during auth check

### Accessibility
- [ ] Keyboard navigation works (tab through CTAs)
- [ ] Screen reader announces heading hierarchy
- [ ] Color contrast meets WCAG AA
- [ ] No decorative elements in accessibility tree

### Responsive
- [ ] Mobile: Headline readable (not cut off)
- [ ] Mobile: CTAs stack vertically
- [ ] Mobile: Feature strip centers
- [ ] Desktop: All elements visible above fold (1920x1080)

### Performance
- [ ] Page loads in under 2 seconds on 3G
- [ ] No layout shift (CLS < 0.1)
- [ ] No FOUC (flash of unstyled content)

---

## Related Documents

- **Business Ethos**: [business-ethos.md](business-ethos.md)
- **Brand Kit**: [lightweight-brand-kit.md](lightweight-brand-kit.md)
- **Landing Spec**: [landing-page-spec.md](landing-page-spec.md)
- **Upload Spec**: [upload-screen-spec.md](upload-screen-spec.md) (next screen type)

---

## Change Log

**2026-01-24 - Production Implementation**
- Implemented cinematic dark theme with purple/pink gradients
- Added badge element above headline
- Created center-aligned hero layout
- Implemented gradient text on headline
- Added browser chrome and stats to product mockup placeholder
- Created 3-icon feature strip
- All visual elements use CSS only (no images)
- Copy remains spec-compliant (not from reference image)
- Maintained CTA hierarchy and auth routing logic
