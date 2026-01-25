'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * VANTA.JS DOTS BACKGROUND
 *
 * Creates the animated dots effect with luxury gold colors
 * Per user preference - elegant floating dots with no lines
 */
export function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const media = window.matchMedia('(prefers-color-scheme: light)');
    const updateTheme = () => setIsLight(media.matches);

    updateTheme();
    media.addEventListener('change', updateTheme);

    return () => {
      media.removeEventListener('change', updateTheme);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !vantaRef.current) return;

    if (vantaEffect.current) {
      vantaEffect.current.destroy();
      vantaEffect.current = null;
    }

    // Dynamically import Vanta to avoid SSR issues
    const loadVanta = async () => {
      try {
        // Import THREE first
        const THREE = await import('three');
        (window as any).THREE = THREE;

        // Import Vanta DOTS
        const VANTA = await import('vanta/dist/vanta.dots.min');

        if (vantaRef.current) {
          vantaEffect.current = (VANTA as any).default({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: isLight ? 0x8b7028 : 0xd4ae39,        // Dark gold for light mode
            color2: isLight ? 0xb8941e : 0xd29c55,       // Muted gold for light mode
            backgroundColor: isLight ? 0xf8f8f8 : 0x0,   // Soft white vs black
            size: 2.30,
            spacing: 29.00,
            showLines: false
          });
        }
      } catch (error) {
        console.error('Error loading Vanta:', error);
      }
    };

    loadVanta();

    // Cleanup
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, [mounted, isLight]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      ref={vantaRef}
      className="fixed inset-0 z-0"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    />
  );
}
