/**
 * Thumbnail Service
 *
 * Main service for thumbnail generation with automatic fallback and caching.
 * Singleton pattern following established codebase conventions.
 */

import { randomUUID } from "crypto";
import type {
  InferenceProviderPort,
  ProviderStatus,
  ThumbnailCachePort,
  ThumbnailGeneratorPort,
  ThumbnailRequest,
  ThumbnailResult,
} from "../domain";
import {
  APIKeyMissingError,
  CACHE_CONFIG,
  HUGGINGFACE_CONFIG,
  VALIDATION_RULES,
  calculateCacheKey,
  redactPrompt,
} from "../domain";
import { CacheFactory, HuggingFaceAdapterFactory } from "../infrastructure";
import { buildNegativePrompt, buildPrompt, getInferenceParameters } from "./prompt-builder";

// ============================================================================
// Thumbnail Service Implementation
// ============================================================================

/**
 * Thumbnail generation service
 *
 * Implements ThumbnailGeneratorPort interface.
 * Provides automatic fallback, caching, and structured logging.
 */
export class ThumbnailService implements ThumbnailGeneratorPort {
  private static instance: ThumbnailService;
  private apiKey: string | null = null;
  private cache: ThumbnailCachePort;
  private specializedProvider: InferenceProviderPort | null = null;
  private fallbackProvider: InferenceProviderPort | null = null;

  private constructor() {
    this.cache = CacheFactory.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService();
    }
    return ThumbnailService.instance;
  }

  /**
   * Initialize service with API key
   */
  public initialize(apiKey?: string): void {
    const key = apiKey || process.env.HUGGINGFACE_API_TOKEN;

    if (!key || key.trim().length === 0) {
      throw new APIKeyMissingError("HuggingFace");
    }

    this.apiKey = key.trim();

    // Initialize providers
    this.specializedProvider = HuggingFaceAdapterFactory.getSpecialized(this.apiKey);
    this.fallbackProvider = HuggingFaceAdapterFactory.getFallback(this.apiKey);
  }

  /**
   * Check if service is initialized
   */
  public isInitialized(): boolean {
    return (
      this.apiKey !== null && this.specializedProvider !== null && this.fallbackProvider !== null
    );
  }

  /**
   * Ensure service is initialized, throw if not
   */
  private ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new APIKeyMissingError("HuggingFace. Call initialize() first.");
    }
  }

  /**
   * Generate thumbnail with automatic fallback
   */
  public async generateThumbnail(request: ThumbnailRequest): Promise<ThumbnailResult> {
    this.ensureInitialized();

    // Check cache
    const cacheKey = calculateCacheKey(
      request.titleText,
      request.topic,
      request.style,
      request.seed
    );
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    // Try specialized provider first, then fallback
    let result: ThumbnailResult;

    try {
      result = await this.generateWithSpecialized(request);
    } catch (error) {
      // Use fallback if specialized fails
      result = await this.generateWithFallback(request);
    }

    // Cache the result
    await this.cache.set(cacheKey, result, CACHE_CONFIG.DEFAULT_TTL_MS);

    return result;
  }

  /**
   * Generate using specialized provider
   */
  private async generateWithSpecialized(request: ThumbnailRequest): Promise<ThumbnailResult> {
    if (!this.specializedProvider) {
      throw new Error("Specialized provider not initialized");
    }

    return this.generateWithProvider(request, this.specializedProvider, "SPECIALIZED");
  }

  /**
   * Generate using fallback provider
   */
  private async generateWithFallback(request: ThumbnailRequest): Promise<ThumbnailResult> {
    if (!this.fallbackProvider) {
      throw new Error("Fallback provider not initialized");
    }

    return this.generateWithProvider(request, this.fallbackProvider, "FALLBACK");
  }

  /**
   * Generate using a specific provider
   */
  private async generateWithProvider(
    request: ThumbnailRequest,
    provider: InferenceProviderPort,
    strategy: "SPECIALIZED" | "FALLBACK"
  ): Promise<ThumbnailResult> {
    const startTime = Date.now();

    // Build prompts
    const prompt = buildPrompt(
      request.titleText,
      request.style,
      request.topic,
      request.brandOptions,
      strategy
    );
    const negativePrompt = buildNegativePrompt(request.style);

    // Get inference parameters
    const inferenceParams = getInferenceParameters(
      request.guidanceScale,
      request.numInferenceSteps
    );

    // Call provider
    const imageData = await provider.textToImage({
      prompt,
      negative_prompt: negativePrompt,
      width: HUGGINGFACE_CONFIG.DEFAULT_WIDTH,
      height: HUGGINGFACE_CONFIG.DEFAULT_HEIGHT,
      guidance_scale: inferenceParams.guidance_scale,
      num_inference_steps: inferenceParams.num_inference_steps,
      seed: request.seed ?? Math.floor(Math.random() * VALIDATION_RULES.MAX_SEED),
    });

    const latencyMs = Date.now() - startTime;

    // Build result
    return {
      id: randomUUID(),
      requestId: request.id,
      imageData: `data:${imageData.mimeType};base64,${imageData.base64}`,
      width: imageData.width,
      height: imageData.height,
      model: provider.getModelName(),
      strategy,
      prompt: redactPrompt(prompt, 100),
      seed: request.seed ?? 0,
      latencyMs,
      costEstimate: undefined,
      generatedAt: new Date(),
    };
  }

  /**
   * Get status of all providers
   */
  public async getStatus(): Promise<ProviderStatus[]> {
    this.ensureInitialized();

    const statuses: ProviderStatus[] = [];

    if (this.specializedProvider) {
      statuses.push(await this.buildProviderStatus(this.specializedProvider));
    }

    if (this.fallbackProvider) {
      statuses.push(await this.buildProviderStatus(this.fallbackProvider));
    }

    return statuses;
  }

  /**
   * Build provider status
   */
  private async buildProviderStatus(provider: InferenceProviderPort): Promise<ProviderStatus> {
    const available = await provider.isAvailable();

    return {
      provider: `${provider.getProviderName()}:${provider.getModelName()}`,
      available,
      circuitState: "closed", // TODO: Get from circuit breaker stats
      lastError: undefined,
      totalRequests: 0,
      failedRequests: 0,
    };
  }

  /**
   * Clear cache
   */
  public async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    hitRate: number;
  } {
    if (this.cache.getStats) {
      return this.cache.getStats();
    }
    return {
      size: 0,
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };
  }
}

// ============================================================================
// Service Factory
// ============================================================================

/**
 * Export singleton instance
 */
export const thumbnailService = ThumbnailService.getInstance();

/**
 * Helper function to create thumbnail request from validated data
 */
export function createThumbnailRequest(validatedData: {
  titleText: string;
  topic: string;
  style: "HIGH_ENERGY" | "MINIMAL_TECH" | "FINANCE" | "GAMING";
  faceImageUrl?: string;
  brandOptions?: {
    primaryColor?: string;
    accentColor?: string;
    fontStyle?: "bold" | "modern" | "playful" | "professional";
  };
  guidanceScale?: number;
  numInferenceSteps?: number;
  seed?: number;
}): ThumbnailRequest {
  return {
    id: randomUUID(),
    titleText: validatedData.titleText,
    topic: validatedData.topic,
    style: validatedData.style,
    faceImageUrl: validatedData.faceImageUrl,
    brandOptions: validatedData.brandOptions,
    guidanceScale: validatedData.guidanceScale,
    numInferenceSteps: validatedData.numInferenceSteps,
    seed: validatedData.seed,
  };
}
