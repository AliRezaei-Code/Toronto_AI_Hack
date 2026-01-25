/**
 * Video Copilot - Type Definitions
 * AI-Powered Video Analysis Platform
 */

// ============================================================================
// Video Upload Types
// ============================================================================

/**
 * Video file metadata extracted from uploaded video
 */
export interface VideoMetadata {
  /** Unique identifier for the video */
  id: string;
  /** Original filename */
  filename: string;
  /** File path on disk */
  filepath: string;
  /** File size in bytes */
  fileSize: number;
  /** Duration in seconds */
  duration: number;
  /** Video width in pixels */
  width: number;
  /** Video height in pixels */
  height: number;
  /** Video codec (e.g., 'h264', 'h265') */
  codec: string;
  /** Audio codec (e.g., 'aac', 'mp3') */
  audioCodec: string;
  /** Frame rate */
  frameRate: number;
  /** Bitrate in kbps */
  bitrate: number;
  /** Upload timestamp */
  uploadedAt: Date;
  /** Upload progress (0-100) */
  uploadProgress: number;
  /** Estimated processing time in seconds */
  estimatedProcessingTime: number;
  /** Original video title (for YouTube videos) */
  originalTitle?: string;
}

/**
 * Supported video formats
 */
export type VideoFormat = "mp4" | "mov" | "avi" | "webm" | "mkv";

/**
 * Upload status
 */
export type UploadStatus = "idle" | "uploading" | "processing" | "completed" | "error";

/**
 * Video upload session
 */
export interface VideoUploadSession {
  /** Unique session identifier */
  id: string;
  /** Video metadata */
  metadata: VideoMetadata;
  /** Current upload status */
  status: UploadStatus;
  /** Upload progress (0-100) */
  progress: number;
  /** Error message if upload failed */
  error?: string;
  /** Session creation timestamp */
  createdAt: Date;
  /** Session completion timestamp */
  completedAt?: Date;
}

// ============================================================================
// Transcription Types (Deepgram)
// ============================================================================

/**
 * Single word in transcription
 */
export interface TranscriptionWord {
  /** Word text */
  word: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Speaker identifier (if speaker diarization enabled) */
  speaker?: string;
  /** Human-readable speaker label (e.g., "Speaker 1") */
  speakerLabel?: string;
}

/**
 * Single sentence/segment in transcription
 */
export interface TranscriptionSegment {
  /** Segment text */
  text: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Words in this segment */
  words: TranscriptionWord[];
  /** Speaker identifier */
  speaker?: string;
  /** Human-readable speaker label (e.g., "Speaker 1") */
  speakerLabel?: string;
}

/**
 * Complete transcription result
 */
export interface TranscriptionResult {
  /** Unique identifier */
  id: string;
  /** Video ID this transcription belongs to */
  videoId: string;
  /** Full transcript text */
  text: string;
  /** Transcription segments */
  segments: TranscriptionSegment[];
  /** Overall confidence score (0-1) */
  confidence: number;
  /** Language detected */
  language: string;
  /** Processing duration in seconds */
  processingDuration: number;
  /** Timestamp when transcription was created */
  createdAt: Date;
  /** Number of unique speakers detected */
  speakerCount?: number;
  /** List of speaker labels */
  speakers?: string[];
  /** Full text with speaker annotations */
  diarizedText?: string;
}

// ============================================================================
// Retention Analysis Types
// ============================================================================

/**
 * Suspense moment detected in video
 */
export interface SuspenseMoment {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Suspense intensity score (0-1) */
  intensity: number;
  /** Type of suspense */
  type: "audio" | "visual" | "content" | "combined";
  /** Description of what creates suspense */
  description: string;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Curiosity moment detected in video
 */
export interface CuriosityMoment {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Curiosity score (0-1) */
  score: number;
  /** What creates curiosity */
  trigger: string;
  /** Description */
  description: string;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Retention score for a time segment
 */
export interface RetentionScore {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Predicted retention rate (0-1) */
  retentionRate: number;
  /** Engagement score (0-1) */
  engagementScore: number;
  /** Drop-off risk (0-1) */
  dropOffRisk: number;
}

/**
 * Emotional tone analysis
 */
export interface EmotionalTone {
  /** Primary emotion */
  primary: string;
  /** Secondary emotion */
  secondary?: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Time range */
  start: number;
  end: number;
}

/**
 * Visual scene analysis
 */
export interface VisualScene {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Scene type */
  type: "talking-head" | "screen-share" | "presentation" | "demo" | "other";
  /** Action intensity (0-1) */
  actionIntensity: number;
  /** Visual complexity (0-1) */
  visualComplexity: number;
  /** Description */
  description: string;
}

/**
 * Content quality assessment
 */
export interface ContentQuality {
  /** Overall quality score (0-1) */
  overallScore: number;
  /** Clarity score (0-1) */
  clarity: number;
  /** Engagement score (0-1) */
  engagement: number;
  /** Structure score (0-1) */
  structure: number;
  /** Pacing score (0-1) */
  pacing: number;
  /** Visual quality score (0-1) */
  visualQuality: number;
  /** Audio quality score (0-1) */
  audioQuality: number;
}

/**
 * Complete retention analysis result
 */
export interface RetentionAnalysis {
  /** Unique identifier */
  id: string;
  /** Video ID this analysis belongs to */
  videoId: string;
  /** Suspense moments */
  suspenseMoments: SuspenseMoment[];
  /** Curiosity moments */
  curiosityMoments: CuriosityMoment[];
  /** Retention scores across timeline */
  retentionScores: RetentionScore[];
  /** Emotional tones */
  emotionalTones: EmotionalTone[];
  /** Visual scenes */
  visualScenes: VisualScene[];
  /** Content quality assessment */
  contentQuality: ContentQuality;
  /** Overall engagement prediction (0-1) */
  overallEngagementPrediction: number;
  /** Average retention rate (0-1) */
  averageRetentionRate: number;
  /** Key insights */
  keyInsights: string[];
  /** Processing duration in seconds */
  processingDuration: number;
  /** Timestamp when analysis was created */
  createdAt: Date;
}

// ============================================================================
// Content Analysis Types
// ============================================================================

/**
 * Silence segment detected in audio
 */
export interface SilenceSegment {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Duration in seconds */
  duration: number;
  /** Average audio level in dB */
  audioLevel: number;
}

/**
 * Speech segment detected in audio
 */
export interface SpeechSegment {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Duration in seconds */
  duration: number;
  /** Average audio level in dB */
  audioLevel: number;
  /** Speech intensity (0-1) */
  intensity: number;
}

/**
 * Chapter marker
 */
export interface ChapterMarker {
  /** Unique identifier */
  id: string;
  /** Chapter title */
  title: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Chapter description */
  description?: string;
  /** Whether this is AI-generated */
  isAIGenerated: boolean;
  /** Retention score for this chapter (0-1) */
  retentionScore?: number;
  /** Engagement score for this chapter (0-1) */
  engagementScore?: number;
}

/**
 * Timeline segment
 */
export interface TimelineSegment {
  /** Unique identifier */
  id: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Duration in seconds */
  duration: number;
  /** Segment type */
  type: "silence" | "speech" | "action" | "transition";
  /** Audio level in dB */
  audioLevel: number;
  /** Whether segment is selected */
  isSelected: boolean;
  /** Chapter marker if this segment starts a chapter */
  chapterMarker?: ChapterMarker;
  /** Retention score (0-1) */
  retentionScore?: number;
  /** Transcription text for speech segments */
  transcriptionText?: string;
  /** Speaker identifier */
  speaker?: string;
  /** Confidence score (0-1) */
  confidence?: number;
}

/**
 * Complete timeline data
 */
export interface Timeline {
  /** Unique identifier */
  id: string;
  /** Video ID this timeline belongs to */
  videoId: string;
  /** Total duration in seconds */
  duration: number;
  /** Timeline segments */
  segments: TimelineSegment[];
  /** Chapter markers */
  chapterMarkers: ChapterMarker[];
  /** Silence segments */
  silenceSegments: SilenceSegment[];
  /** Speech segments */
  speechSegments: SpeechSegment[];
  /** Timestamp when timeline was created */
  createdAt: Date;
  /** Timestamp when timeline was last updated */
  updatedAt: Date;
}

// ============================================================================
// AI Insights Types
// ============================================================================

/**
 * Script improvement suggestion
 */
export interface ScriptSuggestion {
  /** Suggestion type */
  type: "add" | "remove" | "modify" | "reorder";
  /** Description of suggestion */
  description: string;
  /** Time range this applies to */
  start: number;
  end: number;
  /** Suggested text (if applicable) */
  suggestedText?: string;
  /** Priority (1-5) */
  priority: number;
  /** Expected impact on retention (0-1) */
  expectedImpact: number;
}

/**
 * Visual enhancement recommendation
 */
export interface VisualRecommendation {
  /** Type of enhancement */
  type: "zoom" | "crop" | "transition" | "overlay" | "effect";
  /** Description */
  description: string;
  /** Time range this applies to */
  start: number;
  end: number;
  /** Specific parameters */
  parameters?: Record<string, unknown>;
  /** Priority (1-5) */
  priority: number;
  /** Expected impact on engagement (0-1) */
  expectedImpact: number;
}

/**
 * Content pacing suggestion
 */
export interface PacingSuggestion {
  /** Suggestion type */
  type: "speed-up" | "slow-down" | "keep" | "add-break";
  /** Description */
  description: string;
  /** Time range this applies to */
  start: number;
  end: number;
  /** Suggested speed multiplier */
  speedMultiplier?: number;
  /** Priority (1-5) */
  priority: number;
  /** Expected impact on retention (0-1) */
  expectedImpact: number;
}

/**
 * SEO-optimized metadata
 */
export interface SEOMetadata {
  /** Optimized title */
  title: string;
  /** Optimized description */
  description: string;
  /** Generated tags */
  tags: string[];
  /** YouTube chapters */
  chapters: ChapterMarker[];
  /** Thumbnail suggestions */
  thumbnailSuggestions: ThumbnailSuggestion[];
  /** SEO score (0-1) */
  seoScore: number;
  /** Key keywords */
  keywords: string[];
}

/**
 * Thumbnail suggestion
 */
export interface ThumbnailSuggestion {
  /** Thumbnail ID */
  id: string;
  /** Timestamp for thumbnail frame */
  timestamp: number;
  /** Thumbnail image data (base64) */
  imageData: string;
  /** Suggested text overlay */
  textOverlay?: string;
  /** Predicted click-through rate (0-1) */
  predictedCTR: number;
  /** Description */
  description: string;
}

/**
 * Generated thumbnail result
 */
export interface ThumbnailGenerationResult {
  /** Unique thumbnail ID */
  id: string;
  /** Related request ID */
  requestId?: string;
  /** Thumbnail image data (data URL format) */
  imageData: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Model used for generation */
  model: string;
  /** Generation strategy used */
  strategy: "SPECIALIZED" | "FALLBACK";
  /** Sanitized prompt used (for logging) */
  prompt: string;
  /** Random seed used */
  seed: number;
  /** Generation latency in milliseconds */
  latencyMs: number;
  /** Estimated cost (if available) */
  costEstimate?: number;
  /** Timestamp when thumbnail was generated */
  generatedAt: Date;
}

/**
 * Individual improvement factor contribution
 */
export interface ImprovementFactor {
  /** Factor name for display/logging */
  name: string;
  /** Raw score (0-1) */
  score: number;
  /** Weight applied (0-1) */
  weight: number;
  /** Weighted contribution */
  contribution: number;
  /** Human-readable description */
  description: string;
  /** Actionable items count */
  actionableItems: number;
}

/**
 * Complete improvement breakdown for transparency
 */
export interface ImprovementBreakdown {
  /** Overall potential (0-1) */
  overall: number;
  /** Individual factor contributions */
  factors: ImprovementFactor[];
  /** Top 3 priorities for improvement */
  topPriorities: string[];
  /** Estimated boost percentage for display */
  estimatedBoostPercent: number;
  /** Confidence level of the estimation */
  confidenceLevel: "low" | "medium" | "high";
}

/**
 * Complete AI insights result
 */
export interface AIInsights {
  /** Unique identifier */
  id: string;
  /** Video ID these insights belong to */
  videoId: string;
  /** Script suggestions */
  scriptSuggestions: ScriptSuggestion[];
  /** Visual recommendations */
  visualRecommendations: VisualRecommendation[];
  /** Pacing suggestions */
  pacingSuggestions: PacingSuggestion[];
  /** SEO metadata */
  seoMetadata: SEOMetadata;
  /** Overall improvement potential (0-1) */
  overallImprovementPotential: number;
  /** Detailed improvement breakdown */
  improvementBreakdown?: ImprovementBreakdown;
  /** Top 3 actionable insights */
  topInsights: string[];
  /** Processing duration in seconds */
  processingDuration: number;
  /** Timestamp when insights were created */
  createdAt: Date;
}

// ============================================================================
// Analysis Session Types
// ============================================================================

// ============================================================================
// Keyframe Extraction Types
// ============================================================================

/**
 * Extracted keyframe data ready for Gemini API
 */
export interface ExtractedKeyframe {
  /** Timestamp in seconds */
  timestamp: number;
  /** Base64-encoded image data */
  base64Data: string;
  /** MIME type of the image */
  mimeType: "image/jpeg" | "image/png";
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** File size in bytes */
  sizeBytes: number;
}

/**
 * Keyframe extraction configuration
 */
export interface KeyframeExtractionConfig {
  /** Output format */
  format?: "jpeg" | "png";
  /** Output quality (1-100 for JPEG, ignored for PNG) */
  quality?: number;
  /** Max width (maintains aspect ratio) */
  maxWidth?: number;
  /** Max height (maintains aspect ratio) */
  maxHeight?: number;
}

/**
 * Sampling strategy options for keyframe extraction
 */
export type SamplingStrategy =
  | { type: "uniform"; count: number } // Extract N frames uniformly
  | { type: "interval"; intervalSeconds: number } // Extract every N seconds
  | { type: "timestamps"; timestamps: number[] } // Extract at specific times
  | { type: "scene_change"; sensitivity?: number }; // Scene change detection

/**
 * Keyframe extraction result
 */
export interface ExtractionResult {
  /** Extracted keyframes */
  keyframes: ExtractedKeyframe[];
  /** Video duration in seconds */
  videoDuration: number;
  /** Extraction time in ms */
  extractionTimeMs: number;
  /** Any warnings during extraction */
  warnings: string[];
}

// ============================================================================
// Video Analysis Types
// ============================================================================

/**
 * Complete analysis session for a video
 */
export interface AnalysisSession {
  /** Unique session identifier */
  id: string;
  /** Video ID being analyzed */
  videoId: string;
  /** Video metadata */
  videoMetadata: VideoMetadata;
  /** Transcription result */
  transcription?: TranscriptionResult;
  /** Retention analysis */
  retentionAnalysis?: RetentionAnalysis;
  /** Timeline data */
  timeline?: Timeline;
  /** AI insights */
  aiInsights?: AIInsights;
  /** Current analysis status */
  status: "pending" | "transcribing" | "analyzing" | "generating-insights" | "completed" | "error";
  /** Overall progress (0-100) */
  progress: number;
  /** Error message if analysis failed */
  error?: string;
  /** Session creation timestamp */
  createdAt: Date;
  /** Session completion timestamp */
  completedAt?: Date;
}

/**
 * Video analysis input for AI
 */
export interface VideoAnalysisInput {
  /** Video ID for tracking */
  videoId: string;
  /** Video duration in seconds */
  duration: number;
  /** Transcription text */
  transcription: string;
  /** Optional video metadata */
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
  /** Optional keyframes as base64 images */
  keyframes?: Array<{
    timestamp: number;
    base64Data: string;
    mimeType: string;
  }>;
}

/**
 * Analysis configuration options
 */
export interface AnalysisConfig {
  /** Optional: which categories to analyze */
  categories?: string[];
  /** Keyframe sampling strategy */
  keyframeStrategy?: SamplingStrategy;
  /** Whether to include transcription */
  includeTranscription?: boolean;
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  /** Video ID */
  videoId: string;
  /** Extracted keyframes */
  keyframes: ExtractedKeyframe[];
  /** Results by category */
  categoryResults: Record<string, unknown>;
  /** Overall score (0-1) */
  overallScore: number;
  /** All issues across categories */
  allIssues: unknown[];
  /** Priority actions */
  priorityActions: string[];
  /** Processing time in ms */
  processingTimeMs: number;
}

// ============================================================================
// Settings Types
// ============================================================================

/**
 * AI analysis preferences
 */
export interface AIAnalysisSettings {
  /** Analysis model to use */
  model: "gemini-flash" | "gemini-pro";
  /** Maximum analysis duration in minutes */
  maxAnalysisDuration: number;
  /** Whether to analyze full video or sample */
  analyzeFullVideo: boolean;
  /** Frame sampling rate (frames per minute) */
  frameSamplingRate: number;
}

/**
 * Retention analysis settings
 */
export interface RetentionAnalysisSettings {
  /** Suspense detection sensitivity (0-1) */
  suspenseSensitivity: number;
  /** Curiosity threshold (0-1) */
  curiosityThreshold: number;
  /** Minimum suspense duration in seconds */
  minSuspenseDuration: number;
  /** Retention prediction model */
  predictionModel: "basic" | "advanced";
}

/**
 * API keys configuration
 */
export interface APIKeys {
  /** Deepgram API key */
  deepgram: string;
  /** Gemini API key */
  gemini: string;
  /** YouTube API key */
  youtube: string;
}

/**
 * Application settings
 */
export interface AppSettings {
  /** AI analysis settings */
  aiAnalysis: AIAnalysisSettings;
  /** Retention analysis settings */
  retentionAnalysis: RetentionAnalysisSettings;
  /** API keys */
  apiKeys: APIKeys;
  /** Theme preference */
  theme: "dark" | "light";
  /** Language preference */
  language: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Application error types
 */
export enum AppErrorType {
  /** Video upload failed */
  VIDEO_UPLOAD_FAILED = "VIDEO_UPLOAD_FAILED",
  /** Video format not supported */
  VIDEO_FORMAT_NOT_SUPPORTED = "VIDEO_FORMAT_NOT_SUPPORTED",
  /** Transcription failed */
  TRANSCRIPTION_FAILED = "TRANSCRIPTION_FAILED",
  /** Retention analysis failed */
  RETENTION_ANALYSIS_FAILED = "RETENTION_ANALYSIS_FAILED",
  /** AI insights generation failed */
  AI_INSIGHTS_FAILED = "AI_INSIGHTS_FAILED",
  /** API key missing or invalid */
  API_KEY_INVALID = "API_KEY_INVALID",
  /** Network error */
  NETWORK_ERROR = "NETWORK_ERROR",
  /** File not found */
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  /** Invalid video file */
  INVALID_VIDEO_FILE = "INVALID_VIDEO_FILE",
  /** Processing timeout */
  PROCESSING_TIMEOUT = "PROCESSING_TIMEOUT",
  /** Audio extraction failed */
  AUDIO_EXTRACTION_FAILED = "AUDIO_EXTRACTION_FAILED",
}

/**
 * Application error
 */
export class AppError extends Error {
  /** Error type */
  public readonly type: AppErrorType;
  /** Original error if this wraps another error */
  public readonly originalError?: Error;
  /** Additional context */
  public readonly context?: Record<string, unknown>;

  constructor(
    type: AppErrorType,
    message: string,
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.originalError = originalError;
    this.context = context;
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: number, message?: string) => void;

/**
 * Error callback type
 */
export type ErrorCallback = (error: AppError) => void;

/**
 * Success callback type
 */
export type SuccessCallback<T> = (result: T) => void;
