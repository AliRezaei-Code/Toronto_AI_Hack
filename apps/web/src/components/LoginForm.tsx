"use client";

import { useState } from "react";
import { AuthError } from "firebase/auth";
import { useAuth, getAuthErrorMessage } from "@/src/contexts/AuthContext";

type AuthMode = "signin" | "signup" | "reset";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-gray-400">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {resetSent ? (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded">
              <p className="font-medium">Check your email!</p>
              <p className="mt-1 text-sm">
                We've sent a password reset link to <strong>{email}</strong>.
                Click the link in the email to create a new password.
              </p>
            </div>
            <div className="text-center text-sm text-gray-400">
              <p>Didn't receive the email? Check your spam folder or</p>
              <button
                type="button"
                onClick={onTryAgain}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                try again with a different email
              </button>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
            <div>
              <label htmlFor="reset-email" className="sr-only">
                Email address
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email address"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onBack}
                className="text-blue-400 hover:text-blue-300"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [suggestSignUp, setSuggestSignUp] = useState(false);
  const [suggestSignIn, setSuggestSignIn] = useState(false);

  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();

  const clearMessages = () => {
    setError("");
    setSuggestSignUp(false);
    setSuggestSignIn(false);
    setResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else if (mode === "signup") {
        await signUp(email, password);
      }
    } catch (err) {
      const authError = err as AuthError;
      const message = getAuthErrorMessage(authError);
      setError(message);

      if (
        authError.code === "auth/user-not-found" ||
        authError.code === "auth/invalid-credential"
      ) {
        setSuggestSignUp(true);
      } else if (authError.code === "auth/email-already-in-use") {
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
      setError("Please enter your email address.");
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
    // Keep the email when switching modes
  };

  // Reset Password View
  if (mode === "reset") {
    return (
      <ResetPasswordForm
        email={email}
        error={error}
        loading={loading}
        resetSent={resetSent}
        onEmailChange={setEmail}
        onSubmit={handleResetPassword}
        onBack={() => switchMode("signin")}
        onTryAgain={() => setResetSent(false)}
      />
    );
  }

  // Sign In / Sign Up View
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-white">
            {mode === "signin"
              ? "Sign in to your account"
              : "Create your account"}
          </h2>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded">
            <p>{error}</p>
            {suggestSignUp && (
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="mt-2 text-blue-400 hover:text-blue-300 underline text-sm"
              >
                Create a new account
              </button>
            )}
            {suggestSignIn && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="mt-2 text-blue-400 hover:text-blue-300 underline text-sm"
              >
                Sign in instead
              </button>
            )}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  mode === "signup" ? "Password (min 6 characters)" : "Password"
                }
              />
            </div>
          </div>

          {mode === "signin" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => switchMode("reset")}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
                ? "Sign In"
                : "Sign Up"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="ml-2 text-gray-700 font-medium">
            Continue with Google
          </span>
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
            className="text-blue-400 hover:text-blue-300"
          >
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
