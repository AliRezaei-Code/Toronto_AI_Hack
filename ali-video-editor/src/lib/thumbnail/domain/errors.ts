/**
 * Custom Errors for Thumbnail Generation
 *
 * Domain-specific error types for better error handling and user feedback.
 */

// ============================================================================
// Base Error Class
// ============================================================================

/**
 * Base error class for thumbnail generation errors
 */
export class ThumbnailGenerationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ThumbnailGenerationError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * Input validation error
 */
export class ValidationError extends ThumbnailGenerationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

/**
 * PII detected in input
 */
export class PIIError extends ValidationError {
  constructor(message: string = "Input contains personally identifiable information") {
    super(message, { category: "pii" });
    this.name = "PIIError";
  }
}

/**
 * Blocked content detected
 */
export class BlockedContentError extends ValidationError {
  constructor(message: string = "Input contains blocked content") {
    super(message, { category: "blocked_content" });
    this.name = "BlockedContentError";
  }
}

// ============================================================================
// Provider Errors
// ============================================================================

/**
 * Provider unavailable error
 */
export class ProviderUnavailableError extends ThumbnailGenerationError {
  constructor(provider: string, reason?: string) {
    const message = `Provider ${provider} is unavailable${reason ? `: ${reason}` : ""}`;
    super("PROVIDER_UNAVAILABLE", message, 503, { provider });
    this.name = "ProviderUnavailableError";
  }
}

/**
 * Rate limit exceeded
 */
export class RateLimitError extends ThumbnailGenerationError {
  constructor(provider: string, retryAfter?: number) {
    const message = `Rate limit exceeded for ${provider}`;
    super("RATE_LIMIT_ERROR", message, 429, { provider, retryAfter });
    this.name = "RateLimitError";
  }
}

/**
 * Circuit breaker open error
 */
export class CircuitBreakerOpenError extends ThumbnailGenerationError {
  constructor(provider: string) {
    const message = `Circuit breaker is open for ${provider}. Too many failures.`;
    super("CIRCUIT_BREAKER_OPEN", message, 503, { provider });
    this.name = "CircuitBreakerOpenError";
  }
}

// ============================================================================
// API Errors
// ============================================================================

/**
 * Missing API key error
 */
export class APIKeyMissingError extends ThumbnailGenerationError {
  constructor(apiName: string) {
    const message = `${apiName} API key is not configured`;
    super("API_KEY_MISSING", message, 500, { apiName });
    this.name = "APIKeyMissingError";
  }
}

/**
 * API request timeout
 */
export class APITimeoutError extends ThumbnailGenerationError {
  constructor(provider: string, timeoutMs: number) {
    const message = `Request to ${provider} timed out after ${timeoutMs}ms`;
    super("API_TIMEOUT", message, 504, { provider, timeoutMs });
    this.name = "APITimeoutError";
  }
}

/**
 * API response error
 */
export class APIResponseError extends ThumbnailGenerationError {
  constructor(provider: string, statusCode: number, message: string) {
    super("API_RESPONSE_ERROR", message, statusCode, { provider, statusCode });
    this.name = "APIResponseError";
  }
}

// ============================================================================
// Generation Errors
// ============================================================================

/**
 * All providers failed
 */
export class AllProvidersFailedError extends ThumbnailGenerationError {
  constructor(attempts: number) {
    const message = `All ${attempts} provider attempts failed`;
    super("ALL_PROVIDERS_FAILED", message, 500, { attempts });
    this.name = "AllProvidersFailedError";
  }
}

/**
 * Image generation failed
 */
export class GenerationFailedError extends ThumbnailGenerationError {
  constructor(provider: string, reason: string) {
    const message = `Image generation failed for ${provider}: ${reason}`;
    super("GENERATION_FAILED", message, 500, { provider, reason });
    this.name = "GenerationFailedError";
  }
}

/**
 * Invalid image response
 */
export class InvalidImageResponseError extends ThumbnailGenerationError {
  constructor(provider: string, details?: string) {
    const message = `Invalid image response from ${provider}${details ? `: ${details}` : ""}`;
    super("INVALID_IMAGE_RESPONSE", message, 500, { provider, details });
    this.name = "InvalidImageResponseError";
  }
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Check if error is a thumbnail generation error
 */
export function isThumbnailGenerationError(error: unknown): error is ThumbnailGenerationError {
  return error instanceof ThumbnailGenerationError;
}

/**
 * Get user-friendly error message from error
 */
export function getUserErrorMessage(error: unknown): string {
  if (isThumbnailGenerationError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isThumbnailGenerationError(error)) {
    return error.statusCode;
  }

  return 500;
}
