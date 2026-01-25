/**
 * Home tab - Dashboard with recent activity and quick actions
 */

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getDirectorJobs, getVideos } from '@repo/api-client';
import { useAuthStore } from '@/store/auth';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Fetch recent data
  const { data: jobsResponse } = useQuery({
    queryKey: ['director-jobs'],
    queryFn: getDirectorJobs,
    enabled: isAuthenticated,
  });

  const { data: videosResponse } = useQuery({
    queryKey: ['videos'],
    queryFn: getVideos,
    enabled: isAuthenticated,
  });

  const recentJobs = jobsResponse?.data?.slice(0, 3) ?? [];
  const videoCount = videosResponse?.data?.length ?? 0;
  const clipCount = recentJobs.reduce((acc, job) => acc + (job.clips?.length ?? 0), 0);

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-dark-900 items-center justify-center p-6">
        <Ionicons name="sparkles" size={64} color="#6366f1" />
        <Text className="text-white text-2xl font-bold mt-6 text-center">
          AI Director
        </Text>
        <Text className="text-dark-400 text-center mt-2 mb-8">
          Transform long-form videos into viral short-form content
        </Text>
        <Pressable
          onPress={() => router.push('/login')}
          className="bg-primary-600 px-8 py-4 rounded-xl"
        >
          <Text className="text-white font-semibold text-lg">Get Started</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-dark-900">
      {/* Header */}
      <View className="px-6 pt-4 pb-6">
        <Text className="text-dark-400 text-sm">Welcome back,</Text>
        <Text className="text-white text-2xl font-bold">
          {user?.displayName ?? 'Creator'}
        </Text>
      </View>

      {/* Stats */}
      <View className="flex-row px-6 gap-4">
        <View className="flex-1 bg-dark-800 rounded-xl p-4">
          <Ionicons name="videocam" size={24} color="#6366f1" />
          <Text className="text-white text-2xl font-bold mt-2">{videoCount}</Text>
          <Text className="text-dark-400 text-sm">Videos</Text>
        </View>
        <View className="flex-1 bg-dark-800 rounded-xl p-4">
          <Ionicons name="cut" size={24} color="#10b981" />
          <Text className="text-white text-2xl font-bold mt-2">{clipCount}</Text>
          <Text className="text-dark-400 text-sm">Clips</Text>
        </View>
        <View className="flex-1 bg-dark-800 rounded-xl p-4">
          <Ionicons name="trending-up" size={24} color="#f59e0b" />
          <Text className="text-white text-2xl font-bold mt-2">
            {recentJobs.filter((j) => j.status === 'completed').length}
          </Text>
          <Text className="text-dark-400 text-sm">Ready</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 mt-8">
        <Text className="text-white text-lg font-semibold mb-4">Quick Actions</Text>
        <View className="flex-row gap-4">
          <Pressable
            onPress={() => router.push('/upload')}
            className="flex-1 bg-primary-600 rounded-xl p-4 items-center"
          >
            <Ionicons name="cloud-upload" size={28} color="#fff" />
            <Text className="text-white font-medium mt-2">Upload Video</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/director')}
            className="flex-1 bg-dark-800 rounded-xl p-4 items-center border border-primary-600"
          >
            <Ionicons name="sparkles" size={28} color="#6366f1" />
            <Text className="text-white font-medium mt-2">AI Director</Text>
          </Pressable>
        </View>
      </View>

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <View className="px-6 mt-8 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-semibold">Recent Jobs</Text>
            <Pressable onPress={() => router.push('/jobs')}>
              <Text className="text-primary-500">See all</Text>
            </Pressable>
          </View>
          {recentJobs.map((job) => (
            <View
              key={job.id}
              className="bg-dark-800 rounded-xl p-4 mb-3"
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-white font-medium">
                  {job.currentStep ?? job.status}
                </Text>
                <View
                  className={`px-2 py-1 rounded ${
                    job.status === 'completed'
                      ? 'bg-green-900'
                      : job.status === 'failed'
                      ? 'bg-red-900'
                      : 'bg-primary-900'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      job.status === 'completed'
                        ? 'text-green-400'
                        : job.status === 'failed'
                        ? 'text-red-400'
                        : 'text-primary-400'
                    }`}
                  >
                    {job.status}
                  </Text>
                </View>
              </View>
              {job.progress > 0 && job.progress < 100 && (
                <View className="mt-3 h-2 bg-dark-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${job.progress}%` }}
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
