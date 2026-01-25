/**
 * Video upload API endpoints
 */

import type {
  ApiResponse,
  Video,
  UploadProgress,
} from '@repo/shared-types';
import { getApiConfig } from './client';

/** Upload progress callback */
export type OnProgress = (progress: UploadProgress) => void;

/** Upload a video file with progress tracking */
export async function uploadVideo(
  file: File | Blob,
  options?: {
    title?: string;
    description?: string;
    onProgress?: OnProgress;
    signal?: AbortSignal;
  }
): Promise<ApiResponse<Video>> {
  const { baseUrl, getToken } = getApiConfig();

  const formData = new FormData();
  formData.append('file', file);
  if (options?.title) formData.append('title', options.title);
  if (options?.description) formData.append('description', options.description);

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (options?.onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          options.onProgress!({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true, data });
        } else {
          resolve({
            success: false,
            error: data.error ?? {
              code: 'UPLOAD_ERROR',
              message: data.message ?? 'Upload failed',
            },
          });
        }
      } catch {
        resolve({
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: 'Failed to parse response',
          },
        });
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error during upload',
        },
      });
    });

    xhr.addEventListener('abort', () => {
      resolve({
        success: false,
        error: {
          code: 'ABORTED',
          message: 'Upload was cancelled',
        },
      });
    });

    // Handle abort signal
    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    // Send request
    xhr.open('POST', `${baseUrl}/api/upload`);

    // Add auth token
    if (getToken) {
      getToken().then((token) => {
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
      });
    } else {
      xhr.send(formData);
    }
  });
}

/** Get video by ID */
export async function getVideo(videoId: string): Promise<ApiResponse<Video>> {
  const { get } = await import('./client');
  return get<Video>(`/api/videos/${videoId}`);
}

/** Get all videos for current user */
export async function getVideos(): Promise<ApiResponse<Video[]>> {
  const { get } = await import('./client');
  return get<Video[]>('/api/videos');
}

/** Delete a video */
export async function deleteVideo(videoId: string): Promise<ApiResponse<void>> {
  const { del } = await import('./client');
  return del<void>(`/api/videos/${videoId}`);
}

/** Get video stream URL */
export function getVideoStreamUrl(videoId: string): string {
  const { baseUrl } = getApiConfig();
  return `${baseUrl}/api/videos/${videoId}/stream`;
}

/** Get video thumbnail URL */
export function getVideoThumbnailUrl(videoId: string): string {
  const { baseUrl } = getApiConfig();
  return `${baseUrl}/api/videos/${videoId}/thumbnail`;
}
