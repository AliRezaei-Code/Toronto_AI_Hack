/**
 * Login screen - Firebase authentication
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, isLoading } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      if (isSignUp) {
        await register({ email, password, displayName: displayName || undefined });
      } else {
        await login({ email, password });
      }
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Authentication Failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-dark-900"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo */}
        <View className="items-center mb-12">
          <Ionicons name="sparkles" size={64} color="#6366f1" />
          <Text className="text-white text-3xl font-bold mt-4">AI Director</Text>
          <Text className="text-dark-400 mt-2">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          {isSignUp && (
            <View>
              <Text className="text-dark-400 text-sm mb-2">Display Name</Text>
              <View className="bg-dark-800 rounded-xl flex-row items-center px-4">
                <Ionicons name="person-outline" size={20} color="#64748b" />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor="#64748b"
                  className="flex-1 text-white py-4 ml-3"
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View>
            <Text className="text-dark-400 text-sm mb-2">Email</Text>
            <View className="bg-dark-800 rounded-xl flex-row items-center px-4">
              <Ionicons name="mail-outline" size={20} color="#64748b" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#64748b"
                className="flex-1 text-white py-4 ml-3"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          <View>
            <Text className="text-dark-400 text-sm mb-2">Password</Text>
            <View className="bg-dark-800 rounded-xl flex-row items-center px-4">
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#64748b"
                className="flex-1 text-white py-4 ml-3"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Submit button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isLoading}
          className={`mt-8 rounded-xl p-4 items-center ${
            isLoading ? 'bg-dark-700' : 'bg-primary-600'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-lg">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
          )}
        </Pressable>

        {/* Toggle sign up/in */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-dark-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <Pressable onPress={() => setIsSignUp(!isSignUp)}>
            <Text className="text-primary-500 ml-1 font-medium">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
