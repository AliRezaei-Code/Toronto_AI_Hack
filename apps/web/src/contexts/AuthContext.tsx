"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  AuthError,
} from "firebase/auth";
import { auth, googleProvider } from "@/src/lib/firebase";

// Map Firebase error codes to user-friendly messages
export function getAuthErrorMessage(error: AuthError): string {
  const code = error.code;

  // Log error code for developers
  console.error("Firebase Auth Error:", code, error.message);

  switch (code) {
    // Sign in errors
    case "auth/user-not-found":
      return "No account found with this email. Would you like to sign up instead?";
    case "auth/wrong-password":
      return "Incorrect password. Please try again or reset your password.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a few minutes before trying again.";

    // Sign up errors
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Please contact support.";

    // OAuth errors
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled. Please try again.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked. Please allow popups for this site.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled. Please try again.";

    // Password reset errors
    case "auth/expired-action-code":
      return "This password reset link has expired. Please request a new one.";
    case "auth/invalid-action-code":
      return "This password reset link is invalid. Please request a new one.";

    // Network errors
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";

    default:
      return "Something went wrong. Please try again.";
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only subscribe to auth changes on client side
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth not initialized");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth not initialized");
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error("Auth not initialized");
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    if (!auth) throw new Error("Auth not initialized");
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error("Auth not initialized");
    await sendPasswordResetEmail(auth, email);
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    return user.getIdToken();
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
