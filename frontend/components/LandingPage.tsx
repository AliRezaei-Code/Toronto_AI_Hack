'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamically import Vanta component with no SSR
const VantaBackground = dynamic(() => import('./VantaBackground').then(mod => mod.VantaBackground), {
  ssr: false,
  loading: () => null
});

/**
 * RENTENTIO LANDING PAGE - EDITOR TOOL AESTHETIC
 *
 * Visual Design: Professional editor workspace feel
 * - Dotted grid background (graph paper aesthetic)
 * - Strategic use of italics for elegance
 * - Black, White & Gold luxury palette
 * - Centered two-button layout
 *
 * Typography: Playfair Display (headlines with italic accents) + Inter (body)
 * Copy & Structure: Per landing-page-spec.md
 * Constraints: business-ethos.md, lightweight-brand-kit.md
 *
 * BRAND APPLICATION:
 * - Rich Black (#0A0A0A) base with subtle dot grid
 * - Pure White (#FFFFFF) text with Luxury Gold (#D4AF37) highlights
 * - Playfair Display Bold + Italic for sophisticated headlines
 * - Two-line headline for impact
 * - Centered CTA buttons (Get started + Watch demo)
 */

export function LandingPage() {
  return (
    <div className="min-h-screen bg-rich-black text-pure-white relative overflow-hidden">
      {/*
        VANTA.JS DOTS BACKGROUND
        Elegant animated golden dots effect
      */}
      <VantaBackground />

      {/*
        DOTTED GRID BACKGROUND
        Creates professional editor/design tool aesthetic
        Light dots on dark background, subtle and non-distracting
      */}
      <div
        className="fixed inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgb(var(--color-grid-dot) / 0.15) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/*
        SUBTLE VIGNETTE
        Focuses attention on center content
      */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 10, 0.4) 100%)',
        }}
        aria-hidden="true"
      />

      {/*
        TOP NAVIGATION
        Clean, minimal, professional
      */}
      <header className="relative z-50 px-6 py-4 border-b border-divider-dark/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo - actual Rententio logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8">
              <Image
                src="/Retentio-logo.png"
                alt="Rententio"
                fill
                sizes="32px"
                className="object-contain transition-transform group-hover:scale-105"
                priority
              />
            </div>
            <span className="text-xl font-playfair font-semibold tracking-tight">Rententio</span>
          </Link>

          {/* Navigation with gold hover */}
          <nav className="flex items-center gap-8">
            <Link
              href="/login"
              className="text-sm font-inter font-medium tracking-wide text-text-secondary-dark hover:text-luxury-gold transition-colors"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative">
        {/*
          HERO SECTION - CENTERED LAYOUT
          Two-line headline, centered buttons, professional feel
          Tighter spacing to show more of editor mockup
        */}
        <section className="relative px-6 py-12 md:py-16">
          {/*
            Subtle gold glow - environmental depth
          */}
          <div
            className="absolute inset-0 -z-10 overflow-hidden"
            aria-hidden="true"
          >
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-luxury-gold/3 rounded-full blur-[140px]" />
          </div>

          <div className="max-w-5xl mx-auto text-center">
            {/*
              BADGE - Professional context marker
            */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-charcoal/80 border border-luxury-gold/20 backdrop-blur-md shadow-lg shadow-luxury-gold/10">
                <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-pulse" />
                <span className="text-sm font-inter font-light text-pale-gold tracking-wide italic">
                  AI-powered retention editing
                </span>
              </div>
            </div>

            {/*
              HEADLINE - Two lines, mix of regular and italic
              Per Brand Kit: Playfair Display for headlines with italic for emphasis
              Line 1: Bold regular
              Line 2: Bold italic (elegant, sophisticated)
            */}
            <h1 className="mb-6 font-playfair font-bold tracking-playfair-tight leading-playfair">
              <span className="block text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-pure-white mb-2">
                Edit for attention
              </span>
              <span className="block text-5xl md:text-6xl lg:text-7xl xl:text-8xl italic bg-gradient-to-r from-luxury-gold via-pale-gold to-luxury-gold bg-clip-text text-transparent tracking-gold">
                and retention.
              </span>
            </h1>

            {/*
              SUBTEXT - Elegant italic accent
              Per Brand Kit: Cormorant Garamond Italic for pull quotes / short emphasis
              Using Playfair Italic as fallback (Cormorant not yet loaded)
            */}
            <p className="text-xl md:text-2xl font-playfair italic text-text-secondary-dark max-w-3xl mx-auto mb-8 leading-relaxed tracking-wide">
              Rententio analyzes your footage and edits for maximum viewer retention.
            </p>

            {/*
              TWO-BUTTON CENTERED LAYOUT
              Per user request: "Get started" + "Watch demo"
              Both prominent, side-by-side, centered
            */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              {/* Primary CTA - Luxury Gold (signature) */}
              <Link
                href="/login"
                className="group w-full sm:w-auto px-10 py-4 bg-luxury-gold hover:bg-muted-gold text-rich-black font-inter font-semibold text-sm tracking-button uppercase rounded-xl transition-all duration-300 shadow-xl shadow-luxury-gold/30 hover:shadow-2xl hover:shadow-luxury-gold/60 hover:scale-[1.03] relative overflow-hidden"
              >
                {/* Button shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <span className="flex items-center justify-center gap-3 relative z-10">
                  Get started
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>

              {/* Secondary CTA - Watch demo (outlined gold) */}
              <Link
                href="#demo"
                className="group w-full sm:w-auto px-10 py-4 bg-transparent hover:bg-luxury-gold/10 text-luxury-gold border-2 border-luxury-gold/40 hover:border-luxury-gold font-inter font-semibold text-sm tracking-button uppercase rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-luxury-gold/20"
              >
                <span className="flex items-center justify-center gap-3">
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch demo
                </span>
              </Link>
            </div>

            {/*
              PRODUCT MOCKUP - Editor workspace aesthetic
              Professional tool feel with subtle textures
              LARGER and more prominent to impress users
            */}
            <div className="relative max-w-7xl mx-auto">
              {/*
                Enhanced gold glow behind mockup - more dramatic
              */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-luxury-gold/25 via-luxury-gold/10 to-transparent blur-[100px] -z-10 scale-110 animate-pulse"
                style={{ animationDuration: '4s' }}
                aria-hidden="true"
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-luxury-gold/5 rounded-full blur-[120px] -z-10"
                aria-hidden="true"
              />

              {/*
                Product interface mockup
                Dark with gold accents, professional editor styling
              */}
              <div className="relative rounded-2xl border border-luxury-gold/30 bg-gradient-to-br from-rich-black/95 via-charcoal/95 to-rich-black/95 backdrop-blur-xl shadow-2xl shadow-luxury-gold/20 overflow-hidden ring-1 ring-luxury-gold/10">
                {/* Subtle inner glow - enhanced */}
                <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/10 via-transparent to-luxury-gold/5 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-luxury-gold/5 pointer-events-none" />

                {/* Browser chrome - more refined */}
                <div className="relative flex items-center gap-2 px-6 py-4 border-b border-divider-dark/50 bg-charcoal/30 backdrop-blur-sm">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/90 hover:bg-red-500 transition-colors cursor-pointer" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/90 hover:bg-yellow-500 transition-colors cursor-pointer" />
                    <div className="w-3 h-3 rounded-full bg-green-500/90 hover:bg-green-500 transition-colors cursor-pointer" />
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <div className="w-4 h-4 relative">
                      <Image
                        src="/Retentio-logo.png"
                        alt=""
                        fill
                        sizes="16px"
                        className="object-contain opacity-60"
                      />
                    </div>
                    <span className="text-xs font-inter text-text-secondary-dark tracking-wide">
                      Rententio Editor
                    </span>
                  </div>
                </div>

                {/* Editor interface demo */}
                <div className="relative p-8">
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-charcoal via-rich-black to-charcoal border border-divider-dark/30 overflow-hidden relative group">
                    {/* Demo video */}
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      src="/Retentio-hero-video.mov"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                    />

                    {/* Animated grid overlay */}
                    <div
                      className="absolute inset-0 opacity-[0.08] transition-opacity group-hover:opacity-[0.12] pointer-events-none"
                      style={{
                        backgroundImage: `
                          linear-gradient(rgba(212, 175, 55, 0.15) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(212, 175, 55, 0.15) 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px',
                      }}
                      aria-hidden="true"
                    />

                    {/* Scanning line effect */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                      <div
                        className="absolute w-full h-px bg-gradient-to-r from-transparent via-luxury-gold/40 to-transparent animate-scan"
                        style={{
                          animation: 'scan 3s linear infinite',
                        }}
                      />
                    </div>

                    {/* Editor UI elements floating */}
                    <div className="absolute top-6 left-6 flex gap-2 opacity-50 pointer-events-none" aria-hidden="true">
                      <div className="w-16 h-2 rounded-full bg-luxury-gold/30" />
                      <div className="w-12 h-2 rounded-full bg-luxury-gold/20" />
                      <div className="w-20 h-2 rounded-full bg-luxury-gold/25" />
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 h-12 rounded-lg bg-charcoal/60 border border-luxury-gold/10 backdrop-blur-sm opacity-50 pointer-events-none" aria-hidden="true" />
                  </div>

                  {/* Stats bar - editor metrics */}
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="text-center p-5 rounded-xl bg-charcoal/60 border border-divider-dark/30 backdrop-blur-sm">
                      <div className="text-4xl font-playfair font-bold text-pure-white mb-1">47</div>
                      <div className="text-xs font-inter font-light text-text-secondary-dark uppercase tracking-button">Cuts Made</div>
                    </div>
                    <div className="text-center p-5 rounded-xl bg-charcoal/60 border border-divider-dark/30 backdrop-blur-sm">
                      <div className="text-4xl font-playfair font-bold text-pure-white mb-1">2.5 hrs</div>
                      <div className="text-xs font-inter font-light text-text-secondary-dark uppercase tracking-button">Time Saved</div>
                    </div>
                    <div className="text-center p-5 rounded-xl bg-charcoal/60 border border-divider-dark/30 backdrop-blur-sm">
                      <div className="text-4xl font-playfair font-bold text-luxury-gold mb-1">+34%</div>
                      <div className="text-xs font-inter font-light text-text-secondary-dark uppercase tracking-button">Retention</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*
          FEATURE STRIP - Editor capabilities
          Professional tool features with icons
        */}
        <section className="relative px-6 py-16 border-t border-divider-dark/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-10">
              {/* Feature 1 */}
              <div className="text-center space-y-3">
                <div className="inline-flex w-14 h-14 rounded-xl bg-charcoal/80 border border-luxury-gold/20 items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-inter font-medium text-pure-white tracking-wide uppercase">Real-time analysis</h3>
                <p className="text-sm font-inter font-light text-text-secondary-dark leading-relaxed">
                  Instant feedback on retention moments
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center space-y-3">
                <div className="inline-flex w-14 h-14 rounded-xl bg-charcoal/80 border border-luxury-gold/20 items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                  </svg>
                </div>
                <h3 className="text-sm font-inter font-medium text-pure-white tracking-wide uppercase">Smart cuts</h3>
                <p className="text-sm font-inter font-light text-text-secondary-dark leading-relaxed">
                  AI identifies optimal edit points
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center space-y-3">
                <div className="inline-flex w-14 h-14 rounded-xl bg-charcoal/80 border border-luxury-gold/20 items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-sm font-inter font-medium text-pure-white tracking-wide uppercase">Export ready</h3>
                <p className="text-sm font-inter font-light text-text-secondary-dark leading-relaxed">
                  Professional output for any platform
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/*
        FOOTER - Minimal, professional
      */}
      <footer className="relative px-6 py-10 border-t border-divider-dark/30">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm font-inter font-light text-text-secondary-dark">
            Rententio &copy; 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
