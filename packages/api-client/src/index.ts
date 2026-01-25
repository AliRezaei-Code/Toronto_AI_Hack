/**
 * @repo/api-client
 * 
 * Shared API client for the AI Director video editor
 * Used by both web and mobile applications
 */

// Client configuration and base methods
export {
  initApiClient,
  getApiConfig,
  get,
  post,
  put,
  patch,
  del,
  type ApiClientConfig,
  type RequestOptions,
} from './client';

// AI Director endpoints
export {
  startDirectorAnalysis,
  getDirectorJob,
  getDirectorJobs,
  getViralClips,
  getViralClip,
  renderViralClip,
  getFaceTrackingData,
  getRenderedClipUrl,
  getClipThumbnailUrl,
} from './director';

// Job management endpoints
export {
  getJobs,
  getJob,
  cancelJob,
  deleteJob,
  retryJob,
  getJobsByStatus,
} from './jobs';

// Upload endpoints
export {
  uploadVideo,
  getVideo,
  getVideos,
  deleteVideo,
  getVideoStreamUrl,
  getVideoThumbnailUrl,
  type OnProgress,
} from './upload';
