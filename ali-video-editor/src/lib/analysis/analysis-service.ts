/**
 * Analysis Service
 *
 * Orchestrates the complete video analysis pipeline:
 * 1. Extract keyframes from video
 * 2. Combine with transcription
 * 3. Run all category analyzers via GeminiService
 * 4. Aggregate and score results
 *
 * Design Principles:
 * - SOLID: Single responsibility - orchestration only
 * - DRY: Reuses existing services (GeminiService, KeyframeExtractor)
 * - Modular: Easy to add new analysis steps
 * - Production-grade: Error handling, progress tracking
 *
 * @module analysis-service
 */

import {
    AnalysisConfig,
    AnalysisResult,
    ExtractedKeyframe,
    ProgressCallback,
    SamplingStrategy,
    TranscriptionResult,
} from "../../types";
import { CategorySchemaType } from "../../types/schemas";
import { geminiService } from "../ai/gemini-service";
import { KeyframeExtractor } from "../ai/keyframe-extractor";
import { logger } from "../logger";

// ============================================================================
// Analysis Service Class
// ============================================================================

/**
 * Analysis Service
 * Singleton service for orchestrating video analysis
 */
export class AnalysisService {
  private static instance: AnalysisService;

  private constructor() {
    logger.info("AnalysisService initialized");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  /**
   * Run complete analysis pipeline:
   * 1. Extract keyframes from video
   * 2. Combine with transcription (if available)
   * 3. Run all category analyzers via GeminiService
   * 4. Aggregate and score results
   *
   * @param videoPath - Path to the video file
   * @param transcription - Transcription result from Deepgram
   * @param config - Analysis configuration options
   * @param onProgress - Progress callback (0-100)
   * @returns Complete analysis result
   */
  async analyzeVideo(
    videoPath: string,
    transcription: TranscriptionResult,
    config: AnalysisConfig = {},
    onProgress?: ProgressCallback
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    logger.info("Starting video analysis pipeline", {
      videoId: transcription.videoId,
      config,
    });

    try {
      // Stage 1: Extract keyframes (5% - 20% progress)
      onProgress?.(5, "Extracting keyframes...");
      const keyframes = await this.extractKeyframes(videoPath, config.keyframeStrategy);

      onProgress?.(20, `Extracted ${keyframes.length} keyframes`);

      // Stage 2: Prepare analysis input with enhanced transcription (20% - 25% progress)
      onProgress?.(25, "Preparing analysis input...");

      // Import transcription formatter utilities
      const { formatTranscriptionForLLM, createSpeakerSummary, countUniqueSpeakers } = await import(
        "../transcription/transcription-formatter"
      );

      const lastSegment = transcription.segments[transcription.segments.length - 1];
      const duration =
        transcription.segments.length > 0 && lastSegment
          ? lastSegment.end
          : 0;

      // Prepare enhanced transcription data for LLM
      const transcriptionWithTimestamps = formatTranscriptionForLLM(transcription);
      const speakerCount = transcription.speakerCount || countUniqueSpeakers(transcription);
      const speakerSummary = createSpeakerSummary(transcription);
      
      // Prepare segment data for detailed analysis
      const transcriptionSegments = transcription.segments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        speaker: seg.speakerLabel || seg.speaker,
        text: seg.text,
      }));

      const analysisInput = {
        videoId: transcription.videoId,
        duration,
        transcription: transcription.text,
        // Enhanced transcription data for LLM
        transcriptionWithTimestamps,
        speakerCount,
        speakerSummary,
        transcriptionSegments,
        keyframes: keyframes.map((kf) => ({
          timestamp: kf.timestamp,
          base64Data: kf.base64Data,
          mimeType: kf.mimeType,
        })),
      };


      // Stage 3: Run Gemini analysis across all categories (25% - 90% progress)
      onProgress?.(30, "Analyzing with AI...");

      const fullAnalysis = await geminiService.analyzeVideo(
        analysisInput,
        {
          categories: config.categories as CategorySchemaType[] | undefined,
          includeKnowledgeBase: true,
        },
        (progress: number, message?: string) => {
          // Scale progress from 30% to 90%
          const scaledProgress = 30 + progress * 0.6;
          onProgress?.(scaledProgress, message);
        }
      );

      // Stage 4: Compile results (90% - 100% progress)
      onProgress?.(95, "Generating report...");

      const result: AnalysisResult = {
        videoId: transcription.videoId,
        keyframes,
        categoryResults: fullAnalysis.categoryResults,
        overallScore: fullAnalysis.overallScore,
        allIssues: fullAnalysis.allIssues,
        priorityActions: fullAnalysis.priorityActions,
        processingTimeMs: Date.now() - startTime,
      };

      onProgress?.(100, "Analysis complete");

      logger.info("Video analysis pipeline completed", {
        videoId: transcription.videoId,
        processingTimeMs: result.processingTimeMs,
        keyframeCount: keyframes.length,
        overallScore: result.overallScore,
      });

      return result;
    } catch (error) {
      logger.error("Video analysis pipeline failed", {
        videoId: transcription.videoId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Run analysis with pre-extracted keyframes (for re-analysis from history)
   * 
   * @param keyframes - Pre-extracted keyframes from previous analysis
   * @param transcription - Transcription result from Deepgram
   * @param config - Analysis configuration options
   * @param onProgress - Progress callback (0-100)
   * @returns Complete analysis result
   */
  async analyzeWithKeyframes(
    keyframes: ExtractedKeyframe[],
    transcription: TranscriptionResult,
    config: AnalysisConfig = {},
    onProgress?: ProgressCallback
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    logger.info("Starting analysis with pre-extracted keyframes", {
      videoId: transcription.videoId,
      keyframeCount: keyframes.length,
      config,
    });

    try {
      onProgress?.(5, "Using saved keyframes...");
      onProgress?.(20, `Using ${keyframes.length} pre-extracted keyframes`);

      // Prepare analysis input with enhanced transcription
      onProgress?.(25, "Preparing analysis input...");

      const { formatTranscriptionForLLM, createSpeakerSummary, countUniqueSpeakers } = await import(
        "../transcription/transcription-formatter"
      );

      const lastSegment = transcription.segments[transcription.segments.length - 1];
      const duration =
        transcription.segments.length > 0 && lastSegment
          ? lastSegment.end
          : 0;

      const transcriptionWithTimestamps = formatTranscriptionForLLM(transcription);
      const speakerCount = transcription.speakerCount || countUniqueSpeakers(transcription);
      const speakerSummary = createSpeakerSummary(transcription);
      
      const transcriptionSegments = transcription.segments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        speaker: seg.speakerLabel || seg.speaker,
        text: seg.text,
      }));

      const analysisInput = {
        videoId: transcription.videoId,
        duration,
        transcription: transcription.text,
        transcriptionWithTimestamps,
        speakerCount,
        speakerSummary,
        transcriptionSegments,
        keyframes: keyframes.map((kf) => ({
          timestamp: kf.timestamp,
          base64Data: kf.base64Data,
          mimeType: kf.mimeType,
        })),
      };

      // Run Gemini analysis
      onProgress?.(30, "Analyzing with AI...");

      const fullAnalysis = await geminiService.analyzeVideo(
        analysisInput,
        {
          categories: config.categories as CategorySchemaType[] | undefined,
          includeKnowledgeBase: true,
        },
        (progress: number, message?: string) => {
          const scaledProgress = 30 + progress * 0.6;
          onProgress?.(scaledProgress, message);
        }
      );

      onProgress?.(95, "Generating report...");

      const result: AnalysisResult = {
        videoId: transcription.videoId,
        keyframes,
        categoryResults: fullAnalysis.categoryResults,
        overallScore: fullAnalysis.overallScore,
        allIssues: fullAnalysis.allIssues,
        priorityActions: fullAnalysis.priorityActions,
        processingTimeMs: Date.now() - startTime,
      };

      onProgress?.(100, "Analysis complete");

      logger.info("Analysis with keyframes completed", {
        videoId: transcription.videoId,
        processingTimeMs: result.processingTimeMs,
        keyframeCount: keyframes.length,
        overallScore: result.overallScore,
      });

      return result;
    } catch (error) {
      logger.error("Analysis with keyframes failed", {
        videoId: transcription.videoId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Extract keyframes from video using KeyframeExtractor
   */
  private async extractKeyframes(
    videoPath: string,
    strategy?: SamplingStrategy
  ): Promise<ExtractedKeyframe[]> {
    const defaultStrategy: SamplingStrategy = {
      type: "uniform",
      count: 10,
    };

    const extractor = new KeyframeExtractor({
      format: "jpeg",
      quality: 85,
      maxWidth: 1280,
      maxHeight: 720,
    });

    try {
      const result = await extractor.extractKeyframes(videoPath, strategy || defaultStrategy);
      return result.keyframes;
    } catch (error) {
      logger.error("Keyframe extraction failed", {
        videoPath,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
    // Note: KeyframeExtractor handles cleanup automatically
  }
}

// ============================================================================
// Exports
// ============================================================================

// Export singleton instance
export const analysisService = AnalysisService.getInstance();
