/**
 * Browser History Service
 *
 * IndexedDB-based storage for browser environments
 * Provides the same API as historyService but works without native Node.js modules
 */

import type {
  AIInsights,
  AnalysisResult,
  ChapterMarker,
  ExtractedKeyframe,
  RetentionAnalysis,
  TimelineSegment,
  TranscriptionResult,
  VideoMetadata,
} from "../../types";

// Types for stored data
export interface StoredVideo {
  id: string;
  filename: string;
  fileSize: number;
  duration: number;
  width: number;
  height: number;
  uploadedAt: Date;
  videoBlob?: Blob; // Store the actual video file (optional)
}

export interface StoredTranscription {
  id: string;
  videoId: string;
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
  createdAt: Date;
}

/** Stored keyframe - same as ExtractedKeyframe but explicitly typed for storage */
export interface StoredKeyframe {
  timestamp: number;
  base64Data: string;
  mimeType: "image/jpeg" | "image/png";
  width: number;
  height: number;
  sizeBytes: number;
}

export interface StoredAnalysis {
  id: string;
  videoId: string;
  transcriptionId: string | null;
  overallScore: number;
  summary: string;
  retentionAnalysis?: RetentionAnalysis;
  aiInsights?: AIInsights;
  /** Cached keyframes from analysis */
  keyframes?: StoredKeyframe[];
  /** Full analysis result for restoration */
  analysisResult?: AnalysisResult;
  /** Timeline segments */
  timelineSegments?: TimelineSegment[];
  /** Chapter markers */
  chapterMarkers?: ChapterMarker[];
  createdAt: Date;
}

/** Stored thumbnail for persistence */
export interface StoredThumbnail {
  /** Unique thumbnail ID */
  id: string;
  /** Optional link to video analysis */
  videoId?: string;
  /** Thumbnail image data (base64 PNG) */
  imageData: string;
  /** Title text used for generation */
  titleText: string;
  /** Topic used for generation */
  topic: string;
  /** Style used (HIGH_ENERGY, MINIMAL_TECH, etc.) */
  style: string;
  /** Model used for generation */
  model: string;
  /** Strategy used (SPECIALIZED or FALLBACK) */
  strategy: string;
  /** Seed used for reproducibility */
  seed: number;
  /** When the thumbnail was generated */
  generatedAt: Date;
}

export interface HistoryItem {
  id: string;
  videoId: string;
  filename: string;
  duration: number;
  overallScore: number;
  summary: string;
  createdAt: Date;
  hasVideo: boolean;
  hasTranscription: boolean;
  hasKeyframes: boolean;
  hasAnalysisResult: boolean;
}

export interface HistoryDetail extends HistoryItem {
  transcription?: StoredTranscription;
  retentionAnalysis?: RetentionAnalysis;
  aiInsights?: AIInsights;
  keyframes?: StoredKeyframe[];
  analysisResult?: AnalysisResult;
  timelineSegments?: TimelineSegment[];
  chapterMarkers?: ChapterMarker[];
  videoBlob?: Blob;
}

const DB_NAME = "videocopilot_history";
const DB_VERSION = 2; // Incremented to add thumbnails store

class BrowserHistoryService {
  private static instance: BrowserHistoryService;
  private db: IDBDatabase | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): BrowserHistoryService {
    if (!BrowserHistoryService.instance) {
      BrowserHistoryService.instance = new BrowserHistoryService();
    }
    return BrowserHistoryService.instance;
  }

  /**
   * Initialize IndexedDB database
   */
  async initialize(): Promise<void> {
    if (this.initialized && this.db) {
      return;
    }

    // Prevent multiple initialization attempts
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        console.warn("IndexedDB not available");
        reject(new Error("IndexedDB not available"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        // eslint-disable-next-line no-console
        console.error("Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        // eslint-disable-next-line no-console
        console.log("IndexedDB initialized successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // eslint-disable-next-line no-console
        console.log(`Upgrading IndexedDB from version ${oldVersion} to ${DB_VERSION}`);

        try {
          // Version 1: Create initial stores (videos, transcriptions, analyses)
          if (oldVersion < 1) {
            // Videos store
            if (!db.objectStoreNames.contains("videos")) {
              const videoStore = db.createObjectStore("videos", { keyPath: "id" });
              videoStore.createIndex("filename", "filename", { unique: false });
              videoStore.createIndex("uploadedAt", "uploadedAt", { unique: false });
              // eslint-disable-next-line no-console
              console.log("Created 'videos' store");
            }

            // Transcriptions store
            if (!db.objectStoreNames.contains("transcriptions")) {
              const transcriptionStore = db.createObjectStore("transcriptions", { keyPath: "id" });
              transcriptionStore.createIndex("videoId", "videoId", { unique: false });
              // eslint-disable-next-line no-console
              console.log("Created 'transcriptions' store");
            }

            // Analyses store
            if (!db.objectStoreNames.contains("analyses")) {
              const analysisStore = db.createObjectStore("analyses", { keyPath: "id" });
              analysisStore.createIndex("videoId", "videoId", { unique: false });
              analysisStore.createIndex("createdAt", "createdAt", { unique: false });
              // eslint-disable-next-line no-console
              console.log("Created 'analyses' store");
            }
          }

          // Version 2: Add thumbnails store
          if (oldVersion < 2) {
            if (!db.objectStoreNames.contains("thumbnails")) {
              const thumbnailStore = db.createObjectStore("thumbnails", { keyPath: "id" });
              thumbnailStore.createIndex("videoId", "videoId", { unique: false });
              thumbnailStore.createIndex("generatedAt", "generatedAt", { unique: false });
              // eslint-disable-next-line no-console
              console.log("Created 'thumbnails' store (v2 migration)");
            }
          }

          // eslint-disable-next-line no-console
          console.log(`IndexedDB upgrade to version ${DB_VERSION} completed successfully`);
        } catch (upgradeError) {
          // eslint-disable-next-line no-console
          console.error("IndexedDB upgrade failed:", upgradeError);
          // Note: We can't reject here as the upgrade transaction will abort
          // The error will be caught by onerror handler
        }
      };
    });

    return this.initPromise;
  }

  isInitialized(): boolean {
    return this.initialized && this.db !== null;
  }

  private getStore(storeName: string, mode: IDBTransactionMode = "readonly"): IDBObjectStore {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  /**
   * Save video metadata and optionally the video blob
   */
  async saveVideo(metadata: VideoMetadata, videoBlob?: Blob): Promise<string> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("videos", "readwrite");
      const video: StoredVideo = {
        id: metadata.id,
        filename: metadata.filename,
        fileSize: metadata.fileSize,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        uploadedAt: new Date(),
        videoBlob,
      };

      const request = store.put(video);
      request.onsuccess = () => resolve(metadata.id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save transcription result
   */
  async saveTranscription(transcription: TranscriptionResult): Promise<string> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("transcriptions", "readwrite");
      const stored: StoredTranscription = {
        id: transcription.id,
        videoId: transcription.videoId,
        text: transcription.text,
        segments: transcription.segments.map((s) => ({
          start: s.start,
          end: s.end,
          text: s.text,
          confidence: s.confidence,
        })),
        createdAt: new Date(),
      };

      const request = store.put(stored);
      request.onsuccess = () => resolve(transcription.id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save analysis result with retention, insights, keyframes, and full analysis
   */
  async saveAnalysis(
    videoId: string,
    transcriptionId: string | null,
    overallScore: number,
    summary: string,
    retentionAnalysis?: RetentionAnalysis,
    aiInsights?: AIInsights,
    keyframes?: ExtractedKeyframe[],
    analysisResult?: AnalysisResult,
    timelineSegments?: TimelineSegment[],
    chapterMarkers?: ChapterMarker[]
  ): Promise<string> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("analyses", "readwrite");
      const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Convert keyframes to stored format
      const storedKeyframes: StoredKeyframe[] | undefined = keyframes?.map((kf) => ({
        timestamp: kf.timestamp,
        base64Data: kf.base64Data,
        mimeType: kf.mimeType,
        width: kf.width,
        height: kf.height,
        sizeBytes: kf.sizeBytes,
      }));

      const analysis: StoredAnalysis = {
        id,
        videoId,
        transcriptionId,
        overallScore,
        summary,
        retentionAnalysis,
        aiInsights,
        keyframes: storedKeyframes,
        analysisResult,
        timelineSegments,
        chapterMarkers,
        createdAt: new Date(),
      };

      const request = store.put(analysis);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get history list for UI
   */
  async getHistory(): Promise<{ items: HistoryItem[]; total: number }> {
    await this.initialize();

    // First, get all analyses synchronously (no await inside cursor)
    const analyses = await this.getAllFromStore<StoredAnalysis>("analyses");

    // Sort by createdAt descending (newest first)
    analyses.sort((a, b) => {
      const dateA =
        a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const dateB =
        b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    // Now fetch video and transcription data for each analysis
    const items: HistoryItem[] = [];
    for (const analysis of analyses) {
      try {
        const video = await this.getVideo(analysis.videoId);
        const transcription = analysis.transcriptionId
          ? await this.getTranscription(analysis.transcriptionId)
          : null;

        items.push({
          id: analysis.id,
          videoId: analysis.videoId,
          filename: video?.filename || "Unknown",
          duration: video?.duration || 0,
          overallScore: analysis.overallScore,
          summary: analysis.summary,
          createdAt: analysis.createdAt,
          hasVideo: !!video?.videoBlob,
          hasTranscription: !!transcription,
          hasKeyframes: !!(analysis.keyframes && analysis.keyframes.length > 0),
          hasAnalysisResult: !!analysis.analysisResult,
        });
      } catch {
        // Skip items with missing data
      }
    }

    return { items, total: items.length };
  }

  /**
   * Get video by ID
   */
  async getVideo(videoId: string): Promise<StoredVideo | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("videos");
      const request = store.get(videoId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get transcription by ID
   */
  async getTranscription(transcriptionId: string): Promise<StoredTranscription | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("transcriptions");
      const request = store.get(transcriptionId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get transcription by video ID
   */
  async getTranscriptionByVideoId(videoId: string): Promise<StoredTranscription | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("transcriptions");
      const index = store.index("videoId");
      const request = index.get(videoId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get full detail for history item
   */
  async getHistoryDetail(analysisId: string): Promise<HistoryDetail | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("analyses");
      const request = store.get(analysisId);

      request.onsuccess = async () => {
        const analysis = request.result as StoredAnalysis | undefined;
        if (!analysis) {
          resolve(null);
          return;
        }

        try {
          const video = await this.getVideo(analysis.videoId);
          const transcription = analysis.transcriptionId
            ? await this.getTranscription(analysis.transcriptionId)
            : undefined;

          resolve({
            id: analysis.id,
            videoId: analysis.videoId,
            filename: video?.filename || "Unknown",
            duration: video?.duration || 0,
            overallScore: analysis.overallScore,
            summary: analysis.summary,
            createdAt: analysis.createdAt,
            hasVideo: !!video?.videoBlob,
            hasTranscription: !!transcription,
            hasKeyframes: !!(analysis.keyframes && analysis.keyframes.length > 0),
            hasAnalysisResult: !!analysis.analysisResult,
            transcription: transcription || undefined,
            retentionAnalysis: analysis.retentionAnalysis,
            aiInsights: analysis.aiInsights,
            keyframes: analysis.keyframes,
            analysisResult: analysis.analysisResult,
            timelineSegments: analysis.timelineSegments,
            chapterMarkers: analysis.chapterMarkers,
            videoBlob: video?.videoBlob,
          });
        } catch (err) {
          reject(err);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<{
    totalVideos: number;
    totalAnalyses: number;
    averageScore: number;
  }> {
    await this.initialize();

    const videos = await this.countStore("videos");
    const analyses = await this.getAllFromStore<StoredAnalysis>("analyses");

    const totalScore = analyses.reduce((sum, a) => sum + a.overallScore, 0);
    const averageScore = analyses.length > 0 ? totalScore / analyses.length : 0;

    return {
      totalVideos: videos,
      totalAnalyses: analyses.length,
      averageScore,
    };
  }

  private async countStore(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================================================
  // Thumbnail Methods
  // ============================================================================

  /**
   * Save a generated thumbnail
   */
  async saveThumbnail(thumbnail: StoredThumbnail): Promise<string> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("thumbnails", "readwrite");
      const request = store.put(thumbnail);
      request.onsuccess = () => resolve(thumbnail.id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all thumbnails, optionally limited
   */
  async getThumbnails(limit?: number): Promise<StoredThumbnail[]> {
    await this.initialize();

    const thumbnails = await this.getAllFromStore<StoredThumbnail>("thumbnails");

    // Sort by generatedAt descending (newest first)
    thumbnails.sort((a, b) => {
      const dateA =
        a.generatedAt instanceof Date ? a.generatedAt.getTime() : new Date(a.generatedAt).getTime();
      const dateB =
        b.generatedAt instanceof Date ? b.generatedAt.getTime() : new Date(b.generatedAt).getTime();
      return dateB - dateA;
    });

    return limit ? thumbnails.slice(0, limit) : thumbnails;
  }

  /**
   * Get thumbnails by video ID
   */
  async getThumbnailsByVideoId(videoId: string): Promise<StoredThumbnail[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("thumbnails");
      const index = store.index("videoId");
      const request = index.getAll(videoId);

      request.onsuccess = () => {
        const thumbnails = request.result || [];
        // Sort by generatedAt descending
        thumbnails.sort((a, b) => {
          const dateA =
            a.generatedAt instanceof Date
              ? a.generatedAt.getTime()
              : new Date(a.generatedAt).getTime();
          const dateB =
            b.generatedAt instanceof Date
              ? b.generatedAt.getTime()
              : new Date(b.generatedAt).getTime();
          return dateB - dateA;
        });
        resolve(thumbnails);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a thumbnail by ID
   */
  async deleteThumbnail(thumbnailId: string): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("thumbnails", "readwrite");
      const request = store.delete(thumbnailId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete analysis from history
   */
  async deleteAnalysis(analysisId: string): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("analyses", "readwrite");
      const request = store.delete(analysisId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get analysis by video ID (to check if history entry exists for a video)
   */
  async getAnalysisByVideoId(videoId: string): Promise<StoredAnalysis | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("analyses");
      const index = store.index("videoId");
      const request = index.get(videoId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if a history entry exists for a given video ID
   */
  async hasHistoryForVideo(videoId: string): Promise<boolean> {
    const analysis = await this.getAnalysisByVideoId(videoId);
    return analysis !== null;
  }

  /**
   * Save analysis from existing session data (when user wants to save cached session to history)
   * This is useful when session data exists but no history entry (e.g., after deletion)
   */
  async saveAnalysisFromSession(
    videoId: string,
    filename: string,
    duration: number,
    fileSize: number,
    transcriptionId: string | null,
    overallScore: number,
    summary: string,
    retentionAnalysis?: RetentionAnalysis,
    aiInsights?: AIInsights,
    keyframes?: ExtractedKeyframe[],
    analysisResult?: AnalysisResult,
    timelineSegments?: TimelineSegment[],
    chapterMarkers?: ChapterMarker[]
  ): Promise<string> {
    await this.initialize();

    // Save video metadata if not exists
    const existingVideo = await this.getVideo(videoId);
    if (!existingVideo) {
      await this.saveVideo({
        id: videoId,
        filename,
        filepath: "",
        fileSize,
        duration,
        width: 0,
        height: 0,
        codec: "",
        audioCodec: "",
        frameRate: 0,
        bitrate: 0,
        uploadedAt: new Date(),
        uploadProgress: 100,
        estimatedProcessingTime: 0,
      });
    }

    // Save analysis
    return this.saveAnalysis(
      videoId,
      transcriptionId,
      overallScore,
      summary,
      retentionAnalysis,
      aiInsights,
      keyframes,
      analysisResult,
      timelineSegments,
      chapterMarkers
    );
  }

  /**
   * Clear all data (for testing/debugging)
   */
  async clearAll(): Promise<void> {
    await this.initialize();

    const stores = ["videos", "transcriptions", "analyses", "thumbnails"];
    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const store = this.getStore(storeName, "readwrite");
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

export const browserHistoryService = BrowserHistoryService.getInstance();
export default browserHistoryService;
