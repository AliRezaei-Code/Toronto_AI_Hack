'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/src/components/ThemeToggle';

export function BrandedHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="relative z-50 px-6 py-4 border-b border-divider-dark/50 backdrop-blur-sm bg-rich-black/80">
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
              priority
            />
          </div>
          <span className="text-xl font-playfair font-semibold tracking-tight text-pure-white">
            Rententio
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href="/ai-director"
                className="text-sm font-formula font-medium tracking-wide text-text-secondary-dark hover:text-luxury-gold transition-colors"
              >
                AI Director
              </Link>
              <Link
                href="/video-editor"
                className="text-sm font-formula font-medium tracking-wide text-text-secondary-dark hover:text-luxury-gold transition-colors"
              >
                Editor
              </Link>
              <Link
                href="/video-player"
                className="text-sm font-formula font-medium tracking-wide text-text-secondary-dark hover:text-luxury-gold transition-colors"
              >
                Player
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-formula font-medium tracking-wide text-text-secondary-dark hover:text-luxury-gold transition-colors"
              >
                Sign out
              </button>
            </>
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
  );
}
