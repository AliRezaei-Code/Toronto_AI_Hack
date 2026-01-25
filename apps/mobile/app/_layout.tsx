/**
 * Root layout for the Expo Router app
 * Sets up providers, fonts, and global configuration
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initApiClient } from '@repo/api-client';
import { useAuthStore } from '@/store/auth';
import '../global.css';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { getToken } = useAuthStore();

  useEffect(() => {
    // Initialize API client with auth
    initApiClient({
      baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
      getToken: () => getToken(),
      onUnauthorized: () => {
        // Handle unauthorized - redirect to login
        useAuthStore.getState().logout();
      },
    });

    // Hide splash screen after setup
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0f172a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#0f172a',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="clip/[id]"
          options={{
            title: 'Clip Preview',
            presentation: 'modal',
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </QueryClientProvider>
  );
}
