/**
 * Video Copilot - Gemini Multimodal Service
 *
 * Production-grade video analysis using Google Gemini API with structured JSON output.
 * Uses Gemini's native JSON mode for guaranteed valid responses.
 *
 * Design Principles:
 * - SOLID: Single responsibility, open for extension
 * - DRY: Shared utilities for JSON generation
 * - Modular: Category-specific analyzers are composable
 * - Secure: Validated responses with Zod schemas
 * - Fast: Efficient prompts, parallel analysis support
 *
 * @module gemini-service
 */

import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { AppError, AppErrorType, ProgressCallback } from "../../types";
import { BaseAnalysisResponse, CategorySchemaType, VideoAnalysisIssue } from "../../types/schemas";
import { logger } from "../logger";
import { GEMINI_CONFIG } from "./constants";
import { AnalysisOptions, runAnalyzer, VideoAnalysisInput } from "./video-analyzers";

// ============================================================================
// Types
// ============================================================================

/**
 * Service configuration
 */
export interface GeminiServiceConfig {
  /** Gemini API key */
  apiKey: string;
  /** Model name (default: gemini-1.5-flash) */
  modelName?: string;
  /** Default temperature for generation */
  defaultTemperature?: number;
  /** Default max output tokens */
  defaultMaxTokens?: number;
}

/**
 * Analysis result with all category outputs
 */
export interface FullVideoAnalysis {
  /** Video identifier */
  videoId: string;
  /** Total video duration */
  duration: number;
  /** Timestamp of analysis */
  analyzedAt: Date;
  /** Overall quality score (0-1) */
  overallScore: number;
  /** Results by category */
  categoryResults: Record<CategorySchemaType, BaseAnalysisResponse | null>;
  /** All issues across categories, sorted by severity */
  allIssues: VideoAnalysisIssue[];
  /** Top priority actions to take */
  priorityActions: string[];
  /** Processing time in ms */
  processingTimeMs: number;
}

// ============================================================================
// Gemini Service Class
// ============================================================================

/**
 * Gemini Service
 * Singleton service for video analysis with structured JSON output
 */
export class GeminiService {
  private static instance: GeminiService;
  private client: GoogleGenerativeAI | null = null;
  private models: Map<string, GenerativeModel> = new Map();
  private config: GeminiServiceConfig | null = null;
  private workingModel: string | null = null;

  private constructor() {
    logger.info("GeminiService initialized");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Initialize Gemini client with configuration
   */
  public initialize(config?: Partial<GeminiServiceConfig>): void {
    // Use provided config or create from environment variables
    const finalConfig: GeminiServiceConfig = {
      apiKey: config?.apiKey || process.env.GEMINI_API_KEY || "",
      modelName: config?.modelName ?? GEMINI_CONFIG.DEFAULT_MODEL,
      defaultTemperature: config?.defaultTemperature ?? 0.7,
      defaultMaxTokens: config?.defaultMaxTokens ?? 8192,
    };

    if (!finalConfig.apiKey) {
      throw new AppError(
        AppErrorType.API_KEY_INVALID,
        "Gemini API key not provided. Set GEMINI_API_KEY environment variable or pass key to initialize()."
      );
    }

    this.config = finalConfig;
    this.client = new GoogleGenerativeAI(finalConfig.apiKey);

    // Initialize all fallback models
    for (const modelName of GEMINI_CONFIG.FALLBACK_MODELS) {
      try {
        const model = this.client.getGenerativeModel({ model: modelName });
        this.models.set(modelName, model);
      } catch (error) {
        logger.warn("Failed to initialize model", {
          modelName,
          error: error instanceof Error ? error.message : "Unknown",
        });
      }
    }

    logger.info("Gemini client initialized with fallback models", {
      availableModels: Array.from(this.models.keys()),
      totalModels: this.models.size,
    });
  }

  /**
   * Check if service is initialized
   */
  public isInitialized(): boolean {
    return this.client !== null && this.models.size > 0 && this.config !== null;
  }

  /**
   * Get a working model with fallback logic
   */
  private async getWorkingModel(): Promise<GenerativeModel> {
    this.ensureInitialized();

    // If we already have a working model, use it
    if (this.workingModel && this.models.has(this.workingModel)) {
      const model = this.models.get(this.workingModel);
      if (model) {
        return model;
      }
    }

    // Try models in order of preference
    for (const modelName of GEMINI_CONFIG.FALLBACK_MODELS) {
      const model = this.models.get(modelName);
      if (model) {
        // Test the model with a simple request
        try {
          await model.generateContent({
            contents: [{ role: "user", parts: [{ text: "test" }] }],
          });
          this.workingModel = modelName;
          logger.info("Found working model", { modelName });
          return model;
        } catch (error) {
          logger.warn("Model test failed", {
            modelName,
            error: error instanceof Error ? error.message : "Unknown",
          });
        }
      }
    }

    throw new AppError(
      AppErrorType.API_KEY_INVALID,
      "No working Gemini models available. Check API key and model availability."
    );
  }

  /**
   * Get the underlying model for direct use (with fallback)
   */
  public async getModel(): Promise<GenerativeModel> {
    return this.getWorkingModel();
  }

  // ==========================================================================
  // Single Category Analysis
  // ==========================================================================

  /**
   * Analyze a single knowledge base category
   *
   * @param category - Category to analyze (01-08)
   * @param input - Video analysis input (transcription, metadata, keyframes)
   * @param options - Analysis options
   * @returns Structured analysis response for the category
   */
  public async analyzeCategory(
    category: CategorySchemaType,
    input: VideoAnalysisInput,
    options?: AnalysisOptions
  ): Promise<BaseAnalysisResponse> {
    // Auto-initialize from environment if not already done
    if (!this.isInitialized()) {
      this.initialize();
    }

    logger.info("Starting category analysis", {
      category,
      videoId: input.videoId,
    });

    const mergedOptions: AnalysisOptions = {
      includeKnowledgeBase: true,
      temperature: this.config?.defaultTemperature ?? 0.7,
      maxOutputTokens: this.config?.defaultMaxTokens ?? 8192,
      ...options,
    };

    const model = await this.getWorkingModel();
    return runAnalyzer(category, model, input, mergedOptions);
  }

  // ==========================================================================
  // Multi-Category Analysis
  // ==========================================================================

  /**
   * Analyze multiple categories SEQUENTIALLY to respect rate limits
   * 
   * Free tier limits:
   * - gemini-2.5-flash: 5 RPM (requests per minute)
   * - Running 8 analyses in parallel would instantly exhaust the limit
   *
   * @param categories - Categories to analyze
   * @param input - Video analysis input
   * @param options - Analysis options
   * @param onProgress - Progress callback
   */
  public async analyzeCategories(
    categories: CategorySchemaType[],
    input: VideoAnalysisInput,
    options?: AnalysisOptions,
    onProgress?: ProgressCallback
  ): Promise<Record<CategorySchemaType, BaseAnalysisResponse | null>> {
    // Auto-initialize from environment if not already done
    if (!this.isInitialized()) {
      this.initialize();
    }

    const results: Record<CategorySchemaType, BaseAnalysisResponse | null> = {
      core_concepts: null,
      scripting: null,
      visual_editing: null,
      audio_design: null,
      seo_metadata: null,
      style_guides: null,
      tools_workflows: null,
      checklists: null,
    };

    const total = categories.length;
    let completedCount = 0;

    // Run categories SEQUENTIALLY to respect rate limits (5 RPM for free tier)
    if (onProgress) {
      onProgress(5, `Analyzing ${total} categories sequentially (rate limit: 5/min)...`);
    }

    for (const category of categories) {
      if (!category) {
        continue;
      }

      // Create options with retry message callback that updates progress
      const optionsWithRetry: AnalysisOptions = {
        ...options,
        onRetryMessage: onProgress 
          ? (message: string) => {
              // Report the retry message through progress callback
              const currentProgress = Math.round((completedCount / total) * 90) + 5;
              onProgress(currentProgress, message);
            }
          : undefined,
      };

      try {
        const result = await this.analyzeCategory(category, input, optionsWithRetry);
        results[category] = result;
        completedCount++;
        if (onProgress) {
          const progress = Math.round((completedCount / total) * 90) + 5;
          onProgress(progress, `Completed ${category} (${completedCount}/${total})`);
        }
      } catch (error) {
        logger.error("Category analysis failed", {
          category,
          videoId: input.videoId,
          error: error instanceof Error ? error.message : "Unknown",
        });

        // If this was a model error, try to reset working model and retry once
        if (error instanceof Error && error.message.includes("model")) {
          this.workingModel = null;
          try {
            logger.info("Retrying category analysis with new model", { category });
            const result = await this.analyzeCategory(category, input, optionsWithRetry);
            results[category] = result;
            completedCount++;
            if (onProgress) {
              const progress = Math.round((completedCount / total) * 90) + 5;
              onProgress(progress, `Completed ${category} (${completedCount}/${total})`);
            }
          } catch (retryError) {
            logger.error("Retry failed for category analysis", {
              category,
              error: retryError instanceof Error ? retryError.message : "Unknown",
            });
            results[category] = null;
            completedCount++;
          }
        } else {
          results[category] = null;
          completedCount++;
        }
      }
    }

    if (onProgress) {
      onProgress(100, "Analysis complete");
    }

    return results;
  }

  // ==========================================================================
  // Full Video Analysis
  // ==========================================================================

  /**
   * Run comprehensive analysis across all categories
   *
   * @param input - Video analysis input
   * @param options - Analysis options with optional category selection
   * @param onProgress - Progress callback
   */
  public async analyzeVideo(
    input: VideoAnalysisInput,
    options?: AnalysisOptions & { categories?: CategorySchemaType[] },
    onProgress?: ProgressCallback
  ): Promise<FullVideoAnalysis> {
    // Auto-initialize from environment if not already done
    if (!this.isInitialized()) {
      this.initialize();
    }

    const startTime = Date.now();
    const categories =
      options?.categories ??
      ([
        "core_concepts",
        "scripting",
        "visual_editing",
        "audio_design",
        "seo_metadata",
        "style_guides",
        "tools_workflows",
        "checklists",
      ] as CategorySchemaType[]);

    logger.info("Starting full video analysis", {
      videoId: input.videoId,
      categories: categories.length,
    });

    // Run all category analyzers
    const categoryResults = await this.analyzeCategories(categories, input, options, onProgress);

    // Aggregate all issues across categories
    const allIssues: VideoAnalysisIssue[] = [];
    let totalScore = 0;
    let scoreCount = 0;
    const priorityActions: string[] = [];

    for (const [, result] of Object.entries(categoryResults)) {
      if (result) {
        allIssues.push(...result.issues);
        totalScore += result.overallScore;
        scoreCount++;
        priorityActions.push(...result.priorityActions);
      }
    }

    // Sort issues by severity
    const severityOrder = { critical: 0, major: 1, minor: 2, suggestion: 3 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Calculate overall score
    const overallScore = scoreCount > 0 ? totalScore / scoreCount : 0;

    // Get top priority actions (deduplicated)
    const uniqueActions = [...new Set(priorityActions)].slice(0, 5);

    const processingTimeMs = Date.now() - startTime;

    logger.info("Full video analysis completed", {
      videoId: input.videoId,
      processingTimeMs,
      issueCount: allIssues.length,
      overallScore: overallScore.toFixed(2),
    });

    return {
      videoId: input.videoId,
      duration: input.duration,
      analyzedAt: new Date(),
      overallScore,
      categoryResults,
      allIssues,
      priorityActions: uniqueActions,
      processingTimeMs,
    };
  }

  // ==========================================================================
  // Quick Analysis Methods
  // ==========================================================================

  /**
   * Quick retention check - analyzes core concepts only
   */
  public async quickRetentionCheck(
    input: VideoAnalysisInput,
    options?: AnalysisOptions
  ): Promise<BaseAnalysisResponse> {
    // Auto-initialize from environment if not already done
    if (!this.isInitialized()) {
      this.initialize();
    }
    return this.analyzeCategory("core_concepts", input, options);
  }

  /**
   * Quick SEO check - analyzes SEO metadata only
   */
  public async quickSEOCheck(
    input: VideoAnalysisInput,
    options?: AnalysisOptions
  ): Promise<BaseAnalysisResponse> {
    // Auto-initialize from environment if not already done
    if (!this.isInitialized()) {
      this.initialize();
    }
    return this.analyzeCategory("seo_metadata", input, options);
  }

  /**
   * Production readiness check - validates against checklists
   */
  public async productionReadinessCheck(
    input: VideoAnalysisInput,
    options?: AnalysisOptions
  ): Promise<BaseAnalysisResponse> {
    // Auto-initialize from environment if not already done
    if (!this.isInitialized()) {
      this.initialize();
    }
    return this.analyzeCategory("checklists", input, options);
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Ensure service is initialized, throw if not
   */
  private ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new AppError(
        AppErrorType.API_KEY_INVALID,
        "Gemini service not initialized. Call initialize() with API key first."
      );
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

// Export singleton instance
export const geminiService = GeminiService.getInstance();

// Re-export types for convenience
export type { AnalysisOptions, CategorySchemaType, VideoAnalysisInput };
