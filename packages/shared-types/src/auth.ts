/**
 * Authentication and user types
 */

/** User information */
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt?: string;
}

/** Authentication state */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string;
}

/** Login credentials */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Registration data */
export interface RegisterData extends LoginCredentials {
  displayName?: string;
}

/** Auth tokens */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}
