/**
 * Video Analysis Constants and Configuration
 *
 * Centralized configuration for the video analysis system.
 * Enables consistent behavior and easy tuning across all analyzers.
 *
 * @module constants
 */

// ============================================================================
// API Configuration
// ============================================================================

/**
 * Default Gemini API configuration
 * 
 * Free tier limits (as of Jan 2026):
 * - gemini-2.5-flash: 5 RPM (requests per minute)
 * - gemini-2.5-flash-lite: 20 RPD (requests per day)
 * - gemini-2.5-pro: very limited
 */
export const GEMINI_CONFIG = {
  /** Default model to use */
  DEFAULT_MODEL: "gemini-2.5-flash",

  /** Fallback models in order of preference */
  FALLBACK_MODELS: [
    "gemini-3-flash-preview", // Next gen flash preview - try first
    "gemini-3-pro-preview", // Next gen pro preview
    "gemini-2.5-flash", // Stable - most reliable for production, 5 RPM free tier
    "gemini-2.5-flash-lite", // Stable - fastest and cost-efficient, 20 RPD free tier
    "gemini-2.5-pro", // Highest quality
    "gemini-2.0-flash", // Previous gen flash
    "gemini-2.0-flash-lite", // Previous gen flash lite
  ],

  /** Default temperature for analysis (balanced creativity/accuracy) */
  DEFAULT_TEMPERATURE: 0.7,

  /** Maximum output tokens for responses */
  DEFAULT_MAX_TOKENS: 8192,

  /** Request timeout in milliseconds */
  REQUEST_TIMEOUT_MS: 120_000, // 2 minutes

  /** Maximum retries for transient failures */
  MAX_RETRIES: 5,

  /** Base delay for exponential backoff (ms) */
  RETRY_BASE_DELAY_MS: 2000,

  /** Maximum delay between retries (ms) - increased to respect API retry delays */
  RETRY_MAX_DELAY_MS: 65_000, // 65 seconds to handle 60s retry delays from API

  /** Rate limit: minimum delay between requests (ms) - 12s = 5 RPM */
  RATE_LIMIT_DELAY_MS: 12_500,
} as const;

// ============================================================================
// Analysis Configuration
// ============================================================================

/**
 * Analysis defaults
 */
export const ANALYSIS_CONFIG = {
  /** Maximum transcription length (characters) to prevent token overflow */
  MAX_TRANSCRIPTION_LENGTH: 50_000,

  /** Maximum keyframes to include in a single request */
  MAX_KEYFRAMES: 10,

  /** Maximum keyframe size in bytes (5MB) */
  MAX_KEYFRAME_SIZE_BYTES: 5 * 1024 * 1024,

  /** Minimum video duration to analyze (seconds) */
  MIN_VIDEO_DURATION: 1,

  /** Maximum video duration to analyze (seconds) - 4 hours */
  MAX_VIDEO_DURATION: 14_400,

  /** Keyframe extraction defaults */
  KEYFRAME_DEFAULTS: {
    /** Default format for extracted frames */
    FORMAT: "jpeg" as const,
    /** JPEG quality (1-100) */
    QUALITY: 85,
    /** Maximum frame width */
    MAX_WIDTH: 1280,
    /** Maximum frame height */
    MAX_HEIGHT: 720,
  },
} as const;

/**
 * Category keyframe requirements
 * Defines which categories need keyframes and how many
 */
export const CATEGORY_KEYFRAME_CONFIG = {
  core_concepts: {
    requiresKeyframes: true,
    minKeyframes: 3,
    recommendedKeyframes: 7,
    focusAreas: ["hook", "pattern_interrupts", "drop_off_points"],
  },
  scripting: {
    requiresKeyframes: false,
    minKeyframes: 0,
    recommendedKeyframes: 5,
    focusAreas: ["visual_cues"],
  },
  visual_editing: {
    requiresKeyframes: true,
    minKeyframes: 10,
    recommendedKeyframes: 15,
    focusAreas: ["pacing", "transitions", "visual_variety"],
  },
  audio_design: {
    requiresKeyframes: false,
    minKeyframes: 0,
    recommendedKeyframes: 0,
    focusAreas: [],
  },
  seo_metadata: {
    requiresKeyframes: false,
    minKeyframes: 0,
    recommendedKeyframes: 0,
    focusAreas: [],
  },
  style_guides: {
    requiresKeyframes: true,
    minKeyframes: 5,
    recommendedKeyframes: 8,
    focusAreas: ["style_consistency", "visual_identity"],
  },
  tools_workflows: {
    requiresKeyframes: false,
    minKeyframes: 0,
    recommendedKeyframes: 0,
    focusAreas: [],
  },
  checklists: {
    requiresKeyframes: true,
    minKeyframes: 3,
    recommendedKeyframes: 5,
    focusAreas: ["visual_checklist_items"],
  },
} as const;

// ============================================================================
// Severity Weights
// ============================================================================

/**
 * Weights for issue severity when calculating scores
 */
export const SEVERITY_WEIGHTS = {
  critical: 1.0,
  major: 0.7,
  minor: 0.4,
  suggestion: 0.2,
} as const;

/**
 * Severity sort order (lower = more severe)
 */
export const SEVERITY_ORDER = {
  critical: 0,
  major: 1,
  minor: 2,
  suggestion: 3,
} as const;

// ============================================================================
// Category Configuration
// ============================================================================

/**
 * All available analysis categories
 */
export const ALL_CATEGORIES = [
  "core_concepts",
  "scripting",
  "visual_editing",
  "audio_design",
  "seo_metadata",
  "style_guides",
  "tools_workflows",
  "checklists",
] as const;

/**
 * Quick analysis category groups
 */
export const CATEGORY_GROUPS = {
  /** Essential checks for any video */
  essential: ["core_concepts", "scripting", "checklists"] as const,

  /** Visual-focused analysis */
  visual: ["visual_editing", "style_guides"] as const,

  /** Content optimization */
  optimization: ["seo_metadata", "audio_design"] as const,

  /** Workflow improvements */
  workflow: ["tools_workflows"] as const,
} as const;

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Standardized error messages
 */
export const ERROR_MESSAGES = {
  NOT_INITIALIZED: "Gemini service not initialized. Call initialize() with API key first.",
  INVALID_API_KEY: "Invalid or missing Gemini API key.",
  RATE_LIMITED: "API rate limit exceeded. Please try again later.",
  TIMEOUT: "Analysis request timed out. Try with shorter content.",
  INVALID_INPUT: "Invalid analysis input provided.",
  TRANSCRIPTION_TOO_LONG: `Transcription exceeds maximum length of ${ANALYSIS_CONFIG.MAX_TRANSCRIPTION_LENGTH} characters.`,
  VIDEO_TOO_SHORT: `Video duration must be at least ${ANALYSIS_CONFIG.MIN_VIDEO_DURATION} second.`,
  VIDEO_TOO_LONG: `Video duration exceeds maximum of ${ANALYSIS_CONFIG.MAX_VIDEO_DURATION} seconds.`,
  KEYFRAME_TOO_LARGE: `Keyframe size exceeds maximum of ${ANALYSIS_CONFIG.MAX_KEYFRAME_SIZE_BYTES} bytes.`,
  UNKNOWN_CATEGORY: "Unknown analysis category specified.",
  ANALYSIS_FAILED: "Analysis failed after maximum retries.",
} as const;
