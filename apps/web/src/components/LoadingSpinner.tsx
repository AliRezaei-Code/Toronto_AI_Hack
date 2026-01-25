'use client';

import dynamic from 'next/dynamic';

// Dynamically import Vanta component with no SSR
const VantaBackground = dynamic(() => import('./VantaBackground').then(mod => mod.VantaBackground), {
  ssr: false,
  loading: () => null
});

/**
 * RENTENTIO LOADING SPINNER
 *
 * Branded loading state with:
 * - Vanta.js animated background
 * - Luxury gold spinning ring
 * - Playfair italic loading text
 *
 * Per Style Guide: Full-page loading pattern
 */
export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-rich-black text-pure-white relative overflow-hidden">
      {/* Vanta.js animated background */}
      <VantaBackground />

      {/* Static dotted grid */}
      <div
        className="fixed inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgb(var(--color-grid-dot) / 0.15) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* Centered loading content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-6">
          {/* Spinner */}
          <div className="relative w-20 h-20 mx-auto">
            {/* Base ring */}
            <div className="absolute inset-0 rounded-full border-4 border-divider-dark"></div>
            {/* Spinning gold ring */}
            <div className="absolute inset-0 rounded-full border-4 border-luxury-gold border-t-transparent animate-spin"></div>
            {/* Inner glow */}
            <div className="absolute inset-0 rounded-full bg-luxury-gold/10 blur-xl"></div>
          </div>

          {/* Loading text */}
          <p className="font-playfair italic text-2xl text-text-secondary-dark animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
