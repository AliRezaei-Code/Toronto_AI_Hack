/**
 * AI Director API endpoints
 */

import { get, post } from './client';
import type {
  ApiResponse,
  DirectorJob,
  ViralClip,
  RenderConfig,
  FaceTrackingData,
} from '@repo/shared-types';

/** Start AI Director analysis on a video */
export async function startDirectorAnalysis(
  videoId: string,
  options?: {
    targetCount?: number;
    minDuration?: number;
    maxDuration?: number;
    platforms?: ('tiktok' | 'reels' | 'shorts')[];
  }
): Promise<ApiResponse<DirectorJob>> {
  return post<DirectorJob>('/api/director/analyze', {
    video_id: videoId,
    ...options,
  });
}

/** Get director job status */
export async function getDirectorJob(jobId: string): Promise<ApiResponse<DirectorJob>> {
  return get<DirectorJob>(`/api/director/jobs/${jobId}`);
}

/** Get all director jobs for current user */
export async function getDirectorJobs(): Promise<ApiResponse<DirectorJob[]>> {
  return get<DirectorJob[]>('/api/director/jobs');
}

/** Get viral clips for a video */
export async function getViralClips(videoId: string): Promise<ApiResponse<ViralClip[]>> {
  return get<ViralClip[]>(`/api/director/videos/${videoId}/clips`);
}

/** Get a specific viral clip */
export async function getViralClip(clipId: string): Promise<ApiResponse<ViralClip>> {
  return get<ViralClip>(`/api/director/clips/${clipId}`);
}

/** Render a viral clip with configuration */
export async function renderViralClip(
  clipId: string,
  config?: Partial<RenderConfig>
): Promise<ApiResponse<{ jobId: string }>> {
  return post<{ jobId: string }>(`/api/director/clips/${clipId}/render`, config);
}

/** Get face tracking data for a clip */
export async function getFaceTrackingData(
  clipId: string
): Promise<ApiResponse<FaceTrackingData>> {
  return get<FaceTrackingData>(`/api/director/clips/${clipId}/face-tracking`);
}

/** Download a rendered clip */
export function getRenderedClipUrl(clipId: string): string {
  return `/api/director/clips/${clipId}/download`;
}

/** Get thumbnail URL for a clip */
export function getClipThumbnailUrl(clipId: string): string {
  return `/api/director/clips/${clipId}/thumbnail`;
}
