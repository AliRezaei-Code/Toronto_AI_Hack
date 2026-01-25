/**
 * Jobs tab - List of all processing jobs
 */

import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getJobs } from '@repo/api-client';
import type { Job, JobStatus } from '@repo/shared-types';

const statusConfig: Record<JobStatus, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  queued: { color: 'text-yellow-400', bg: 'bg-yellow-900', icon: 'time' },
  processing: { color: 'text-primary-400', bg: 'bg-primary-900', icon: 'sync' },
  completed: { color: 'text-green-400', bg: 'bg-green-900', icon: 'checkmark-circle' },
  failed: { color: 'text-red-400', bg: 'bg-red-900', icon: 'alert-circle' },
  cancelled: { color: 'text-dark-400', bg: 'bg-dark-700', icon: 'close-circle' },
};

function JobCard({ job }: { job: Job }) {
  const router = useRouter();
  const config = statusConfig[job.status];
  const createdAt = new Date(job.createdAt);

  return (
    <Pressable
      onPress={() => {
        if (job.type === 'director' && job.status === 'completed') {
          router.push('/director');
        }
      }}
      className="bg-dark-800 rounded-xl p-4 mb-3 mx-6"
    >
      <View className="flex-row items-center">
        <View className={`w-10 h-10 rounded-full items-center justify-center ${config.bg}`}>
          <Ionicons name={config.icon} size={20} color="#fff" />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-white font-medium capitalize">{job.type}</Text>
          <Text className="text-dark-400 text-sm">
            {createdAt.toLocaleDateString()} at {createdAt.toLocaleTimeString()}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded ${config.bg}`}>
          <Text className={`text-xs ${config.color}`}>{job.status}</Text>
        </View>
      </View>

      {/* Progress bar for processing jobs */}
      {job.status === 'processing' && job.progress > 0 && (
        <View className="mt-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-dark-400 text-xs">Processing...</Text>
            <Text className="text-primary-400 text-xs">{job.progress}%</Text>
          </View>
          <View className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${job.progress}%` }}
            />
          </View>
        </View>
      )}

      {/* Error message for failed jobs */}
      {job.status === 'failed' && job.error && (
        <Text className="text-red-400 text-sm mt-2" numberOfLines={2}>
          {job.error}
        </Text>
      )}
    </Pressable>
  );
}

export default function JobsScreen() {
  const { data: response, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs({ sortBy: 'createdAt', sortOrder: 'desc' }),
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const jobs = response?.data?.items ?? [];

  return (
    <View className="flex-1 bg-dark-900">
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-6">
            {isLoading ? (
              <>
                <Ionicons name="hourglass" size={48} color="#64748b" />
                <Text className="text-dark-400 mt-4">Loading jobs...</Text>
              </>
            ) : (
              <>
                <Ionicons name="list" size={48} color="#64748b" />
                <Text className="text-white text-lg font-semibold mt-4">
                  No Jobs Yet
                </Text>
                <Text className="text-dark-400 text-center mt-2">
                  Upload a video to start processing
                </Text>
              </>
            )}
          </View>
        }
      />
    </View>
  );
}
