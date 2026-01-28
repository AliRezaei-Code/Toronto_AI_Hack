"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import BrandedLoginForm from "@/src/components/BrandedLoginForm";
import { LoadingSpinner } from "@/src/components/LoadingSpinner";

// Map redirect paths to user-friendly names
const DESTINATION_NAMES: Record<string, string> = {
  '/ai-director': 'AI Director',
  '/video-editor': 'Video Editor',
  '/video-player': 'Video Player',
  '/': 'home',
};

export default function LoginPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const force = searchParams.get('force') === '1';

  useEffect(() => {
    console.log('[LoginPage] loading:', loading, 'user:', !!user, 'force:', force, 'redirect:', redirect);
    if (!loading && user && !force) {
      // Redirect to intended destination after login
      console.log('[LoginPage] Redirecting to:', redirect);
      router.push(redirect);
    }
  }, [user, loading, router, redirect, force]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user && !force) {
    return null;
  }

  // Get the destination name for context-aware messaging
  const destinationName = DESTINATION_NAMES[redirect] || 'this page';

  return (
    <div className="relative">
      {redirect !== '/' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-charcoal/90 border border-luxury-gold/30 backdrop-blur-xl shadow-xl">
          <p className="font-formula text-sm text-text-secondary-dark text-center">
            Before you can access <span className="text-luxury-gold font-medium">{destinationName}</span>, please sign in or create an account
          </p>
        </div>
      )}
      {user && force ? (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-charcoal/90 border border-luxury-gold/30 backdrop-blur-xl shadow-xl">
          <p className="font-formula text-sm text-text-secondary-dark text-center">
            You are already signed in.{' '}
            <button
              type="button"
              onClick={() => signOut()}
              className="text-luxury-gold font-medium hover:text-pale-gold transition-colors"
            >
              Sign out
            </button>
          </p>
        </div>
      ) : null}
      <BrandedLoginForm />
    </div>
  );
}
