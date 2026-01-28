/**
 * Domain Layer Public API
 *
 * Exports all domain types, interfaces, and utilities.
 */

// Entities
export type {
  BrandOptions,
  GenerationStrategy,
  ProviderStatus,
  ThumbnailRequest,
  ThumbnailResult,
  ThumbnailStyle,
} from "./entities";

// Ports
export type {
  ImageData,
  InferenceProviderPort,
  TextToImageParams,
  ThumbnailCachePort,
  ThumbnailGeneratorPort,
} from "./ports";

// Errors
export {
  AllProvidersFailedError,
  APIKeyMissingError,
  APIResponseError,
  APITimeoutError,
  BlockedContentError,
  CircuitBreakerOpenError,
  GenerationFailedError,
  getErrorStatusCode,
  getUserErrorMessage,
  InvalidImageResponseError,
  isThumbnailGenerationError,
  PIIError,
  ProviderUnavailableError,
  RateLimitError,
  ThumbnailGenerationError,
  ValidationError,
} from "./errors";

// Value Objects
export {
  BLOCKED_WORDS,
  CACHE_CONFIG,
  calculateCacheKey,
  CIRCUIT_BREAKER_CONFIG,
  containsBlockedWords,
  containsPII,
  generateRandomSeed,
  HUGGINGFACE_CONFIG,
  isValidHexColor,
  PI_PATTERNS,
  redactPrompt,
  RETRY_CONFIG,
  VALIDATION_RULES,
} from "./value-objects";
export type { PromptBuilderConfig, StyleConfig } from "./value-objects";
