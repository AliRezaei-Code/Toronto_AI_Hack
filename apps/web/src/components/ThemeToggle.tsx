'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'rententio-theme';

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'light') {
    root.classList.add('theme-light');
  } else {
    root.classList.remove('theme-light');
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') {
      console.log('[ThemeToggle] Loaded stored mode:', stored);
      setMode(stored);
      applyTheme(stored);
      return;
    }

    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const initialMode: ThemeMode = prefersLight ? 'light' : 'dark';
    console.log('[ThemeToggle] No stored mode. Prefers light:', prefersLight, '->', initialMode);
    setMode(initialMode);
    applyTheme(initialMode);
  }, []);

  const toggle = () => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    console.log('[ThemeToggle] Toggling mode:', mode, '->', next);
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    console.log('[ThemeToggle] Applied theme. html.classList:', document.documentElement.className);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-xs font-formula font-medium tracking-[0.2em] uppercase text-text-secondary-dark hover:text-luxury-gold transition-colors"
      aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
    >
      {mode === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
