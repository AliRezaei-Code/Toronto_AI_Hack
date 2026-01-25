/**
 * AI Director types for viral clip generation
 */

import type { Word, Segment } from './transcript';

/** Viral clip identified by AI analysis */
export interface ViralClip {
  id: string;
  videoId: string;
  title: string;
  hook: string;
  start: number;
  end: number;
  duration: number;
  viralScore: number;
  reason: string;
  segments: Segment[];
  tags?: string[];
  platform?: 'tiktok' | 'reels' | 'shorts' | 'all';
  status: ViralClipStatus;
  renderedUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

/** Status of a viral clip */
export type ViralClipStatus = 
  | 'identified'
  | 'processing'
  | 'rendering'
  | 'completed'
  | 'failed';

/** Face coordinates for smart crop tracking */
export interface FaceCoordinate {
  frameNumber: number;
  timestamp: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  speakerId?: number;
}

/** Face tracking data for a video segment */
export interface FaceTrackingData {
  clipId: string;
  fps: number;
  frames: FaceCoordinate[];
  primarySpeaker?: number;
}

/** Jump cut segment (filler/silence removed) */
export interface JumpCutSegment {
  start: number;
  end: number;
  type: 'keep' | 'remove';
  reason?: string;
}

/** Director job for processing a video */
export interface DirectorJob {
  id: string;
  videoId: string;
  status: DirectorJobStatus;
  progress: number;
  currentStep?: string;
  clips?: ViralClip[];
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/** Director job status */
export type DirectorJobStatus =
  | 'queued'
  | 'transcribing'
  | 'analyzing'
  | 'tracking_faces'
  | 'processing_jumpcuts'
  | 'rendering'
  | 'completed'
  | 'failed';

/** Subtitle style configuration */
export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor?: string;
  position: 'top' | 'center' | 'bottom';
  animation: 'none' | 'fade' | 'karaoke' | 'bounce';
}

/** Video render configuration */
export interface RenderConfig {
  width: number;
  height: number;
  fps: number;
  codec: 'h264' | 'h265' | 'vp9';
  quality: 'draft' | 'standard' | 'high';
  subtitleStyle?: SubtitleStyle;
  enableSmartCrop: boolean;
  enableJumpCuts: boolean;
}
