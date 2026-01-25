/**
 * Port Interfaces for Thumbnail Generation
 *
 * Defines contracts for external dependencies following Dependency Inversion Principle.
 */

import type { ProviderStatus, ThumbnailRequest, ThumbnailResult } from "./entities";

// ============================================================================
// Primary Ports (Driven by Application Layer)
// ============================================================================

/**
 * Thumbnail generator port - main service interface
 */
export interface ThumbnailGeneratorPort {
  /**
   * Generate a thumbnail with automatic fallback
   * @param request - Thumbnail generation request
   * @returns Generated thumbnail result
   */
  generateThumbnail(request: ThumbnailRequest): Promise<ThumbnailResult>;

  /**
   * Get status of inference providers
   * @returns Array of provider statuses
   */
  getStatus(): Promise<ProviderStatus[]>;
}

// ============================================================================
// Secondary Ports (Driving by Application Layer)
// ============================================================================

/**
 * Inference provider port - abstracts different AI model providers
 */
export interface InferenceProviderPort {
  /**
   * Generate image from text prompt
   * @param params - Inference parameters
   * @returns Base64 image data
   */
  textToImage(params: TextToImageParams): Promise<ImageData>;

  /**
   * Check if provider is available
   * @returns True if provider is operational
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get provider name for logging
   */
  getProviderName(): string;

  /**
   * Get model name used by provider
   */
  getModelName(): string;

  /**
   * Get generation strategy
   */
  getStrategy(): "SPECIALIZED" | "FALLBACK";
}

/**
 * Thumbnail cache port for request deduplication
 */
export interface ThumbnailCachePort {
  /**
   * Get cached thumbnail result
   * @param cacheKey - Unique cache key
   * @returns Cached result or null if not found
   */
  get(cacheKey: string): Promise<ThumbnailResult | null>;

  /**
   * Cache a thumbnail result
   * @param cacheKey - Unique cache key
   * @param result - Result to cache
   * @param ttlMs - Time-to-live in milliseconds
   */
  set(cacheKey: string, result: ThumbnailResult, ttlMs: number): Promise<void>;

  /**
   * Invalidate cache entry
   * @param cacheKey - Unique cache key
   */
  invalidate(cacheKey: string): Promise<void>;

  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;

  /**
   * Get cache statistics (optional)
   */
  getStats?(): {
    size: number;
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    hitRate: number;
  };
}

// ============================================================================
// Supporting Types
// ============================================================================

/**
 * Text-to-image inference parameters
 */
export interface TextToImageParams {
  /** Text prompt for image generation */
  prompt: string;
  /** Negative prompt to avoid */
  negative_prompt: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Guidance scale (1.0-20.0) */
  guidance_scale: number;
  /** Number of inference steps (10-50) */
  num_inference_steps: number;
  /** Random seed for reproducibility */
  seed: number;
}

/**
 * Generated image data
 */
export interface ImageData {
  /** Base64-encoded image data */
  base64: string;
  /** MIME type */
  mimeType: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
}
