/**
 * Profile tab - User profile and settings
 */

import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-dark-900 items-center justify-center p-6">
        <Ionicons name="person-circle" size={80} color="#64748b" />
        <Text className="text-white text-xl font-semibold mt-6">
          Sign in to Continue
        </Text>
        <Text className="text-dark-400 text-center mt-2 mb-6">
          Access your videos and clips
        </Text>
        <Pressable
          onPress={() => router.push('/login')}
          className="bg-primary-600 px-8 py-4 rounded-xl"
        >
          <Text className="text-white font-semibold text-lg">Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-900 p-6">
      {/* Profile header */}
      <View className="items-center py-8">
        <View className="w-24 h-24 bg-primary-600 rounded-full items-center justify-center">
          <Text className="text-white text-4xl font-bold">
            {user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text className="text-white text-xl font-semibold mt-4">
          {user?.displayName ?? 'User'}
        </Text>
        <Text className="text-dark-400">{user?.email}</Text>
      </View>

      {/* Settings */}
      <View className="mt-4">
        <Text className="text-dark-400 text-sm uppercase mb-2">Settings</Text>

        <Pressable className="bg-dark-800 rounded-xl p-4 flex-row items-center mb-3">
          <Ionicons name="notifications" size={24} color="#6366f1" />
          <Text className="text-white flex-1 ml-3">Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </Pressable>

        <Pressable className="bg-dark-800 rounded-xl p-4 flex-row items-center mb-3">
          <Ionicons name="color-palette" size={24} color="#6366f1" />
          <Text className="text-white flex-1 ml-3">Appearance</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </Pressable>

        <Pressable className="bg-dark-800 rounded-xl p-4 flex-row items-center mb-3">
          <Ionicons name="cloud-download" size={24} color="#6366f1" />
          <Text className="text-white flex-1 ml-3">Download Quality</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </Pressable>
      </View>

      {/* Support */}
      <View className="mt-6">
        <Text className="text-dark-400 text-sm uppercase mb-2">Support</Text>

        <Pressable className="bg-dark-800 rounded-xl p-4 flex-row items-center mb-3">
          <Ionicons name="help-circle" size={24} color="#64748b" />
          <Text className="text-white flex-1 ml-3">Help Center</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </Pressable>

        <Pressable className="bg-dark-800 rounded-xl p-4 flex-row items-center mb-3">
          <Ionicons name="document-text" size={24} color="#64748b" />
          <Text className="text-white flex-1 ml-3">Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </Pressable>
      </View>

      {/* Sign out */}
      <Pressable
        onPress={handleLogout}
        className="mt-auto bg-red-900/30 rounded-xl p-4 flex-row items-center justify-center"
      >
        <Ionicons name="log-out" size={24} color="#ef4444" />
        <Text className="text-red-400 font-semibold ml-2">Sign Out</Text>
      </Pressable>
    </View>
  );
}
