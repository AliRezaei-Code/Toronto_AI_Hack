/**
 * HuggingFace Inference Adapter
 *
 * Implements InferenceProviderPort for HuggingFace text-to-image API.
 * Includes retry logic, circuit breaker, and timeout handling.
 */

import type {
  GenerationStrategy,
  ImageData,
  InferenceProviderPort,
  TextToImageParams,
} from "../domain";
import {
  APIResponseError,
  APITimeoutError,
  CIRCUIT_BREAKER_CONFIG,
  HUGGINGFACE_CONFIG,
  InvalidImageResponseError,
  ProviderUnavailableError,
  RETRY_CONFIG,
} from "../domain";
import { CircuitBreakerFactory } from "./circuit-breaker";

// ============================================================================
// HuggingFace Response Types
// ============================================================================

/**
 * HuggingFace API error response
 */
interface HFErrorResponse {
  error: string;
  details?: string;
}

/**
 * HuggingFace text-to-image API response
 */
interface HFTextToImageResponse {
  /** Base64 image data (without data URL prefix) */
  image: string;
  /** Optional: image metadata */
  parameters?: TextToImageParams;
}

// ============================================================================
// HuggingFace Adapter Implementation
// ============================================================================

/**
 * HuggingFace inference adapter
 *
 * Implements the InferenceProviderPort interface for HuggingFace models.
 * Handles automatic retries, circuit breaking, and error handling.
 */
export class HuggingFaceAdapter implements InferenceProviderPort {
  private apiUrl: string;
  private model: string;
  private strategy: GenerationStrategy;
  private circuitBreaker: ReturnType<typeof CircuitBreakerFactory.getOrCreate>;
  private requestCount: number = 0;
  private failureCount: number = 0;

  constructor(
    private readonly apiKey: string,
    modelName: string,
    strategy: GenerationStrategy
  ) {
    if (!apiKey) {
      throw new Error("HuggingFace API key is required");
    }

    this.model = modelName;
    this.strategy = strategy;
    this.circuitBreaker = CircuitBreakerFactory.getOrCreate(modelName, CIRCUIT_BREAKER_CONFIG);
    this.apiUrl = `https://router.huggingface.co/hf-inference/models/${modelName}`;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return "HuggingFace";
  }

  /**
   * Get model name
   */
  getModelName(): string {
    return this.model;
  }

  /**
   * Get generation strategy
   */
  getStrategy(): GenerationStrategy {
    return this.strategy;
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    if (this.circuitBreaker.isOpen()) {
      return false;
    }

    try {
      // Make a lightweight request to check availability
      const response = await fetch(this.apiUrl, {
        method: "HEAD",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(HUGGINGFACE_CONFIG.API_TIMEOUT_MS),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate image from text prompt with retry logic
   */
  async textToImage(params: TextToImageParams): Promise<ImageData> {
    this.requestCount++;

    // Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      throw new ProviderUnavailableError(
        this.model,
        "Circuit breaker is open due to previous failures"
      );
    }

    try {
      const result = await this.executeWithRetry(params);
      this.circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      this.failureCount++;
      this.circuitBreaker.recordFailure();

      if (
        error instanceof ProviderUnavailableError ||
        error instanceof APITimeoutError ||
        error instanceof APIResponseError
      ) {
        throw error;
      }

      throw new ProviderUnavailableError(
        this.model,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Execute API call with retry logic
   */
  private async executeWithRetry(params: TextToImageParams): Promise<ImageData> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < RETRY_CONFIG.MAX_RETRIES; attempt++) {
      try {
        return await this.executeRequest(params);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable
        if (!this.isRetryableError(lastError)) {
          break;
        }

        // Don't retry on last attempt
        if (attempt >= RETRY_CONFIG.MAX_RETRIES - 1) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          RETRY_CONFIG.BASE_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt),
          RETRY_CONFIG.MAX_DELAY_MS
        );

        await this.sleep(delay);
      }
    }

    // All retries failed
    throw lastError || new Error("Unknown error during image generation");
  }

  /**
   * Execute single API request
   */
  private async executeRequest(params: TextToImageParams): Promise<ImageData> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HUGGINGFACE_CONFIG.REQUEST_TIMEOUT_MS);

    try {
      // Format request body for new HuggingFace API
      const requestBody = {
        inputs: params.prompt,
        parameters: {
          negative_prompt: params.negative_prompt,
          width: params.width,
          height: params.height,
          guidance_scale: params.guidance_scale,
          num_inference_steps: params.num_inference_steps,
          seed: params.seed,
        },
      };

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parse response
      const data = await this.parseResponse(response);

      // Return image data
      return {
        base64: data.image,
        mimeType: "image/png",
        width: params.width,
        height: params.height,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new APITimeoutError(this.model, HUGGINGFACE_CONFIG.REQUEST_TIMEOUT_MS);
      }

      throw error;
    }
  }

  /**
   * Handle error response from API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const data = (await response.json()) as HFErrorResponse;
      errorMessage = data.error || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }

    // Handle specific status codes
    if (response.status === 401) {
      throw new APIResponseError(
        this.model,
        401,
        "Invalid API key. Please check your HUGGINGFACE_API_TOKEN."
      );
    }

    if (response.status === 429) {
      throw new APIResponseError(this.model, 429, "Rate limit exceeded. Please try again later.");
    }

    if (response.status === 503) {
      throw new ProviderUnavailableError(
        this.model,
        "Service unavailable. The model may be loading or overloaded."
      );
    }

    throw new APIResponseError(this.model, response.status, errorMessage);
  }

  /**
   * Parse successful response
   */
  private async parseResponse(response: Response): Promise<HFTextToImageResponse> {
    const contentType = response.headers.get("content-type");

    // Handle JSON response (new API format)
    if (contentType?.includes("application/json")) {
      try {
        const data = await response.json();

        // New API format: image might be directly in response or nested
        let imageData: string;

        if (data.image && typeof data.image === "string") {
          // Old format fallback
          imageData = data.image;
        } else if (Array.isArray(data) && data.length > 0 && data[0].image) {
          // New format: array with image data
          imageData = data[0].image;
        } else if (typeof data === "string") {
          // Direct base64 string
          imageData = data;
        } else {
          throw new InvalidImageResponseError(this.model, "Unexpected response format");
        }

        return { image: imageData };
      } catch (error) {
        if (error instanceof InvalidImageResponseError) {
          throw error;
        }
        throw new InvalidImageResponseError(this.model, "Failed to parse JSON response");
      }
    }

    // Handle binary response (base64 encoded)
    if (contentType?.includes("image/")) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return { image: base64 };
    }

    throw new InvalidImageResponseError(
      this.model,
      `Unexpected response content type: ${contentType}`
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    // Network errors are retryable
    if (
      error.message.includes("ECONNRESET") ||
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("ENOTFOUND") ||
      error.message.includes("fetch failed")
    ) {
      return true;
    }

    // Provider unavailable errors are retryable (might be temporary)
    if (error instanceof ProviderUnavailableError) {
      return true;
    }

    // Timeout errors are retryable
    if (error instanceof APITimeoutError) {
      return true;
    }

    // Specific HTTP status codes are retryable
    if (error instanceof APIResponseError) {
      return RETRY_CONFIG.RETRYABLE_STATUS_CODES.includes(error.statusCode);
    }

    return false;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get statistics
   */
  getStats(): {
    requestCount: number;
    failureCount: number;
    successRate: number;
    circuitState: string;
  } {
    const successCount = this.requestCount - this.failureCount;
    const successRate = this.requestCount > 0 ? successCount / this.requestCount : 0;

    return {
      requestCount: this.requestCount,
      failureCount: this.failureCount,
      successRate,
      circuitState: this.circuitBreaker.getState(),
    };
  }
}

// ============================================================================
// HuggingFace Adapter Factory
// ============================================================================

/**
 * Factory for creating HuggingFace adapters
 */
export class HuggingFaceAdapterFactory {
  private static instances: Map<string, HuggingFaceAdapter> = new Map();

  /**
   * Get or create adapter instance
   */
  static getOrCreate(
    apiKey: string,
    modelName: string,
    strategy: GenerationStrategy
  ): HuggingFaceAdapter {
    const key = `${modelName}-${strategy}`;
    if (!this.instances.has(key)) {
      const adapter = new HuggingFaceAdapter(apiKey, modelName, strategy);
      this.instances.set(key, adapter);
    }
    return this.instances.get(key) as HuggingFaceAdapter;
  }

  /**
   * Get specialized model adapter
   */
  static getSpecialized(apiKey: string): HuggingFaceAdapter {
    return this.getOrCreate(apiKey, HUGGINGFACE_CONFIG.SPECIALIZED_MODEL, "SPECIALIZED");
  }

  /**
   * Get fallback model adapter
   */
  static getFallback(apiKey: string): HuggingFaceAdapter {
    return this.getOrCreate(apiKey, HUGGINGFACE_CONFIG.FALLBACK_MODEL, "FALLBACK");
  }

  /**
   * Reset all adapters (useful for testing)
   */
  static reset(): void {
    this.instances.clear();
  }
}
