'use client';

import { useState } from 'react';
import { AuthError } from 'firebase/auth';
import { useAuth, getAuthErrorMessage } from '@/src/contexts/AuthContext';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';

// Dynamically import Vanta component with no SSR
const VantaBackground = dynamic(() => import('./VantaBackground').then(mod => mod.VantaBackground), {
  ssr: false,
  loading: () => null
});

type AuthMode = 'signin' | 'signup' | 'reset';

type ResetPasswordFormProps = {
  email: string;
  error: string;
  loading: boolean;
  resetSent: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onTryAgain: () => void;
};

function ResetPasswordForm({
  email,
  error,
  loading,
  resetSent,
  onEmailChange,
  onSubmit,
  onBack,
  onTryAgain,
}: ResetPasswordFormProps) {
  return (
    <div className="max-w-md w-full space-y-6 p-8 rounded-2xl bg-gradient-to-br from-rich-black via-charcoal to-rich-black border border-luxury-gold/20 backdrop-blur-xl shadow-2xl shadow-luxury-gold/10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="font-playfair font-bold text-4xl text-pure-white">
          Reset Password
        </h2>
        <p className="font-inter text-text-secondary-dark">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-xl">
          <p className="font-inter text-sm">{error}</p>
        </div>
      )}

      {/* Success State */}
      {resetSent ? (
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-xl">
            <p className="font-inter font-medium">Check your email!</p>
            <p className="mt-2 font-inter text-sm">
              We&apos;ve sent a password reset link to <strong>{email}</strong>.
              Click the link in the email to create a new password.
            </p>
          </div>

          <div className="text-center font-inter text-sm text-text-secondary-dark space-y-2">
            <p>Didn&apos;t receive the email? Check your spam folder or</p>
            <button
              type="button"
              onClick={onTryAgain}
              className="text-luxury-gold hover:text-muted-gold underline transition-colors"
            >
              try again with a different email
            </button>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full px-10 py-4 bg-luxury-gold hover:bg-muted-gold text-rich-black font-inter font-semibold text-sm tracking-button uppercase rounded-xl transition-all duration-300 shadow-xl shadow-luxury-gold/30 hover:shadow-2xl hover:shadow-luxury-gold/60"
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={onSubmit}>
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="reset-email" className="block font-inter font-medium text-sm text-pure-white">
              Email Address
            </label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full px-4 py-3 bg-charcoal border border-divider-dark rounded-xl text-pure-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all font-inter"
              placeholder="your@email.com"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-10 py-4 bg-luxury-gold hover:bg-muted-gold disabled:bg-luxury-gold/50 disabled:cursor-not-allowed text-rich-black font-inter font-semibold text-sm tracking-button uppercase rounded-xl transition-all duration-300 shadow-xl shadow-luxury-gold/30 hover:shadow-2xl hover:shadow-luxury-gold/60"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          {/* Back Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="font-inter text-sm text-text-secondary-dark hover:text-luxury-gold transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function BrandedLoginForm() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [suggestSignUp, setSuggestSignUp] = useState(false);
  const [suggestSignIn, setSuggestSignIn] = useState(false);

  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();

  const clearMessages = () => {
    setError('');
    setSuggestSignUp(false);
    setSuggestSignIn(false);
    setResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        await signUp(email, password);
      }
    } catch (err) {
      const authError = err as AuthError;
      const message = getAuthErrorMessage(authError);
      setError(message);

      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
        setSuggestSignUp(true);
      } else if (authError.code === 'auth/email-already-in-use') {
        setSuggestSignIn(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const authError = err as AuthError;
      setError(getAuthErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    clearMessages();
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      const authError = err as AuthError;
      setError(getAuthErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    clearMessages();
  };

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

      {/* Header Navigation */}
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
            <span className="text-xl font-playfair font-semibold tracking-tight text-pure-white">
              Rententio
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        {/* Reset Password View */}
        {mode === 'reset' ? (
          <ResetPasswordForm
            email={email}
            error={error}
            loading={loading}
            resetSent={resetSent}
            onEmailChange={setEmail}
            onSubmit={handleResetPassword}
            onBack={() => switchMode('signin')}
            onTryAgain={() => setResetSent(false)}
          />
        ) : (
          /* Sign In / Sign Up View */
          <div className="max-w-md w-full space-y-6 p-8 rounded-2xl bg-gradient-to-br from-rich-black via-charcoal to-rich-black border border-luxury-gold/20 backdrop-blur-xl shadow-2xl shadow-luxury-gold/10">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="font-playfair font-bold text-4xl text-pure-white">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="font-inter text-text-secondary-dark">
                {mode === 'signin' ? 'Sign in to continue' : 'Start editing for retention'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-xl">
                <p className="font-inter text-sm">{error}</p>
                {suggestSignUp && (
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="mt-2 text-luxury-gold hover:text-muted-gold underline text-sm font-inter transition-colors"
                  >
                    Create a new account
                  </button>
                )}
                {suggestSignIn && (
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="mt-2 text-luxury-gold hover:text-muted-gold underline text-sm font-inter transition-colors"
                  >
                    Sign in instead
                  </button>
                )}
              </div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block font-inter font-medium text-sm text-pure-white">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-charcoal border border-divider-dark rounded-xl text-pure-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all font-inter"
                  placeholder="your@email.com"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block font-inter font-medium text-sm text-pure-white">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-charcoal border border-divider-dark rounded-xl text-pure-white placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all font-inter"
                  placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                />
              </div>

              {/* Forgot Password Link */}
              {mode === 'signin' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="font-inter text-sm text-text-secondary-dark hover:text-luxury-gold transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-10 py-4 bg-luxury-gold hover:bg-muted-gold disabled:bg-luxury-gold/50 disabled:cursor-not-allowed text-rich-black font-inter font-semibold text-sm tracking-button uppercase rounded-xl transition-all duration-300 shadow-xl shadow-luxury-gold/30 hover:shadow-2xl hover:shadow-luxury-gold/60 hover:scale-[1.02]"
              >
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-divider-dark"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-charcoal font-inter text-text-secondary-dark">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-pure-white hover:bg-soft-white disabled:bg-pure-white/50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-rich-black font-inter font-medium">
                Continue with Google
              </span>
            </button>

            {/* Mode Switch */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="font-inter text-sm text-text-secondary-dark hover:text-luxury-gold transition-colors"
              >
                {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
