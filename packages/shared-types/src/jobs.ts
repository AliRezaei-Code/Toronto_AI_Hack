/**
 * Job-related types for background processing
 */

/** Generic job for video processing */
export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  videoId?: string;
  inputUrl?: string;
  outputUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/** Job types */
export type JobType =
  | 'upload'
  | 'transcode'
  | 'transcribe'
  | 'analyze'
  | 'render'
  | 'director';

/** Job status */
export type JobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** Video information */
export interface Video {
  id: string;
  userId: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  size: number;
  mimeType: string;
  status: VideoStatus;
  createdAt: string;
  updatedAt: string;
}

/** Video status */
export type VideoStatus =
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed';

/** Upload progress */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
