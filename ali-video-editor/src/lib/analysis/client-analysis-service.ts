/**
 * Client-side Analysis Service
 *
 * Provides a client-safe interface to the analysis pipeline.
 * Calls the server API route via FormData.
 * 
 * Supports two modes:
 * 1. With video file: For new video analysis (extracts keyframes on server)
 * 2. With keyframes: For re-analysis from history (uses pre-extracted keyframes)
 *
 * @module client-analysis-service
 */

import {
    AnalysisConfig,
    AnalysisResult,
    ExtractedKeyframe,
    ProgressCallback,
    TranscriptionResult,
} from "../../types";

// ============================================================================
// Types
// ============================================================================

interface AnalyzeResponse extends AnalysisResult {
  error?: string;
}

/**
 * Analysis source - either video file or pre-extracted keyframes
 */
export type AnalysisSource = 
  | { type: "video"; file: File }
  | { type: "keyframes"; keyframes: ExtractedKeyframe[] };

// ============================================================================
// Client Analysis Service
// ============================================================================

/**
 * Client-side Analysis Service
 * Singleton service for orchestrating video analysis via API
 */
export class ClientAnalysisService {
  private static instance: ClientAnalysisService;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ClientAnalysisService {
    if (!ClientAnalysisService.instance) {
      ClientAnalysisService.instance = new ClientAnalysisService();
    }
    return ClientAnalysisService.instance;
  }

  /**
   * Run complete analysis pipeline via API using video file
   * 
   * @param videoFile - The video File object to analyze
   * @param transcription - Transcription result from Deepgram
   * @param config - Analysis configuration options
   * @param onProgress - Progress callback (0-100)
   * @param apiKeys - API keys for Deepgram and Gemini
   * @returns Complete analysis result
   */
  async analyzeVideo(
    videoFile: File,
    transcription: TranscriptionResult,
    config: AnalysisConfig = {},
    onProgress?: ProgressCallback,
    apiKeys?: { deepgramApiKey?: string; geminiApiKey?: string }
  ): Promise<AnalysisResult> {
    return this.analyze(
      { type: "video", file: videoFile },
      transcription,
      config,
      onProgress,
      apiKeys
    );
  }

  /**
   * Run analysis with pre-extracted keyframes (for re-analysis from history)
   * 
   * @param keyframes - Pre-extracted keyframes from previous analysis
   * @param transcription - Transcription result from Deepgram
   * @param config - Analysis configuration options
   * @param onProgress - Progress callback (0-100)
   * @param apiKeys - API keys for Deepgram and Gemini
   * @returns Complete analysis result
   */
  async analyzeWithKeyframes(
    keyframes: ExtractedKeyframe[],
    transcription: TranscriptionResult,
    config: AnalysisConfig = {},
    onProgress?: ProgressCallback,
    apiKeys?: { deepgramApiKey?: string; geminiApiKey?: string }
  ): Promise<AnalysisResult> {
    return this.analyze(
      { type: "keyframes", keyframes },
      transcription,
      config,
      onProgress,
      apiKeys
    );
  }

  /**
   * Internal method to run analysis with either video file or keyframes
   */
  private async analyze(
    source: AnalysisSource,
    transcription: TranscriptionResult,
    config: AnalysisConfig = {},
    onProgress?: ProgressCallback,
    apiKeys?: { deepgramApiKey?: string; geminiApiKey?: string }
  ): Promise<AnalysisResult> {
    const isVideoMode = source.type === "video";
    
    // Indicate start
    onProgress?.(5, isVideoMode ? "Uploading video for analysis..." : "Preparing analysis with saved keyframes...");

    try {
      // Build FormData
      const formData = new FormData();
      
      if (source.type === "video") {
        formData.append("video", source.file);
      } else {
        formData.append("keyframes", JSON.stringify(source.keyframes));
      }
      
      formData.append("transcription", JSON.stringify(transcription));
      formData.append("config", JSON.stringify(config));
      
      if (apiKeys?.geminiApiKey) {
        formData.append("geminiApiKey", apiKeys.geminiApiKey);
      }
      if (apiKeys?.deepgramApiKey) {
        formData.append("deepgramApiKey", apiKeys.deepgramApiKey);
      }

      onProgress?.(15, "Processing on server...");

      // Make API call to server-side analysis
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        // Note: Do NOT set Content-Type header for FormData - browser sets it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: string }).error ?? `Analysis failed: ${response.statusText}`
        );
      }

      // Update progress - analysis complete
      onProgress?.(95, "Processing results...");

      const result = (await response.json()) as AnalyzeResponse;

      if (result.error) {
        throw new Error(result.error);
      }

      onProgress?.(100, "Analysis complete");

      return result;
    } catch (error) {
      throw error instanceof Error ? error : new Error("Analysis failed");
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

// Export singleton instance
export const clientAnalysisService = ClientAnalysisService.getInstance();
