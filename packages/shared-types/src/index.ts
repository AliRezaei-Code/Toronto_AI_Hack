/**
 * @repo/shared-types
 * 
 * Shared TypeScript types for the AI Director video editor
 * Used by both web and mobile applications
 */

// API types
export type {
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginatedResponse,
} from './api';

// Transcript types
export type {
  Word,
  Segment,
  Clip,
  Transcript,
  SpeakerInfo,
} from './transcript';

// AI Director types
export type {
  ViralClip,
  ViralClipStatus,
  FaceCoordinate,
  FaceTrackingData,
  JumpCutSegment,
  DirectorJob,
  DirectorJobStatus,
  SubtitleStyle,
  RenderConfig,
} from './director';

// Auth types
export type {
  User,
  AuthState,
  LoginCredentials,
  RegisterData,
  AuthTokens,
} from './auth';

// Job types
export type {
  Job,
  JobType,
  JobStatus,
  Video,
  VideoStatus,
  UploadProgress,
} from './jobs';
