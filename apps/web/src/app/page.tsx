'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Play, Edit3, Film, Sparkles } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/src/components/ThemeToggle';

// Dynamically import Vanta component with no SSR
const VantaBackground = dynamic(() => import('../components/VantaBackground').then(mod => mod.VantaBackground), {
  ssr: false,
  loading: () => null
});

/**
 * RENTENTIO LANDING PAGE - CREATOR-FOCUSED
 *
 * Combines:
 * - Rententio branded design (Black, White & Gold)
 * - Creator-friendly messaging
 * - Visual editor mockup
 * - Production features with clear value props
 *
 * Typography: Playfair Display (headlines) + Inter (body)
 * Brand: Black (#0A0A0A), White (#FFFFFF), Gold (#D4AF37)
 */

export default function HomePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  return (
    <div className="min-h-screen bg-rich-black text-pure-white relative overflow-hidden">
      {/* VANTA.JS DOTS BACKGROUND */}
      <VantaBackground />

      {/* DOTTED GRID BACKGROUND */}
      <div
        className="fixed inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgb(var(--color-grid-dot) / 0.15) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* SUBTLE VIGNETTE */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 10, 0.4) 100%)',
        }}
        aria-hidden="true"
      />

      {/* TOP NAVIGATION */}
      <header className="relative z-50 px-6 py-4 border-b border-divider-dark/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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

          <nav className="flex items-center gap-8">
            <ThemeToggle />
            {user ? (
              <button
                onClick={handleSignOut}
                className="text-sm font-formula font-medium tracking-wide text-text-secondary-dark hover:text-luxury-gold transition-colors"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm font-formula font-medium tracking-wide text-text-secondary-dark hover:text-luxury-gold transition-colors"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="relative">
        {/* HERO SECTION */}
        <section className="relative px-6 py-12 md:py-16">
          <div
            className="absolute inset-0 -z-10 overflow-hidden"
            aria-hidden="true"
          >
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-luxury-gold/3 rounded-full blur-[140px]" />
          </div>

          <div className="max-w-5xl mx-auto text-center">
            {/* BADGE */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-charcoal/80 border border-luxury-gold/20 backdrop-blur-md shadow-lg shadow-luxury-gold/10">
                <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-pulse" />
                <span className="text-sm font-formula font-light text-pale-gold tracking-wide italic">
                  AI-powered retention editing
                </span>
              </div>
            </div>

            {/* HEADLINE */}
            <h1 className="mb-6 font-playfair font-bold tracking-tight leading-tight">
              <span className="block text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-pure-white mb-2">
                Edit for attention
              </span>
              <span className="block text-5xl md:text-6xl lg:text-7xl xl:text-8xl italic bg-gradient-to-r from-luxury-gold via-pale-gold to-luxury-gold bg-clip-text text-transparent">
                and retention.
              </span>
            </h1>

            {/* SUBTEXT */}
            <p className="text-xl md:text-2xl font-playfair italic text-text-secondary-dark max-w-3xl mx-auto mb-8 leading-relaxed tracking-wide">
              Rententio analyzes your footage and edits for maximum viewer retention.
            </p>

            {/* TWO-BUTTON CENTERED LAYOUT */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/login"
                className="group w-full sm:w-auto px-10 py-4 bg-luxury-gold hover:bg-muted-gold text-rich-black font-formula font-semibold text-sm tracking-button uppercase rounded-xl transition-all duration-300 shadow-xl shadow-luxury-gold/30 hover:shadow-2xl hover:shadow-luxury-gold/60 hover:scale-[1.03] relative overflow-hidden"
              >
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

              <Link
                href="#demo"
                className="group w-full sm:w-auto px-10 py-4 bg-transparent hover:bg-luxury-gold/10 text-luxury-gold border-2 border-luxury-gold/40 hover:border-luxury-gold font-formula font-semibold text-sm tracking-button uppercase rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-luxury-gold/20"
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

            {/* EDITOR MOCKUP - Professional workspace preview */}
            <div className="relative max-w-7xl mx-auto">
              {/* Enhanced gold glow behind mockup */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-luxury-gold/25 via-luxury-gold/10 to-transparent blur-[100px] -z-10 scale-110 animate-pulse"
                style={{ animationDuration: '4s' }}
                aria-hidden="true"
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-luxury-gold/5 rounded-full blur-[120px] -z-10"
                aria-hidden="true"
              />

              {/* Product interface mockup */}
              <div className="relative rounded-2xl border border-luxury-gold/30 bg-gradient-to-br from-rich-black/95 via-charcoal/95 to-rich-black/95 backdrop-blur-xl shadow-2xl shadow-luxury-gold/20 overflow-hidden ring-1 ring-luxury-gold/10">
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/10 via-transparent to-luxury-gold/5 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-luxury-gold/5 pointer-events-none" />

                {/* Browser chrome */}
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
                    <span className="text-xs font-formula text-text-secondary-dark tracking-wide">
                      Rententio Editor
                    </span>
                  </div>
                </div>

                {/* Editor interface demo */}
                <div className="relative p-8">
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-charcoal via-rich-black to-charcoal border border-divider-dark/30 overflow-hidden relative group">
                    {/* Hero demo video */}
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      src="/Retentio-hero-video.mov"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                    />
                    {/* Animated grid in background */}
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

                  </div>

                  {/* Stats bar - editor metrics */}
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="text-center p-5 rounded-xl bg-charcoal/60 border border-divider-dark/30 backdrop-blur-sm">
                      <div className="text-4xl font-playfair font-bold text-pure-white mb-1">27</div>
                      <div className="text-xs font-formula font-light text-text-secondary-dark uppercase tracking-button">Cuts Made</div>
                    </div>
                    <div className="text-center p-5 rounded-xl bg-charcoal/60 border border-divider-dark/30 backdrop-blur-sm">
                      <div className="text-4xl font-playfair font-bold text-pure-white mb-1">1.5 hrs</div>
                      <div className="text-xs font-formula font-light text-text-secondary-dark uppercase tracking-button">Time Saved</div>
                    </div>
                    <div className="text-center p-5 rounded-xl bg-charcoal/60 border border-divider-dark/30 backdrop-blur-sm">
                      <div className="text-4xl font-playfair font-bold text-luxury-gold mb-1">+54%</div>
                      <div className="text-xs font-formula font-light text-text-secondary-dark uppercase tracking-button">Retention</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TOOLS SECTION - Creator-Focused Features */}
        <section className="relative px-6 py-16 border-t border-divider-dark/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-playfair font-bold text-pure-white mb-4">
                Everything You Need
              </h2>
              <p className="text-lg font-formula text-text-secondary-dark max-w-2xl mx-auto">
                From AI-powered editing to professional playback
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* AI Director */}
              <Link
                href="/login?redirect=/ai-director"
                className="group p-8 rounded-2xl bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 backdrop-blur-sm hover:border-luxury-gold/40 transition-all duration-300 hover:shadow-xl hover:shadow-luxury-gold/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center group-hover:bg-luxury-gold/20 transition-colors">
                    <Sparkles className="text-luxury-gold" size={24} />
                  </div>
                  <h3 className="text-xl font-playfair font-semibold text-pure-white">AI Director</h3>
                </div>
                <p className="text-sm font-formula text-text-secondary-dark mb-6 leading-relaxed">
                  Turn long videos into viral shorts. AI finds the best moments and crops them perfectly for social media.
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-formula font-medium text-luxury-gold group-hover:text-pale-gold transition-colors group-hover:gap-3 duration-300">
                  Start creating
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>

              {/* Video Editor */}
              <Link
                href="/login?redirect=/video-editor"
                className="group p-8 rounded-2xl bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 backdrop-blur-sm hover:border-luxury-gold/40 transition-all duration-300 hover:shadow-xl hover:shadow-luxury-gold/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center group-hover:bg-luxury-gold/20 transition-colors">
                    <Edit3 className="text-luxury-gold" size={24} />
                  </div>
                  <h3 className="text-xl font-playfair font-semibold text-pure-white">Video Editor</h3>
                </div>
                <p className="text-sm font-formula text-text-secondary-dark mb-6 leading-relaxed">
                  Professional editing made simple. Add animations, text, and effects to make your videos stand out.
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-formula font-medium text-luxury-gold group-hover:text-pale-gold transition-colors group-hover:gap-3 duration-300">
                  Open editor
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>

              {/* Video Player */}
              <Link
                href="/login?redirect=/video-player"
                className="group p-8 rounded-2xl bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 backdrop-blur-sm hover:border-luxury-gold/40 transition-all duration-300 hover:shadow-xl hover:shadow-luxury-gold/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center group-hover:bg-luxury-gold/20 transition-colors">
                    <Play className="text-luxury-gold" size={24} />
                  </div>
                  <h3 className="text-xl font-playfair font-semibold text-pure-white">Video Player</h3>
                </div>
                <p className="text-sm font-formula text-text-secondary-dark mb-6 leading-relaxed">
                  Preview your videos instantly. Works with all formats and looks great on any device.
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-formula font-medium text-luxury-gold group-hover:text-pale-gold transition-colors group-hover:gap-3 duration-300">
                  Watch videos
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>

              {/* Developer Tools */}
              <div className="group p-8 rounded-2xl bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center">
                    <Film className="text-luxury-gold" size={24} />
                  </div>
                  <h3 className="text-xl font-playfair font-semibold text-pure-white">Developer API</h3>
                </div>
                <p className="text-sm font-formula text-text-secondary-dark mb-6 leading-relaxed">
                  Build your own tools with our video rendering API. Perfect for automation and custom workflows.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-luxury-gold/10 border border-luxury-gold/20">
                  <code className="text-xs font-mono text-luxury-gold">/api/render</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION - What Makes It Special */}
        <section className="relative px-6 py-16 border-t border-divider-dark/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-playfair font-bold text-pure-white mb-4">
                Built for Creators
              </h2>
              <p className="text-lg font-formula text-text-secondary-dark max-w-2xl mx-auto">
                All the features you need, without the complexity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Creative Features */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-charcoal/40 via-rich-black/40 to-charcoal/40 border border-luxury-gold/10 backdrop-blur-sm">
                <h3 className="text-2xl font-playfair font-semibold text-pure-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  Creative Power
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-text-secondary-dark font-formula">
                    <div className="w-2 h-2 rounded-full bg-luxury-gold" />
                    Eye-catching animations that grab attention
                  </li>
                  <li className="flex items-center gap-3 text-text-secondary-dark font-formula">
                    <div className="w-2 h-2 rounded-full bg-luxury-gold" />
                    Custom backgrounds and gradients
                  </li>
                  <li className="flex items-center gap-3 text-text-secondary-dark font-formula">
                    <div className="w-2 h-2 rounded-full bg-luxury-gold" />
                    Smooth text effects and transitions
                  </li>
                  <li className="flex items-center gap-3 text-text-secondary-dark font-formula">
                    <div className="w-2 h-2 rounded-full bg-luxury-gold" />
                    Audio waveforms and visualizations
                  </li>
                </ul>
              </div>

              {/* Technical Excellence */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-charcoal/40 via-rich-black/40 to-charcoal/40 border border-luxury-gold/10 backdrop-blur-sm">
                <h3 className="text-2xl font-playfair font-semibold text-pure-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  Hassle-Free Tech
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-text-secondary-dark font-formula">
                    <div className="w-2 h-2 rounded-full bg-luxury-gold" />
                    Fast cloud rendering - no downloads needed
                  </li>
                  <li className="flex items-center gap-3 text-text-secondary-dark font-formula">
                    <div className="w-2 h-2 rounded-full bg-luxury-gold" />
                    Export to any format for any platform
                  </li>
                  <li className="flex items-center gap-3 text-text-secondary-dark font-formula">
                    <div className="w-2 h-2 rounded-full bg-luxury-gold" />
                    Developer-friendly API for automation
                  </li>
                  <li className="flex items-center gap-3 text-text-secondary-dark font-formula">
                    <div className="w-2 h-2 rounded-full bg-luxury-gold" />
                    See changes instantly as you edit
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative px-6 py-16 border-t border-divider-dark/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 items-start">
            {/* Logo block */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/Retentio-logo.png"
                  alt="Rententio"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-playfair font-semibold text-pure-white">
                Rententio
              </span>
            </div>

            {/* Column 1 */}
            <div className="space-y-3">
              <div className="text-xs font-formula font-medium tracking-[0.2em] uppercase text-text-secondary-dark">
                Product
              </div>
              <div className="flex flex-col gap-2 text-sm font-formula text-text-secondary-dark">
                <Link href="/" className="hover:text-luxury-gold transition-colors">Home</Link>
                <Link href="/ai-director" className="hover:text-luxury-gold transition-colors">AI Director</Link>
                <Link href="/video-editor" className="hover:text-luxury-gold transition-colors">Editor</Link>
                <Link href="/video-player" className="hover:text-luxury-gold transition-colors">Player</Link>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-3">
              <div className="text-xs font-formula font-medium tracking-[0.2em] uppercase text-text-secondary-dark">
                Legal
              </div>
              <div className="flex flex-col gap-2 text-sm font-formula text-text-secondary-dark">
                <a href="#" className="hover:text-luxury-gold transition-colors">Terms</a>
                <a href="#" className="hover:text-luxury-gold transition-colors">Privacy</a>
              </div>
            </div>
          </div>

          {/* Large wordmark backdrop */}
          <div className="mt-14 border-t border-divider-dark/30 pt-10 relative overflow-hidden">
            <div className="text-[20vw] leading-none font-playfair font-bold text-pure-white/12 select-none">
              Rententio
            </div>
            <div className="absolute bottom-6 left-0 text-xs font-formula text-text-secondary-dark">
              © 2026 Rententio. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
