/**
 * Upload tab - Video upload with progress tracking
 */

import { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { uploadVideo, startDirectorAnalysis } from '@repo/api-client';
import type { UploadProgress } from '@repo/shared-types';

export default function UploadScreen() {
  const router = useRouter();
  const [selectedVideo, setSelectedVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (asset: ImagePicker.ImagePickerAsset) => {
      // Create a blob from the file URI
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      return uploadVideo(blob, {
        title: asset.fileName ?? 'Untitled Video',
        onProgress: setUploadProgress,
      });
    },
    onSuccess: async (result) => {
      if (result.success && result.data) {
        Alert.alert(
          'Upload Complete',
          'Would you like to start AI Director analysis?',
          [
            { text: 'Later', style: 'cancel', onPress: () => router.push('/jobs') },
            {
              text: 'Start Analysis',
              onPress: async () => {
                await startDirectorAnalysis(result.data!.id);
                router.push('/director');
              },
            },
          ]
        );
        setSelectedVideo(null);
        setUploadProgress(null);
      } else {
        Alert.alert('Upload Failed', result.error?.message ?? 'Unknown error');
      }
    },
    onError: (error) => {
      Alert.alert('Upload Failed', error.message);
    },
  });

  const pickVideo = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    // Pick video
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedVideo(result.assets[0]);
    }
  };

  const recordVideo = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera');
      return;
    }

    // Record video
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 300, // 5 minutes max
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedVideo(result.assets[0]);
    }
  };

  const handleUpload = () => {
    if (selectedVideo) {
      uploadMutation.mutate(selectedVideo);
    }
  };

  const isUploading = uploadMutation.isPending;

  return (
    <View className="flex-1 bg-dark-900 p-6">
      <Text className="text-white text-2xl font-bold mb-2">Upload Video</Text>
      <Text className="text-dark-400 mb-8">
        Select a video to transform into viral short-form content
      </Text>

      {!selectedVideo ? (
        // Video selection UI
        <View className="flex-1 justify-center gap-4">
          <Pressable
            onPress={pickVideo}
            className="bg-dark-800 rounded-2xl p-8 items-center border-2 border-dashed border-dark-600"
          >
            <Ionicons name="folder-open" size={48} color="#6366f1" />
            <Text className="text-white text-lg font-semibold mt-4">
              Choose from Library
            </Text>
            <Text className="text-dark-400 mt-2">
              Select an existing video
            </Text>
          </Pressable>

          <Pressable
            onPress={recordVideo}
            className="bg-dark-800 rounded-2xl p-8 items-center border-2 border-dashed border-dark-600"
          >
            <Ionicons name="videocam" size={48} color="#10b981" />
            <Text className="text-white text-lg font-semibold mt-4">
              Record New Video
            </Text>
            <Text className="text-dark-400 mt-2">
              Use your camera
            </Text>
          </Pressable>
        </View>
      ) : (
        // Selected video preview
        <View className="flex-1">
          <View className="bg-dark-800 rounded-2xl p-6 mb-6">
            <View className="flex-row items-center">
              <View className="w-16 h-16 bg-dark-700 rounded-xl items-center justify-center">
                <Ionicons name="videocam" size={32} color="#6366f1" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-white font-semibold" numberOfLines={1}>
                  {selectedVideo.fileName ?? 'Selected Video'}
                </Text>
                <Text className="text-dark-400 text-sm mt-1">
                  {selectedVideo.duration
                    ? `${Math.round(selectedVideo.duration / 1000)}s`
                    : 'Ready to upload'}
                </Text>
              </View>
              {!isUploading && (
                <Pressable onPress={() => setSelectedVideo(null)}>
                  <Ionicons name="close-circle" size={28} color="#64748b" />
                </Pressable>
              )}
            </View>

            {/* Upload progress */}
            {isUploading && uploadProgress && (
              <View className="mt-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-dark-400 text-sm">Uploading...</Text>
                  <Text className="text-primary-400 text-sm">
                    {uploadProgress.percentage}%
                  </Text>
                </View>
                <View className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </View>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleUpload}
            disabled={isUploading}
            className={`rounded-xl p-4 items-center ${
              isUploading ? 'bg-dark-700' : 'bg-primary-600'
            }`}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="cloud-upload" size={24} color="#fff" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Upload & Process
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
