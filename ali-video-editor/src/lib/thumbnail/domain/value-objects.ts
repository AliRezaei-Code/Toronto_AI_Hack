/**
 * Value Objects for Thumbnail Generation
 *
 * Immutable objects that define concepts in the domain.
 */

// ============================================================================
// Prompt Builder Configuration
// ============================================================================

/**
 * Style configuration for prompt building
 */
export interface StyleConfig {
  /** Base prompt template */
  basePrompt: string;
  /** Negative prompt template */
  negativePrompt: string;
  /** Default brand colors */
  defaultColors: {
    primary: string;
    accent: string;
  };
  /** Default font style */
  fontStyle: "bold" | "modern" | "playful" | "professional";
}

/**
 * Prompt builder configuration
 */
export interface PromptBuilderConfig {
  /** Exact LoRA trigger phrase for specialized model */
  loraTriggerPhrase: string;
  /** Style-specific configurations */
  styleConfigs: Record<"HIGH_ENERGY" | "MINIMAL_TECH" | "FINANCE" | "GAMING", StyleConfig>;
}

// ============================================================================
// Validation Configuration
// ============================================================================

/**
 * PII detection patterns
 */
export const PI_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone numbers (various formats)
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  // Social Security Numbers
  /\b\d{3}-\d{2}-\d{4}\b/g,
  // Credit card numbers (basic pattern)
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // Dates in various formats that could be birthdates
  /\b(0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])[-/](19|20)\d{2}\b/g,
];

/**
 * Blocked content patterns
 */
export const BLOCKED_WORDS = [
  "hate",
  "violence",
  "illegal",
  "terrorism",
  "drugs",
  "weapons",
  "murder",
  "assault",
  "abuse",
  "gore",
  "explicit",
  "xxx",
  "porn",
  "nude",
  "naked",
];

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  /** Max title length in characters */
  MAX_TITLE_LENGTH: 100,
  /** Min title word count */
  MIN_TITLE_WORDS: 2,
  /** Max title word count */
  MAX_TITLE_WORDS: 6,
  /** Max topic length in characters */
  MAX_TOPIC_LENGTH: 200,
  /** Max negative prompt length in characters */
  MAX_NEGATIVE_PROMPT_LENGTH: 500,
  /** Min guidance scale */
  MIN_GUIDANCE_SCALE: 1.0,
  /** Max guidance scale */
  MAX_GUIDANCE_SCALE: 20.0,
  /** Min inference steps */
  MIN_INFERENCE_STEPS: 10,
  /** Max inference steps */
  MAX_INFERENCE_STEPS: 50,
  /** Max seed value */
  MAX_SEED: Math.pow(2, 32) - 1,
};

// ============================================================================
// Cache Configuration
// ============================================================================

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  /** Default TTL for cached thumbnails (24 hours) */
  DEFAULT_TTL_MS: 24 * 60 * 60 * 1000,
  /** Maximum cache size (number of entries) */
  MAX_CACHE_SIZE: 100,
};

// ============================================================================
// Circuit Breaker Configuration
// ============================================================================

/**
 * Circuit breaker configuration
 */
export const CIRCUIT_BREAKER_CONFIG = {
  /** Number of failures before opening circuit */
  FAILURE_THRESHOLD: 5,
  /** Time in ms to wait before attempting to close circuit */
  RESET_TIMEOUT_MS: 60000,
  /** Time in ms for half-open state */
  HALT_OPEN_TIMEOUT_MS: 10000,
};

// ============================================================================
// Retry Configuration
// ============================================================================

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  MAX_RETRIES: 3,
  /** Base delay in ms for exponential backoff */
  BASE_DELAY_MS: 1000,
  /** Multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
  /** Maximum delay in ms */
  MAX_DELAY_MS: 10000,
  /** HTTP status codes that should trigger retry */
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
};

// ============================================================================
// HuggingFace Configuration
// ============================================================================

/**
 * HuggingFace model configurations
 */
export const HUGGINGFACE_CONFIG = {
  /** Specialized model with LoRA */
  SPECIALIZED_MODEL: "black-forest-labs/FLUX.1-Kontext-dev",
  /** Fallback model (no LoRA) */
  FALLBACK_MODEL: "black-forest-labs/FLUX.1-schnell",
  /** API timeout in ms */
  API_TIMEOUT_MS: 30000,
  /** Request timeout in ms */
  REQUEST_TIMEOUT_MS: 60000,
  /** Default image dimensions */
  DEFAULT_WIDTH: 1280,
  DEFAULT_HEIGHT: 720,
  /** Default guidance scale */
  DEFAULT_GUIDANCE_SCALE: 7.5,
  /** Default inference steps */
  DEFAULT_INFERENCE_STEPS: 30,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if text contains PII
 */
export function containsPII(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PI_PATTERNS.some((pattern) => pattern.test(lowerText));
}

/**
 * Check if text contains blocked words
 */
export function containsBlockedWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => lowerText.includes(word));
}

/**
 * Redact sensitive information from prompt for logging
 */
export function redactPrompt(prompt: string, maxLength: number = 50): string {
  if (prompt.length <= maxLength) {
    return prompt;
  }
  return prompt.substring(0, maxLength) + "...[REDACTED]";
}

/**
 * Generate a random seed within valid range
 */
export function generateRandomSeed(): number {
  return Math.floor(Math.random() * VALIDATION_RULES.MAX_SEED);
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Calculate cache key from request parameters
 */
export function calculateCacheKey(
  titleText: string,
  topic: string,
  style: string,
  seed?: number
): string {
  const parts = [
    titleText.toLowerCase().trim(),
    topic.toLowerCase().trim(),
    style.toLowerCase(),
    seed?.toString() || "random",
  ];
  return parts.join("||");
}
