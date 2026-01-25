/**
 * Authentication store using Zustand
 * Manages user state and auth tokens
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User, AuthState, LoginCredentials, RegisterData } from '@repo/shared-types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  getToken: () => Promise<string | null>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: undefined,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: undefined });

    try {
      // TODO: Replace with actual Firebase auth
      // This is a placeholder for the hackathon demo
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        displayName: credentials.email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      const mockToken = `mock_token_${Date.now()}`;

      // Store credentials securely
      await SecureStore.setItemAsync(TOKEN_KEY, mockToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(mockUser));

      set({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: undefined });

    try {
      // TODO: Replace with actual Firebase auth
      const mockUser: User = {
        id: '1',
        email: data.email,
        displayName: data.displayName ?? data.email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      const mockToken = `mock_token_${Date.now()}`;

      await SecureStore.setItemAsync(TOKEN_KEY, mockToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(mockUser));

      set({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      });
      throw error;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);

    set({
      user: null,
      isAuthenticated: false,
      error: undefined,
    });
  },

  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });

    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
