/**
 * Session Provider
 *
 * React context provider for session state management.
 * Wraps the Zustand store and handles hydration.
 *
 * @module SessionProvider
 */

"use client";

import { useSessionStore } from "@/lib/stores/session-store";
import { useEffect, useState, type ReactNode } from "react";

// ============================================================================
// Session Context (for non-hook access patterns)
// ============================================================================

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * Session Provider Component
 *
 * Wraps children with session state and handles hydration.
 * The Zustand store handles persistence automatically via middleware.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration to prevent SSR/client mismatch
  useEffect(() => {
    // Mark as hydrated once client-side
    setIsHydrated(true);
  }, []);

  // Note: We use Zustand directly, so no additional context needed
  // This component mainly handles hydration awareness

  if (!isHydrated) {
    // During SSR or before hydration, render children normally
    // The store will hydrate on client-side automatically
    return <>{children}</>;
  }

  return <>{children}</>;
}

// ============================================================================
// Re-export hooks for convenience
// ============================================================================

export {
    useAnalysisState, useSessionStore, useTimelineState, useUIState, useVideoState
} from "@/lib/stores/session-store";

export type {
    AppStage,
    NavigationTab, SessionActions, SessionState, SessionStore
} from "@/lib/stores/session-store";

// ============================================================================
// Hydration Hook
// ============================================================================

/**
 * Hook to check if session store is hydrated
 * Useful for avoiding hydration mismatches
 */
export function useSessionHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check if store has finished rehydrating
    const unsubFinishHydration = useSessionStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // If already hydrated
    if (useSessionStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return isHydrated;
}

/**
 * Hook to get session state only after hydration
 * Returns null during SSR/hydration
 */
export function useHydratedSession() {
  const isHydrated = useSessionHydration();
  const store = useSessionStore();

  if (!isHydrated) {
    return null;
  }

  return store;
}

export default SessionProvider;
