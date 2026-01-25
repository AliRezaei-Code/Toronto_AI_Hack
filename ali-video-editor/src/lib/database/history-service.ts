/**
 * History Service
 *
 * High-level service for history management
 * Provides a unified API for saving, retrieving, and managing video analysis history
 */

import type { TranscriptionResult, VideoMetadata } from "../../types";
import type { FullVideoAnalysis } from "../ai/gemini-service";
import { database } from "./database";
import { analysisRepository } from "./repositories/analysis-repository";
import { historyRepository } from "./repositories/history-repository";
import { transcriptionRepository } from "./repositories/transcription-repository";
import { videoRepository } from "./repositories/video-repository";
import type { HistoryQuery } from "./schema";

/**
 * History Service
 * Singleton service for history management
 *
 * Use this from UI components - it provides a high-level API that abstracts
 * away the complexity of multiple repositories and database operations.
 */
class HistoryService {
  private static instance: HistoryService;
  private initialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  /**
   * Initialize database - call on app startup
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }
    database.initialize();
    this.initialized = true;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Save video metadata (call after upload)
   * @param metadata - Video metadata from upload
   * @returns Video ID
   */
  saveVideo(metadata: VideoMetadata): string {
    return videoRepository.createVideo(metadata);
  }

  /**
   * Save transcription result (call after transcription)
   * @param transcription - Transcription result from Deepgram
   * @returns Transcription ID
   */
  saveTranscription(transcription: TranscriptionResult): string {
    return transcriptionRepository.saveTranscription(transcription);
  }

  /**
   * Save complete analysis (call after Gemini analysis)
   * @param videoId - Video ID
   * @param transcriptionId - Transcription ID (or null if no transcription)
   * @param analysis - Full video analysis result
   * @returns Session ID
   */
  saveAnalysis(
    videoId: string,
    transcriptionId: string | null,
    analysis: FullVideoAnalysis
  ): string {
    return analysisRepository.saveAnalysis(videoId, transcriptionId, analysis);
  }

  /**
   * Get history list for UI
   * @param query - Query parameters (search, sort, pagination)
   * @returns Paginated list of analyses
   */
  getHistory(query?: HistoryQuery) {
    return historyRepository.getHistoryList(query);
  }

  /**
   * Get full detail for history item
   * @param sessionId - Analysis session ID
   * @returns Full detail including transcription, category results, and issues
   */
  getHistoryDetail(sessionId: string) {
    return historyRepository.getHistoryDetail(sessionId);
  }

  /**
   * Get dashboard statistics
   * @returns Statistics including total videos, analyses, average score, and recent analyses
   */
  getStats() {
    return historyRepository.getStats();
  }

  /**
   * Search analyses by filename
   * @param searchTerm - Search term
   * @param limit - Maximum number of results
   * @returns Matching analyses
   */
  searchAnalyses(searchTerm: string, limit?: number) {
    return historyRepository.searchAnalyses(searchTerm, limit);
  }

  /**
   * Delete analysis from history
   * @param sessionId - Analysis session ID to delete
   */
  deleteAnalysis(sessionId: string): void {
    analysisRepository.deleteAnalysis(sessionId);
  }

  /**
   * Export analysis as JSON file
   * @param sessionId - Analysis session ID
   * @returns JSON string of the full analysis
   */
  exportAnalysis(sessionId: string): string {
    const detail = historyRepository.getHistoryDetail(sessionId);
    if (!detail) {
      throw new Error("Analysis not found");
    }
    return JSON.stringify(detail, null, 2);
  }

  /**
   * Cleanup on app shutdown
   */
  shutdown(): void {
    database.close();
    this.initialized = false;
  }

  /**
   * Get database path (for debugging)
   * @returns Path to the database file
   */
  getDatabasePath(): string | null {
    return database.getPath();
  }
}

// ============================================================================
// Exports
// ============================================================================

export const historyService = HistoryService.getInstance();
export default historyService;
