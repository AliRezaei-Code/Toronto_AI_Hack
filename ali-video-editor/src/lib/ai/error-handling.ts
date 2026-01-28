/**
 * Error Handling Utilities for Video Analysis
 *
 * Production-grade error handling with:
 * - Retry logic with exponential backoff
 * - Rate limiting
 * - Typed error classification
 * - Graceful degradation
 *
 * @module error-handling
 */

import { AppError, AppErrorType } from "../../types";
import { logger } from "../logger";
import { ANALYSIS_CONFIG, ERROR_MESSAGES, GEMINI_CONFIG } from "./constants";

// ============================================================================
// Error Types
// ============================================================================

/**
 * Gemini API error types that can be retried
 */
const RETRYABLE_ERROR_PATTERNS = [
  "RESOURCE_EXHAUSTED",
  "UNAVAILABLE",
  "DEADLINE_EXCEEDED",
  "INTERNAL",
  "rate limit",
  "quota exceeded",
  "503",
  "429",
  "timeout",
] as const;

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return RETRYABLE_ERROR_PATTERNS.some((pattern) => message.includes(pattern.toLowerCase()));
  }
  return false;
}

/**
 * Classify error into AppError type
 */
export function classifyError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  // API key issues
  if (
    lowerMessage.includes("api key") ||
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("403")
  ) {
    return new AppError(
      AppErrorType.API_KEY_INVALID,
      ERROR_MESSAGES.INVALID_API_KEY,
      error instanceof Error ? error : undefined
    );
  }

  // Rate limiting
  if (
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("quota") ||
    lowerMessage.includes("429")
  ) {
    return new AppError(
      AppErrorType.NETWORK_ERROR,
      ERROR_MESSAGES.RATE_LIMITED,
      error instanceof Error ? error : undefined
    );
  }

  // Timeout
  if (lowerMessage.includes("timeout") || lowerMessage.includes("deadline")) {
    return new AppError(
      AppErrorType.PROCESSING_TIMEOUT,
      ERROR_MESSAGES.TIMEOUT,
      error instanceof Error ? error : undefined
    );
  }

  // Default to analysis failed
  return new AppError(
    AppErrorType.RETENTION_ANALYSIS_FAILED,
    message || ERROR_MESSAGES.ANALYSIS_FAILED,
    error instanceof Error ? error : undefined
  );
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Info about a retry attempt for quota/rate limit
 */
export interface RetryInfo {
  /** The type of error causing the retry */
  errorType: "quota" | "rate_limit" | "timeout" | "server_error" | "unknown";
  /** Current attempt number (1-indexed) */
  attempt: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Delay until next retry in milliseconds */
  delayMs: number;
  /** Human-readable message for the user */
  message: string;
}

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Base delay in milliseconds */
  baseDelayMs?: number;
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
  /** Optional abort signal */
  signal?: AbortSignal;
  /** Context for logging */
  context?: Record<string, unknown>;
  /** Callback when retrying due to quota/rate limit - use this to update UI */
  onRetry?: (info: RetryInfo) => void;
}

/**
 * Extract retry delay from API error message (429 responses include "Please retry in Xs")
 */
function extractRetryDelayFromError(error: unknown): number | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message;

  // Match patterns like "Please retry in 59.873576589s" or "retryDelay\":\"59s\""
  const patterns = [
    /Please retry in (\d+(?:\.\d+)?)\s*s/i,
    /retryDelay.*?(\d+(?:\.\d+)?)\s*s/i,
    /retry.*?(\d+(?:\.\d+)?)\s*(?:seconds|s)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const seconds = parseFloat(match[1]);
      if (!isNaN(seconds) && seconds > 0) {
        // Convert to milliseconds and add a small buffer
        return Math.ceil((seconds + 1) * 1000);
      }
    }
  }

  return null;
}

/**
 * Calculate delay for exponential backoff with jitter
 * If error contains a retry delay, use that instead
 */
function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  error?: unknown
): number {
  // First, try to extract retry delay from the error message
  const apiRetryDelay = extractRetryDelayFromError(error);
  if (apiRetryDelay !== null) {
    // Use the API's suggested retry delay (already in ms)
    return Math.min(apiRetryDelay, maxDelay);
  }

  // Fallback to exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Add jitter (±25%)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);

  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms);

    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(new Error("Aborted"));
      });
    }
  });
}

/**
 * Classify the error type for retry notifications
 */
function classifyRetryErrorType(error: unknown): RetryInfo["errorType"] {
  if (!(error instanceof Error)) {
    return "unknown";
  }
  
  const message = error.message.toLowerCase();
  
  if (message.includes("quota") || message.includes("resource_exhausted")) {
    return "quota";
  }
  if (message.includes("rate limit") || message.includes("429")) {
    return "rate_limit";
  }
  if (message.includes("timeout") || message.includes("deadline")) {
    return "timeout";
  }
  if (message.includes("503") || message.includes("unavailable") || message.includes("internal")) {
    return "server_error";
  }
  
  return "unknown";
}

/**
 * Generate a human-readable message for retry info
 */
function generateRetryMessage(errorType: RetryInfo["errorType"], delayMs: number, attempt: number, maxRetries: number): string {
  const delaySeconds = Math.ceil(delayMs / 1000);
  const attemptsRemaining = maxRetries - attempt;
  
  switch (errorType) {
    case "quota":
      return `⏳ API quota exceeded. Waiting ${delaySeconds}s before retry (${attemptsRemaining} attempts left)...`;
    case "rate_limit":
      return `⏳ Rate limited by API. Waiting ${delaySeconds}s before retry (${attemptsRemaining} attempts left)...`;
    case "timeout":
      return `⏳ Request timed out. Retrying in ${delaySeconds}s (${attemptsRemaining} attempts left)...`;
    case "server_error":
      return `⏳ Server temporarily unavailable. Retrying in ${delaySeconds}s (${attemptsRemaining} attempts left)...`;
    default:
      return `⏳ Temporary error. Retrying in ${delaySeconds}s (${attemptsRemaining} attempts left)...`;
  }
}

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = GEMINI_CONFIG.MAX_RETRIES,
    baseDelayMs = GEMINI_CONFIG.RETRY_BASE_DELAY_MS,
    maxDelayMs = GEMINI_CONFIG.RETRY_MAX_DELAY_MS,
    signal,
    context = {},
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check for abort
      if (signal?.aborted) {
        throw new Error("Operation aborted");
      }

      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry non-retryable errors
      if (!isRetryableError(error)) {
        throw classifyError(error);
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        logger.error("Max retries exceeded", {
          ...context,
          attempt,
          error: error instanceof Error ? error.message : String(error),
        });
        throw classifyError(error);
      }

      // Calculate backoff delay - pass error to extract API's suggested retry delay
      const delay = calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs, error);
      const errorType = classifyRetryErrorType(error);

      logger.warn("Retrying after error", {
        ...context,
        attempt: attempt + 1,
        maxRetries,
        delayMs: delay,
        errorType,
        isApiSuggestedDelay: extractRetryDelayFromError(error) !== null,
        error: error instanceof Error ? error.message : String(error),
      });

      // Notify caller about retry (for UI feedback)
      if (onRetry) {
        const retryInfo: RetryInfo = {
          errorType,
          attempt: attempt + 1,
          maxRetries,
          delayMs: delay,
          message: generateRetryMessage(errorType, delay, attempt, maxRetries),
        };
        onRetry(retryInfo);
      }

      await sleep(delay, signal);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw classifyError(lastError);
}

// ============================================================================
// Rate Limiting
// ============================================================================

/**
 * Simple rate limiter using token bucket algorithm
 */
export class RateLimiter {
  private lastRequestTime = 0;
  private readonly minDelayMs: number;

  constructor(minDelayMs: number = GEMINI_CONFIG.RATE_LIMIT_DELAY_MS) {
    this.minDelayMs = minDelayMs;
  }

  /**
   * Wait until rate limit allows next request
   */
  async acquire(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const waitTime = Math.max(0, this.minDelayMs - elapsed);

    if (waitTime > 0) {
      await sleep(waitTime);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.lastRequestTime = 0;
  }
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate video analysis input
 */
export function validateAnalysisInput(input: {
  videoId?: string;
  duration?: number;
  transcription?: string;
  keyframes?: Array<{ base64Data?: string }>;
}): ValidationResult {
  const errors: string[] = [];

  // Import config at module level is already done
  const {
    MIN_VIDEO_DURATION,
    MAX_VIDEO_DURATION,
    MAX_TRANSCRIPTION_LENGTH,
    MAX_KEYFRAMES,
    MAX_KEYFRAME_SIZE_BYTES,
  } = ANALYSIS_CONFIG;

  // Video ID
  if (!input.videoId || typeof input.videoId !== "string") {
    errors.push("videoId is required and must be a string");
  }

  // Duration
  if (typeof input.duration !== "number" || isNaN(input.duration)) {
    errors.push("duration is required and must be a number");
  } else {
    if (input.duration < MIN_VIDEO_DURATION) {
      errors.push(ERROR_MESSAGES.VIDEO_TOO_SHORT);
    }
    if (input.duration > MAX_VIDEO_DURATION) {
      errors.push(ERROR_MESSAGES.VIDEO_TOO_LONG);
    }
  }

  // Transcription
  if (!input.transcription || typeof input.transcription !== "string") {
    errors.push("transcription is required and must be a string");
  } else {
    if (input.transcription.length > MAX_TRANSCRIPTION_LENGTH) {
      errors.push(ERROR_MESSAGES.TRANSCRIPTION_TOO_LONG);
    }
  }

  // Keyframes (optional)
  if (input.keyframes?.length) {
    if (input.keyframes.length > MAX_KEYFRAMES) {
      errors.push(`Maximum ${MAX_KEYFRAMES} keyframes allowed`);
    }

    for (let i = 0; i < input.keyframes.length; i++) {
      const frame = input.keyframes[i];
      if (frame?.base64Data) {
        const sizeBytes = (frame.base64Data.length * 3) / 4; // Approximate base64 decoded size
        if (sizeBytes > MAX_KEYFRAME_SIZE_BYTES) {
          errors.push(`Keyframe ${i} exceeds maximum size`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
