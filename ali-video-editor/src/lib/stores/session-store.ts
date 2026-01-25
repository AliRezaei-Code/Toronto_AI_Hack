/**
 * Session Store
 *
 * Zustand store with IndexedDB persistence for current session state.
 * Maintains state across tab navigation and page transitions.
 *
 * Design:
 * - Uses zustand/persist with IndexedDB for durable storage
 * - Handles File objects via separate blob storage
 * - Provides restoration from history
 *
 * @module session-store
 */

import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import type {
  AIInsights,
  AnalysisResult,
  ChapterMarker,
  RetentionAnalysis,
  TimelineSegment,
  TranscriptionResult,
  VideoUploadSession,
} from "../../types";
import type { HistoryDetail } from "../database/browser-history-service";

// ============================================================================
// Types
// ============================================================================

export type AppStage = "upload" | "processing" | "results";
export type NavigationTab = "upload" | "transcription" | "retention" | "insights" | "thumbnails" | "history";

export interface SessionState {
  // Session identification
  sessionId: string | null;

  // Video state
  currentVideoId: string | null;
  selectedFileName: string | null;
  selectedFileSize: number | null;
  selectedFileType: string | null;
  videoObjectUrl: string | null;
  uploadSession: VideoUploadSession | null;

  // Analysis state
  transcription: TranscriptionResult | null;
  analysisResult: AnalysisResult | null;
  timelineSegments: TimelineSegment[];
  chapterMarkers: ChapterMarker[];
  retentionAnalysis: RetentionAnalysis | null;
  aiInsights: AIInsights | null;

  // UI state
  stage: AppStage;
  activeTab: NavigationTab;
  currentTime: number;

  // Timestamps
  createdAt: string | null;
  lastUpdatedAt: string | null;
}

export interface SessionActions {
  // Video actions
  setVideo: (file: File, session: VideoUploadSession) => void;
  clearVideo: () => void;

  // Analysis actions
  setTranscription: (transcription: TranscriptionResult) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setTimelineData: (segments: TimelineSegment[], chapters: ChapterMarker[]) => void;
  setRetentionAnalysis: (analysis: RetentionAnalysis) => void;
  setAiInsights: (insights: AIInsights) => void;

  // UI actions
  setStage: (stage: AppStage) => void;
  setActiveTab: (tab: NavigationTab) => void;
  setCurrentTime: (time: number) => void;

  // Session management
  restoreFromHistory: (detail: HistoryDetail) => Promise<void>;
  reset: () => void;
  getVideoFile: () => File | null;
}

export type SessionStore = SessionState & SessionActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: SessionState = {
  sessionId: null,
  currentVideoId: null,
  selectedFileName: null,
  selectedFileSize: null,
  selectedFileType: null,
  videoObjectUrl: null,
  uploadSession: null,
  transcription: null,
  analysisResult: null,
  timelineSegments: [],
  chapterMarkers: [],
  retentionAnalysis: null,
  aiInsights: null,
  stage: "upload",
  activeTab: "upload" as NavigationTab,
  currentTime: 0,
  createdAt: null,
  lastUpdatedAt: null,
};

// ============================================================================
// IndexedDB Storage for Zustand
// ============================================================================

const DB_NAME = "videocopilot_session";
const DB_VERSION = 1;
const STORE_NAME = "session";

/**
 * Custom IndexedDB storage for zustand persist
 */
const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined") {
      return null;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn("IndexedDB error, falling back to null");
        resolve(null);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(STORE_NAME, "readonly");
          const store = tx.objectStore(STORE_NAME);
          const getRequest = store.get(name);

          getRequest.onsuccess = () => {
            resolve(getRequest.result || null);
          };

          getRequest.onerror = () => {
            resolve(null);
          };
        } catch {
          resolve(null);
        }
      };
    });
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === "undefined") {
      return;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn("IndexedDB error, skipping persist");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          store.put(value, name);

          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      };
    });
  },

  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined") {
      return;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => resolve();

      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          store.delete(name);

          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      };
    });
  },
};

// ============================================================================
// In-memory File Storage (Files can't be serialized to IndexedDB directly)
// ============================================================================

let currentVideoFile: File | null = null;

// ============================================================================
// Store Creation
// ============================================================================

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Video actions
      setVideo: (file: File, session: VideoUploadSession) => {
        const state = get();

        // Clean up existing video URL if present
        if (state.videoObjectUrl) {
          URL.revokeObjectURL(state.videoObjectUrl);
        }

        // Store file in memory (can't persist to IndexedDB)
        currentVideoFile = file;

        // Create object URL for video playback
        const objectUrl = URL.createObjectURL(file);

        // IMPORTANT: Clear all analysis data when loading a new video
        // This prevents stale data from a previous session being shown
        set({
          sessionId: session.id,
          currentVideoId: session.metadata.id,
          selectedFileName: file.name,
          selectedFileSize: file.size,
          selectedFileType: file.type,
          videoObjectUrl: objectUrl,
          uploadSession: session,
          // Clear analysis state for the new video
          transcription: null,
          analysisResult: null,
          timelineSegments: [],
          chapterMarkers: [],
          retentionAnalysis: null,
          aiInsights: null,
          // Reset to upload stage
          stage: "upload",
          activeTab: "upload",
          currentTime: 0,
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      clearVideo: () => {
        const state = get();
        // Revoke object URL to free memory
        if (state.videoObjectUrl) {
          URL.revokeObjectURL(state.videoObjectUrl);
        }
        currentVideoFile = null;

        set({
          currentVideoId: null,
          selectedFileName: null,
          selectedFileSize: null,
          selectedFileType: null,
          videoObjectUrl: null,
          uploadSession: null,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      // Analysis actions
      setTranscription: (transcription: TranscriptionResult) => {
        set({
          transcription,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      setAnalysisResult: (result: AnalysisResult) => {
        set({
          analysisResult: result,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      setTimelineData: (segments: TimelineSegment[], chapters: ChapterMarker[]) => {
        set({
          timelineSegments: segments,
          chapterMarkers: chapters,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      setRetentionAnalysis: (analysis: RetentionAnalysis) => {
        set({
          retentionAnalysis: analysis,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      setAiInsights: (insights: AIInsights) => {
        set({
          aiInsights: insights,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      // UI actions
      setStage: (stage: AppStage) => {
        set({ stage, lastUpdatedAt: new Date().toISOString() });
      },

      setActiveTab: (tab: NavigationTab) => {
        set({ activeTab: tab, lastUpdatedAt: new Date().toISOString() });
      },

      setCurrentTime: (time: number) => {
        set({ currentTime: time });
      },

      // Session management
      restoreFromHistory: async (detail: HistoryDetail) => {
        const state = get();

        // Clean up existing video URL
        if (state.videoObjectUrl) {
          URL.revokeObjectURL(state.videoObjectUrl);
        }

        let videoObjectUrl: string | null = null;

        // If history has video blob, create object URL
        if (detail.videoBlob) {
          videoObjectUrl = URL.createObjectURL(detail.videoBlob);

          // Create File from Blob for compatibility
          currentVideoFile = new File([detail.videoBlob], detail.filename, {
            type: "video/mp4",
          });
        } else {
          // No video file available
          currentVideoFile = null;
        }

        // Restore transcription if available
        let transcription: TranscriptionResult | null = null;
        if (detail.transcription) {
          transcription = {
            id: detail.transcription.id,
            videoId: detail.transcription.videoId,
            text: detail.transcription.text,
            segments: detail.transcription.segments.map((seg) => ({
              text: seg.text,
              start: seg.start,
              end: seg.end,
              confidence: seg.confidence,
              words: [], // Words not stored in history, provide empty array
              speaker: undefined,
              speakerLabel: undefined,
            })),
            confidence: 0,
            language: "en-US",
            processingDuration: 0,
            createdAt: detail.transcription.createdAt,
          };
        }

        // Restore analysis result if available (includes keyframes)
        const analysisResult = detail.analysisResult || null;

        // Restore timeline data
        const timelineSegments = detail.timelineSegments || [];
        const chapterMarkers = detail.chapterMarkers || [];

        // Determine the appropriate stage and tab based on what data is available
        // If we have full analysis, go straight to results
        const hasFullAnalysis = !!(detail.retentionAnalysis || detail.aiInsights || analysisResult);
        const stage = hasFullAnalysis ? "results" : (transcription ? "results" : "upload");
        const activeTab = hasFullAnalysis ? "retention" : (transcription ? "transcription" : "upload");

        set({
          sessionId: `restored-${detail.id}`,
          currentVideoId: detail.videoId,
          selectedFileName: detail.filename,
          selectedFileSize: null,
          selectedFileType: "video/mp4",
          videoObjectUrl,
          uploadSession: null, // Original session not available
          transcription,
          analysisResult,
          timelineSegments,
          chapterMarkers,
          retentionAnalysis: detail.retentionAnalysis || null,
          aiInsights: detail.aiInsights || null,
          stage,
          activeTab,
          currentTime: 0,
          createdAt: typeof detail.createdAt === 'string' ? detail.createdAt : detail.createdAt.toISOString(),
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      reset: () => {
        const state = get();

        // Clean up video URL
        if (state.videoObjectUrl) {
          URL.revokeObjectURL(state.videoObjectUrl);
        }

        // Clear file reference
        currentVideoFile = null;

        set({
          ...initialState,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      getVideoFile: () => {
        return currentVideoFile;
      },
    }),
    {
      name: "session-storage",
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        // Only persist serializable state
        sessionId: state.sessionId,
        currentVideoId: state.currentVideoId,
        selectedFileName: state.selectedFileName,
        selectedFileSize: state.selectedFileSize,
        selectedFileType: state.selectedFileType,
        uploadSession: state.uploadSession,
        transcription: state.transcription,
        analysisResult: state.analysisResult,
        timelineSegments: state.timelineSegments,
        chapterMarkers: state.chapterMarkers,
        retentionAnalysis: state.retentionAnalysis,
        aiInsights: state.aiInsights,
        stage: state.stage,
        activeTab: state.activeTab,
        currentTime: state.currentTime,
        createdAt: state.createdAt,
        lastUpdatedAt: state.lastUpdatedAt,
        // Note: videoObjectUrl is NOT persisted (needs recreation from file)
      }),
    }
  )
);

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook to get only video-related state
 */
export const useVideoState = () =>
  useSessionStore((state) => ({
    selectedFileName: state.selectedFileName,
    selectedFileSize: state.selectedFileSize,
    videoObjectUrl: state.videoObjectUrl,
    uploadSession: state.uploadSession,
    setVideo: state.setVideo,
    clearVideo: state.clearVideo,
    getVideoFile: state.getVideoFile,
  }));

/**
 * Hook to get only analysis-related state
 */
export const useAnalysisState = () =>
  useSessionStore((state) => ({
    transcription: state.transcription,
    analysisResult: state.analysisResult,
    retentionAnalysis: state.retentionAnalysis,
    aiInsights: state.aiInsights,
    setTranscription: state.setTranscription,
    setAnalysisResult: state.setAnalysisResult,
    setRetentionAnalysis: state.setRetentionAnalysis,
    setAiInsights: state.setAiInsights,
  }));

/**
 * Hook to get only UI state
 */
export const useUIState = () =>
  useSessionStore((state) => ({
    stage: state.stage,
    activeTab: state.activeTab,
    currentTime: state.currentTime,
    setStage: state.setStage,
    setActiveTab: state.setActiveTab,
    setCurrentTime: state.setCurrentTime,
  }));

/**
 * Hook to get timeline data
 */
export const useTimelineState = () =>
  useSessionStore((state) => ({
    timelineSegments: state.timelineSegments,
    chapterMarkers: state.chapterMarkers,
    setTimelineData: state.setTimelineData,
  }));

// ============================================================================
// Exports
// ============================================================================

export default useSessionStore;
