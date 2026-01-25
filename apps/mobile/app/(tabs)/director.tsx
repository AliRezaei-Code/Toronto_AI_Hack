/**
 * Director tab - AI Director dashboard with viral clips
 */

import { View, Text, FlatList, Pressable, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getDirectorJobs, getClipThumbnailUrl } from '@repo/api-client';
import type { ViralClip } from '@repo/shared-types';

function ClipCard({ clip }: { clip: ViralClip }) {
  const router = useRouter();
  const duration = Math.round(clip.duration);
  const thumbnailUrl = getClipThumbnailUrl(clip.id);

  return (
    <Pressable
      onPress={() => router.push(`/clip/${clip.id}`)}
      className="bg-dark-800 rounded-xl overflow-hidden mb-4 mx-6"
    >
      {/* Thumbnail */}
      <View className="relative">
        <View className="w-full h-48 bg-dark-700 items-center justify-center">
          {clip.thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="play-circle" size={48} color="#64748b" />
          )}
        </View>

        {/* Duration badge */}
        <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded">
          <Text className="text-white text-xs">{duration}s</Text>
        </View>

        {/* Viral score badge */}
        <View className="absolute top-2 right-2 bg-primary-600 px-2 py-1 rounded flex-row items-center">
          <Ionicons name="trending-up" size={12} color="#fff" />
          <Text className="text-white text-xs font-semibold ml-1">
            {clip.viralScore}%
          </Text>
        </View>

        {/* Status badge */}
        {clip.status === 'completed' && (
          <View className="absolute top-2 left-2 bg-green-600 px-2 py-1 rounded">
            <Text className="text-white text-xs">Ready</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-4">
        <Text className="text-white font-semibold text-lg" numberOfLines={2}>
          {clip.title}
        </Text>
        <Text className="text-dark-400 text-sm mt-1" numberOfLines={1}>
          {clip.hook}
        </Text>

        {/* Tags */}
        {clip.tags && clip.tags.length > 0 && (
          <View className="flex-row flex-wrap mt-3 gap-2">
            {clip.tags.slice(0, 3).map((tag, index) => (
              <View key={index} className="bg-dark-700 px-2 py-1 rounded">
                <Text className="text-dark-300 text-xs">#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function DirectorScreen() {
  const router = useRouter();

  const { data: jobsResponse, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['director-jobs'],
    queryFn: getDirectorJobs,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Flatten all clips from all jobs
  const allClips: ViralClip[] = [];
  const jobs = jobsResponse?.data ?? [];
  
  for (const job of jobs) {
    if (job.clips) {
      allClips.push(...job.clips);
    }
  }

  // Sort by viral score
  allClips.sort((a, b) => b.viralScore - a.viralScore);

  const processingJobs = jobs.filter((j) => 
    !['completed', 'failed'].includes(j.status)
  );

  return (
    <View className="flex-1 bg-dark-900">
      <FlatList
        data={allClips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ClipCard clip={item} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6366f1"
          />
        }
        ListHeaderComponent={
          processingJobs.length > 0 ? (
            <View className="mx-6 mb-4 bg-primary-900/50 rounded-xl p-4 border border-primary-700">
              <View className="flex-row items-center">
                <Ionicons name="sync" size={20} color="#6366f1" />
                <Text className="text-white font-medium ml-2">
                  {processingJobs.length} job{processingJobs.length > 1 ? 's' : ''} processing
                </Text>
              </View>
              {processingJobs[0] && (
                <View className="mt-2">
                  <Text className="text-dark-400 text-sm">
                    {processingJobs[0].currentStep ?? processingJobs[0].status}
                  </Text>
                  <View className="mt-2 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${processingJobs[0].progress}%` }}
                    />
                  </View>
                </View>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-6">
            {isLoading ? (
              <>
                <Ionicons name="sparkles" size={48} color="#6366f1" />
                <Text className="text-dark-400 mt-4">Loading clips...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={64} color="#64748b" />
                <Text className="text-white text-lg font-semibold mt-4">
                  No Viral Clips Yet
                </Text>
                <Text className="text-dark-400 text-center mt-2 mb-6">
                  Upload a video and let AI find the best moments
                </Text>
                <Pressable
                  onPress={() => router.push('/upload')}
                  className="bg-primary-600 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">Upload Video</Text>
                </Pressable>
              </>
            )}
          </View>
        }
      />
    </View>
  );
}
