/**
 * Clip preview modal - View and download viral clips
 */

import { View, Text, Pressable, Alert, Share, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import {
  getViralClip,
  renderViralClip,
  getRenderedClipUrl,
  getApiConfig,
} from '@repo/api-client';

export default function ClipPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { baseUrl } = getApiConfig();

  // Fetch clip details
  const { data: clipResponse, isLoading, refetch } = useQuery({
    queryKey: ['clip', id],
    queryFn: () => getViralClip(id),
    enabled: !!id,
  });

  const clip = clipResponse?.data;

  // Render mutation
  const renderMutation = useMutation({
    mutationFn: () => renderViralClip(id),
    onSuccess: () => {
      Alert.alert('Rendering Started', 'You will be notified when the clip is ready');
      refetch();
    },
    onError: (error) => {
      Alert.alert('Render Failed', error.message);
    },
  });

  // Download handler
  const handleDownload = async () => {
    if (!clip?.renderedUrl) return;

    try {
      const downloadUrl = `${baseUrl}${getRenderedClipUrl(id)}`;
      const filename = `clip-${id}.mp4`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri);
      Alert.alert('Downloaded', `Saved to ${uri}`);
    } catch (error) {
      Alert.alert('Download Failed', 'Could not download the clip');
    }
  };

  // Share handler
  const handleShare = async () => {
    if (!clip) return;

    try {
      await Share.share({
        title: clip.title,
        message: `Check out this clip: ${clip.title}\n${clip.hook}`,
        url: clip.renderedUrl,
      });
    } catch (error) {
      // User cancelled
    }
  };

  if (isLoading || !clip) {
    return (
      <View className="flex-1 bg-dark-900 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const duration = Math.round(clip.duration);
  const videoUrl = clip.renderedUrl ? `${baseUrl}${getRenderedClipUrl(id)}` : null;

  return (
    <View className="flex-1 bg-dark-900">
      {/* Video player */}
      <View className="w-full aspect-[9/16] bg-black">
        {videoUrl ? (
          <Video
            source={{ uri: videoUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            style={{ flex: 1 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="play-circle" size={64} color="#64748b" />
            <Text className="text-dark-400 mt-4">
              {clip.status === 'rendering' ? 'Rendering...' : 'Not yet rendered'}
            </Text>
          </View>
        )}
      </View>

      {/* Clip info */}
      <View className="flex-1 p-6">
        <View className="flex-row items-center gap-3">
          <View className="bg-primary-600 px-2 py-1 rounded flex-row items-center">
            <Ionicons name="trending-up" size={14} color="#fff" />
            <Text className="text-white text-sm font-semibold ml-1">
              {clip.viralScore}%
            </Text>
          </View>
          <Text className="text-dark-400">{duration}s</Text>
          <View
            className={`px-2 py-1 rounded ${
              clip.status === 'completed' ? 'bg-green-900' : 'bg-yellow-900'
            }`}
          >
            <Text
              className={`text-xs ${
                clip.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              {clip.status}
            </Text>
          </View>
        </View>

        <Text className="text-white text-xl font-bold mt-4">{clip.title}</Text>
        <Text className="text-dark-400 mt-2">{clip.hook}</Text>

        {clip.reason && (
          <View className="mt-4 bg-dark-800 rounded-xl p-4">
            <Text className="text-dark-400 text-sm">Why it's viral:</Text>
            <Text className="text-white mt-1">{clip.reason}</Text>
          </View>
        )}

        {/* Tags */}
        {clip.tags && clip.tags.length > 0 && (
          <View className="flex-row flex-wrap mt-4 gap-2">
            {clip.tags.map((tag, index) => (
              <View key={index} className="bg-dark-800 px-3 py-1 rounded-full">
                <Text className="text-dark-300 text-sm">#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="p-6 flex-row gap-4">
        {clip.status === 'completed' && clip.renderedUrl ? (
          <>
            <Pressable
              onPress={handleDownload}
              className="flex-1 bg-primary-600 rounded-xl p-4 flex-row items-center justify-center"
            >
              <Ionicons name="download" size={24} color="#fff" />
              <Text className="text-white font-semibold ml-2">Download</Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="bg-dark-800 rounded-xl p-4"
            >
              <Ionicons name="share" size={24} color="#6366f1" />
            </Pressable>
          </>
        ) : clip.status === 'rendering' ? (
          <View className="flex-1 bg-dark-700 rounded-xl p-4 flex-row items-center justify-center">
            <ActivityIndicator color="#6366f1" />
            <Text className="text-dark-400 font-semibold ml-2">Rendering...</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => renderMutation.mutate()}
            disabled={renderMutation.isPending}
            className="flex-1 bg-primary-600 rounded-xl p-4 flex-row items-center justify-center"
          >
            {renderMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="videocam" size={24} color="#fff" />
                <Text className="text-white font-semibold ml-2">Render Clip</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
