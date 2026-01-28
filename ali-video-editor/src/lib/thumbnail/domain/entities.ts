/**
 * Domain Entities for Thumbnail Generation
 *
 * Core business objects that represent the domain model.
 */

// ============================================================================
// Request Entity
// ============================================================================

/**
 * Thumbnail generation request
 * Encapsulates all parameters needed to generate a thumbnail
 */
export interface ThumbnailRequest {
  /** Unique request identifier */
  id: string;
  /** Title text to display (2-7 words) */
  titleText: string;
  /** Topic/context for the thumbnail */
  topic: string;
  /** Visual style */
  style: ThumbnailStyle;
  /** Optional face image URL for future image-to-image */
  faceImageUrl?: string;
  /** Brand color options */
  brandOptions?: BrandOptions;
  /** Advanced inference parameters */
  guidanceScale?: number;
  numInferenceSteps?: number;
  seed?: number;
}

// ============================================================================
// Result Entity
// ============================================================================

/**
 * Thumbnail generation result
 * Contains the generated image and metadata
 */
export interface ThumbnailResult {
  /** Result identifier */
  id: string;
  /** Request identifier */
  requestId: string;
  /** Generated image data (base64 PNG) */
  imageData: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Model used for generation */
  model: string;
  /** Generation strategy used */
  strategy: GenerationStrategy;
  /** Prompt used for generation (sanitized) */
  prompt: string;
  /** Random seed for reproducibility */
  seed: number;
  /** Processing time in milliseconds */
  latencyMs: number;
  /** Estimated cost (if available) */
  costEstimate?: number;
  /** Generation timestamp */
  generatedAt: Date;
}

// ============================================================================
// Value Objects
// ============================================================================

/**
 * Thumbnail visual style
 */
export type ThumbnailStyle = "HIGH_ENERGY" | "MINIMAL_TECH" | "FINANCE" | "GAMING";

/**
 * Brand color and font options
 */
export interface BrandOptions {
  /** Primary color in hex format (#RRGGBB) */
  primaryColor?: string;
  /** Accent color in hex format (#RRGGBB) */
  accentColor?: string;
  /** Font style */
  fontStyle?: "bold" | "modern" | "playful" | "professional";
}

/**
 * Generation strategy
 */
export type GenerationStrategy = "SPECIALIZED" | "FALLBACK";

/**
 * Provider status
 */
export interface ProviderStatus {
  /** Provider name */
  provider: string;
  /** Whether provider is available */
  available: boolean;
  /** Circuit breaker state */
  circuitState: "closed" | "open" | "half-open";
  /** Last error message (if any) */
  lastError?: string;
  /** Total requests handled */
  totalRequests: number;
  /** Failed requests count */
  failedRequests: number;
}
