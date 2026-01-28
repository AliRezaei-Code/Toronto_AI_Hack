/**
 * useAnalysis Hook
 *
 * Handles video analysis via Gemini API.
 * Integrates with session store for state persistence.
 *
 * @module useAnalysis
 */

import { clientAnalysisService } from "@/lib/analysis/client-analysis-service";
import { retentionService } from "@/lib/analysis/retention-service";
import { timelineGenerator } from "@/lib/analysis/timeline-generator";
import { clientLogger } from "@/lib/client-logger";
import { browserHistoryService } from "@/lib/database/browser-history-service";
import { useSessionStore } from "@/lib/stores/session-store";
import type { AIInsights, AnalysisResult, RetentionAnalysis, TranscriptionResult } from "@/types";
import { useCallback, useState } from "react";

// ============================================================================
// Types
// ============================================================================

interface AnalysisProgress {
  stage: "analyzing" | "retention" | "insights" | "saving";
  progress: number;
  message: string;
}

interface UseAnalysisOptions {
  geminiApiKey?: string;
  deepgramApiKey?: string;
  onComplete?: (result: AnalysisResult) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: AnalysisProgress) => void;
}

interface UseAnalysisReturn {
  // State
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisMessage: string | null;
  error: string | null;

  // Actions
  handleAnalyze: () => Promise<AnalysisResult | null>;

  // Derived state from store
  analysisResult: AnalysisResult | null;
  retentionAnalysis: RetentionAnalysis | null;
  aiInsights: AIInsights | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

const generateInsights = async (
  transcription: TranscriptionResult,
  retentionAnalysis: RetentionAnalysis,
  videoId: string,
  geminiApiKey?: string,
  keyframes?: Array<{ timestamp: number; base64Data: string; mimeType: string }>,
  originalMetadata?: { title?: string; description?: string; tags?: string[] }
): Promise<AIInsights> => {
  const response = await fetch("/api/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcription,
      retentionAnalysis,
      videoId,
      geminiApiKey,
      keyframes,
      originalMetadata,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { error?: string }).error || `Insights generation failed: ${response.status}`);
  }

  return response.json();
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAnalysis(options: UseAnalysisOptions = {}): UseAnalysisReturn {
  const { geminiApiKey, deepgramApiKey, onComplete, onError, onProgress } = options;

  // Session store state and actions
  const transcription = useSessionStore((state) => state.transcription);
  const uploadSession = useSessionStore((state) => state.uploadSession);
  const analysisResult = useSessionStore((state) => state.analysisResult);
  const retentionAnalysis = useSessionStore((state) => state.retentionAnalysis);
  const aiInsights = useSessionStore((state) => state.aiInsights);
  const setAnalysisResult = useSessionStore((state) => state.setAnalysisResult);
  const setRetentionAnalysis = useSessionStore((state) => state.setRetentionAnalysis);
  const setAiInsights = useSessionStore((state) => state.setAiInsights);
  const setTimelineData = useSessionStore((state) => state.setTimelineData);
  const setActiveTab = useSessionStore((state) => state.setActiveTab);
  const setStage = useSessionStore((state) => state.setStage);
  const getVideoFile = useSessionStore((state) => state.getVideoFile);

  // Local transient state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleAnalyze = useCallback(async (): Promise<AnalysisResult | null> => {
    if (!transcription) {
      const msg = "No transcription available for analysis";
      setError(msg);
      onError?.(msg);
      return null;
    }

    if (!geminiApiKey) {
      const msg = "Gemini API key is required for analysis";
      setError(msg);
      onError?.(msg);
      return null;
    }

    const videoFile = getVideoFile();
    const existingKeyframes = analysisResult?.keyframes;
    
    // Need either video file or existing keyframes
    if (!videoFile && (!existingKeyframes || existingKeyframes.length === 0)) {
      const msg = "No video file or saved keyframes available for analysis";
      setError(msg);
      onError?.(msg);
      return null;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisMessage(null);
    setError(null);
    setStage("processing");

    // Simulate progress while waiting for API
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev < 85) {
          return prev + Math.random() * 3;
        }
        return prev;
      });
    }, 1000);

    try {
      const videoId = uploadSession?.metadata?.id || transcription.videoId || "unknown";

      // Step 1: Run main analysis
      onProgress?.({
        stage: "analyzing",
        progress: 10,
        message: videoFile ? "Running video analysis..." : "Re-analyzing with saved keyframes...",
      });

      clientLogger.info("[handleAnalyze] Starting analysis...", {
        hasVideoFile: !!videoFile,
        hasKeyframes: !!(existingKeyframes && existingKeyframes.length > 0),
      });

      let result: AnalysisResult;
      
      if (videoFile) {
        // Full analysis with video file
        result = await clientAnalysisService.analyzeVideo(
          videoFile,
          transcription,
          {
            categories: undefined, // All categories
            keyframeStrategy: { type: "uniform", count: 10 },
          },
          (progress: number, message?: string) => {
            if (progress > 85) {
              setAnalysisProgress(progress);
            }
            // Track the message - especially useful for quota/retry messages
            if (message) {
              setAnalysisMessage(message);
            }
            onProgress?.({
              stage: "analyzing",
              progress,
              message: message || "Analyzing...",
            });
          },
          { deepgramApiKey, geminiApiKey }
        );
      } else {
        // Re-analysis with saved keyframes (from history)
        if (!existingKeyframes || existingKeyframes.length === 0) {
          throw new Error("No keyframes available for re-analysis");
        }
        result = await clientAnalysisService.analyzeWithKeyframes(
          existingKeyframes,
          transcription,
          {
            categories: undefined, // All categories
          },
          (progress: number, message?: string) => {
            if (progress > 85) {
              setAnalysisProgress(progress);
            }
            // Track the message - especially useful for quota/retry messages
            if (message) {
              setAnalysisMessage(message);
            }
            onProgress?.({
              stage: "analyzing",
              progress,
              message: message || "Re-analyzing...",
            });
          },
          { deepgramApiKey, geminiApiKey }
        );
      }

      clearInterval(progressInterval);
      setAnalysisResult(result);
      clientLogger.info("[handleAnalyze] ✅ Main analysis complete");

      // Step 2: Generate retention analysis
      onProgress?.({
        stage: "retention",
        progress: 60,
        message: "Generating retention analysis...",
      });

      const retentionResult = await retentionService.analyze(transcription);
      setRetentionAnalysis(retentionResult);
      clientLogger.info("[handleAnalyze] ✅ Retention analysis complete");

      // Step 3: Generate timeline data
      onProgress?.({
        stage: "retention",
        progress: 70,
        message: "Generating timeline...",
      });

      const duration = transcription.segments.length > 0
        ? transcription.segments[transcription.segments.length - 1]?.end ?? 0
        : 0;

      const timelineSegments = timelineGenerator.generateTimelineSegments(transcription, duration);
      const chapterMarkers = timelineGenerator.generateChapterMarkers(transcription, timelineSegments);
      setTimelineData(timelineSegments, chapterMarkers);
      clientLogger.info("[handleAnalyze] ✅ Timeline generated");

      // Step 4: Generate AI insights
      onProgress?.({
        stage: "insights",
        progress: 80,
        message: "Generating AI insights...",
      });

      let generatedInsights: AIInsights | null = null;
      try {
        // Pass keyframes from main analysis to insights generation for visual analysis
        const analysisKeyframes = result.keyframes?.map(kf => ({
          timestamp: kf.timestamp,
          base64Data: kf.base64Data,
          mimeType: kf.mimeType,
        }));
        
        // Extract original metadata from video for delta calculation
        // This enables better improvement potential scoring
        const originalMetadata = uploadSession?.metadata?.originalTitle ? {
          title: uploadSession.metadata.originalTitle,
          // Add description and tags if they become available from YouTube metadata
        } : undefined;
        
        generatedInsights = await generateInsights(
          transcription, 
          retentionResult, 
          videoId, 
          geminiApiKey, 
          analysisKeyframes,
          originalMetadata
        );
        setAiInsights(generatedInsights);
        clientLogger.info("[handleAnalyze] ✅ AI insights generated", {
          keyframesProvided: analysisKeyframes?.length || 0,
          hasOriginalMetadata: !!originalMetadata,
        });
      } catch (insightErr) {
        clientLogger.warn("[handleAnalyze] ⚠️ Insights failed, continuing:", {
          error: insightErr instanceof Error ? insightErr.message : String(insightErr),
        });
      }

      // Step 5: Save to history
      onProgress?.({
        stage: "saving",
        progress: 90,
        message: "Saving to history...",
      });

      try {
        await browserHistoryService.initialize();

        // Get video metadata from upload session, or create minimal one
        const videoMetadata = uploadSession?.metadata || {
          id: videoId,
          filename: videoFile?.name || transcription.videoId || "video",
          filepath: "",
          fileSize: 0,
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
        };

        // Save video metadata (without blob - we only save keyframes)
        await browserHistoryService.saveVideo(videoMetadata);

        // Save transcription
        await browserHistoryService.saveTranscription(transcription);

        // Save analysis with all data including keyframes, full result, and timeline
        // Construct summary from priority actions since AnalysisResult doesn't have a summary field
        const analysisSummary = result.priorityActions?.length > 0 
          ? result.priorityActions.slice(0, 3).join(". ") 
          : `Analysis complete. Score: ${Math.round(result.overallScore * 100)}%`;
        
        await browserHistoryService.saveAnalysis(
          videoId,
          transcription.id || null,
          result.overallScore,
          analysisSummary,
          retentionResult,
          generatedInsights || undefined,
          result.keyframes, // Save extracted keyframes
          result, // Save full analysis result
          timelineSegments, // Save timeline segments
          chapterMarkers // Save chapter markers
        );

        clientLogger.info("[handleAnalyze] ✅ Saved to history with keyframes and analysis");
      } catch (historyErr) {
        clientLogger.warn("[handleAnalyze] ⚠️ Failed to save to history:", {
          error: historyErr instanceof Error ? historyErr.message : String(historyErr),
        });
      }

      setAnalysisProgress(100);
      onProgress?.({
        stage: "saving",
        progress: 100,
        message: "Analysis complete!",
      });

      setStage("results");
      setActiveTab("retention");
      onComplete?.(result);

      return result;
    } catch (err) {
      clearInterval(progressInterval);
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      setStage("results");
      clientLogger.error("Analysis failed", { error: message });
      onError?.(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    transcription,
    uploadSession,
    analysisResult,
    geminiApiKey,
    deepgramApiKey,
    setAnalysisResult,
    setRetentionAnalysis,
    setAiInsights,
    setTimelineData,
    setActiveTab,
    setStage,
    getVideoFile,
    onComplete,
    onError,
    onProgress,
  ]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    isAnalyzing,
    analysisProgress,
    analysisMessage,
    error,

    // Actions
    handleAnalyze,

    // Derived state
    analysisResult,
    retentionAnalysis,
    aiInsights,
  };
}

export default useAnalysis;
