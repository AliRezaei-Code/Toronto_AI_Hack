"use client";

import { AnalysisProcessing } from "@/components/AnalysisProcessing";
import { createAnalysisStages, createTranscriptionStages } from "@/components/RealTimeProgress";
import { ResultsView } from "@/components/ResultsView";
import { SettingsModal } from "@/components/SettingsModal";
import { ThumbnailGenerator } from "@/components/ThumbnailGenerator";
import { Timeline } from "@/components/Timeline";
import { TopNavigation } from "@/components/TopNavigation";
import { UploadStage } from "@/components/UploadStage";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useTranscription } from "@/hooks/useTranscription";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { clientLogger } from "@/lib/client-logger";
import { browserHistoryService } from "@/lib/database/browser-history-service";
import { useSessionStore } from "@/lib/stores/session-store";
import type { ChapterMarker, TimelineSegment } from "@/types";
import { BarChart3, Clock, FileText, Image, Lightbulb, Save, Settings, Upload } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

// ============================================================================
// Types
// ============================================================================

interface HistoryStatus {
  checked: boolean;
  exists: boolean;
  saving: boolean;
}

// Dynamic import for HistoryPage (only loads on client side, not during build)
const HistoryPage = dynamic(() => import("@/components/history").then((mod) => mod.HistoryPage), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  ),
});

type NavigationTab = "upload" | "transcription" | "retention" | "insights" | "thumbnails" | "history";

export default function Home() {
  // ============================================================================
  // Session Store State
  // ============================================================================

  const stage = useSessionStore((state) => state.stage);
  const setStage = useSessionStore((state) => state.setStage);
  const activeTab = useSessionStore((state) => state.activeTab);
  const setActiveTab = useSessionStore((state) => state.setActiveTab);
  const currentTime = useSessionStore((state) => state.currentTime);
  const setCurrentTime = useSessionStore((state) => state.setCurrentTime);
  const timelineSegments = useSessionStore((state) => state.timelineSegments);
  const chapterMarkers = useSessionStore((state) => state.chapterMarkers);
  const retentionAnalysis = useSessionStore((state) => state.retentionAnalysis);
  const aiInsights = useSessionStore((state) => state.aiInsights);

  // ============================================================================
  // API Keys (localStorage, not persisted to session store)
  // ============================================================================

  const [deepgramApiKey, setDeepgramApiKey] = useState<string>("");
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [huggingfaceApiKey, setHuggingfaceApiKey] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus>({
    checked: false,
    exists: false,
    saving: false,
  });

  // Load API keys from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDeepgramKey = localStorage.getItem("deepgram_api_key");
      const savedGeminiKey = localStorage.getItem("gemini_api_key");
      const savedHuggingfaceKey = localStorage.getItem("huggingface_api_key");
      if (savedDeepgramKey) {
        setDeepgramApiKey(savedDeepgramKey);
      }
      if (savedGeminiKey) {
        setGeminiApiKey(savedGeminiKey);
      }
      if (savedHuggingfaceKey) {
        setHuggingfaceApiKey(savedHuggingfaceKey);
      }
    }
  }, []);

  const handleDeepgramKeyChange = useCallback((key: string) => {
    setDeepgramApiKey(key);
    if (typeof window !== "undefined") {
      if (key) {
        localStorage.setItem("deepgram_api_key", key);
      } else {
        localStorage.removeItem("deepgram_api_key");
      }
    }
  }, []);

  const handleGeminiKeyChange = useCallback((key: string) => {
    setGeminiApiKey(key);
    if (typeof window !== "undefined") {
      if (key) {
        localStorage.setItem("gemini_api_key", key);
      } else {
        localStorage.removeItem("gemini_api_key");
      }
    }
  }, []);

  const handleHuggingfaceKeyChange = useCallback((key: string) => {
    setHuggingfaceApiKey(key);
    if (typeof window !== "undefined") {
      if (key) {
        localStorage.setItem("huggingface_api_key", key);
      } else {
        localStorage.removeItem("huggingface_api_key");
      }
    }
  }, []);

  // ============================================================================
  // Initialize Database
  // ============================================================================

  useEffect(() => {
    const initDb = async () => {
      try {
        await browserHistoryService.initialize();
        setDbInitialized(true);
        clientLogger.info("Browser database initialized successfully");
      } catch (err) {
        clientLogger.error("Failed to initialize browser database", err);
        setDbInitialized(false);
      }
    };
    initDb();
  }, []);

  // ============================================================================
  // Session store selectors for history tracking
  // ============================================================================

  const currentVideoId = useSessionStore((state) => state.currentVideoId);
  const selectedFileName = useSessionStore((state) => state.selectedFileName);
  const selectedFileSize = useSessionStore((state) => state.selectedFileSize);
  const sessionAnalysisResult = useSessionStore((state) => state.analysisResult);

  // ============================================================================
  // Hooks for Business Logic
  // ============================================================================

  const {
    isUploading,
    uploadComplete,
    isDownloading,
    downloadProgress,
    downloadError,
    error: uploadError,
    handleFileSelect,
    handleUpload,
    handleYouTubeDownload,
    handleReset: resetUpload,
    selectedFile,
    uploadSession,
  } = useVideoUpload({
    onUploadComplete: (session) => {
      clientLogger.info("Upload complete", { sessionId: session.id });
      // Save to browser database
      if (dbInitialized && selectedFile) {
        browserHistoryService.saveVideo(session.metadata, selectedFile).catch((err) => {
          clientLogger.error("Failed to save video to database", err);
        });
      }
    },
  });

  const setTimelineData = useSessionStore((state) => state.setTimelineData);
  const setRetentionAnalysis = useSessionStore((state) => state.setRetentionAnalysis);

  const {
    isTranscribing,
    error: transcriptionError,
    handleTranscribe,
    transcription,
  } = useTranscription({
    deepgramApiKey,
    onComplete: async (result) => {
      clientLogger.info("Transcription complete");
      setActiveTab("transcription");

      // Save transcription to browser database
      if (dbInitialized) {
        try {
          await browserHistoryService.saveTranscription(result);
          clientLogger.info("Transcription saved to browser database");
        } catch (saveErr) {
          clientLogger.error("Failed to save transcription to database", saveErr);
        }
      }

      // Generate timeline data (matching old behavior)
      if (uploadSession) {
        try {
          const { timelineGenerator } = await import("@/lib/analysis/timeline-generator");
          const { retentionService } = await import("@/lib/analysis/retention-service");

          const duration = uploadSession.metadata.duration;
          const segments = timelineGenerator.generateTimelineSegments(result, duration);
          const chapters = timelineGenerator.generateChapterMarkers(result, segments);
          setTimelineData(segments, chapters);

          // Generate retention analysis
          const retention = await retentionService.analyze(result);
          setRetentionAnalysis(retention);

          clientLogger.info("Timeline and retention generated", {
            segments: segments.length,
            chapters: chapters.length,
          });
        } catch (err) {
          clientLogger.error("Failed to generate timeline/retention", err);
        }
      }
    },
  });

  const {
    isAnalyzing,
    analysisProgress,
    analysisMessage,
    error: analysisError,
    handleAnalyze,
    analysisResult,
  } = useAnalysis({
    geminiApiKey,
    deepgramApiKey,
    onComplete: () => {
      clientLogger.info("Analysis complete");
      setActiveTab("retention");
      // Mark history as existing since useAnalysis saves to history on complete
      setHistoryStatus({ checked: true, exists: true, saving: false });
    },
    onError: (msg) => {
      if (msg.includes("API key")) {
        setIsSettingsOpen(true);
      }
    },
  });

  // Combined error state
  const error = uploadError || transcriptionError || analysisError;

  // ============================================================================
  // Check if current session has history entry
  // ============================================================================

  useEffect(() => {
    const checkHistoryStatus = async () => {
      // Use session store result or hook result
      const currentAnalysis = sessionAnalysisResult || analysisResult;
      
      if (!dbInitialized || !currentVideoId || !currentAnalysis) {
        setHistoryStatus({ checked: true, exists: false, saving: false });
        return;
      }

      try {
        const exists = await browserHistoryService.hasHistoryForVideo(currentVideoId);
        setHistoryStatus({ checked: true, exists, saving: false });
        clientLogger.info("History status checked", { videoId: currentVideoId, exists });
      } catch (err) {
        clientLogger.error("Failed to check history status", err);
        setHistoryStatus({ checked: true, exists: false, saving: false });
      }
    };

    checkHistoryStatus();
  }, [dbInitialized, currentVideoId, sessionAnalysisResult, analysisResult]);

  // ============================================================================
  // Save Current Session to History
  // ============================================================================

  const handleSaveToHistory = useCallback(async () => {
    const currentAnalysis = sessionAnalysisResult || analysisResult;
    
    if (!currentVideoId || !currentAnalysis) {
      clientLogger.warn("Cannot save to history: missing video ID or analysis result");
      return;
    }

    setHistoryStatus((prev) => ({ ...prev, saving: true }));

    try {
      const transcription = useSessionStore.getState().transcription;
      const retentionAnalysis = useSessionStore.getState().retentionAnalysis;
      const aiInsights = useSessionStore.getState().aiInsights;
      const timelineSegments = useSessionStore.getState().timelineSegments;
      const chapterMarkers = useSessionStore.getState().chapterMarkers;
      const sessionUpload = useSessionStore.getState().uploadSession;

      const duration = sessionUpload?.metadata?.duration ?? 
        (transcription?.segments?.length ? transcription.segments[transcription.segments.length - 1]?.end ?? 0 : 0);

      const analysisSummary = currentAnalysis.priorityActions?.length > 0
        ? currentAnalysis.priorityActions.slice(0, 3).join(". ")
        : `Analysis complete. Score: ${Math.round(currentAnalysis.overallScore * 100)}%`;

      // Save transcription first if exists
      if (transcription) {
        await browserHistoryService.saveTranscription(transcription);
      }

      await browserHistoryService.saveAnalysisFromSession(
        currentVideoId,
        selectedFileName || sessionUpload?.metadata?.filename || "video",
        duration,
        selectedFileSize || sessionUpload?.metadata?.fileSize || 0,
        transcription?.id || null,
        currentAnalysis.overallScore,
        analysisSummary,
        retentionAnalysis || undefined,
        aiInsights || undefined,
        currentAnalysis.keyframes,
        currentAnalysis,
        timelineSegments,
        chapterMarkers
      );

      setHistoryStatus({ checked: true, exists: true, saving: false });
      clientLogger.info("Session saved to history successfully");
    } catch (err) {
      clientLogger.error("Failed to save to history", err);
      setHistoryStatus((prev) => ({ ...prev, saving: false }));
    }
  }, [currentVideoId, sessionAnalysisResult, analysisResult, selectedFileName, selectedFileSize]);

  // ============================================================================
  // Combined Reset Handler
  // ============================================================================

  const handleReset = useCallback(() => {
    resetUpload();
    useSessionStore.getState().reset();
    setHistoryStatus({ checked: false, exists: false, saving: false });
    clientLogger.info("Session reset");
  }, [resetUpload]);

  // ============================================================================
  // Navigation Handlers
  // ============================================================================

  const handleSegmentClick = useCallback(
    (segment: TimelineSegment) => {
      setCurrentTime(segment.start);
    },
    [setCurrentTime]
  );

  const handleChapterClick = useCallback(
    (chapter: ChapterMarker) => {
      setCurrentTime(chapter.start);
    },
    [setCurrentTime]
  );

  const handleNavigationTabClick = useCallback(
    (tabId: string) => {
      const newTab = tabId as NavigationTab;
      setActiveTab(newTab);
      if (tabId === "upload") {
        setStage("upload");
      } else {
        setStage("results");
      }
    },
    [setActiveTab, setStage]
  );

  const handleResultsTabChange = useCallback(
    (tabId: string) => {
      setActiveTab(tabId as NavigationTab);
    },
    [setActiveTab]
  );

  // ============================================================================
  // Navigation Items
  // ============================================================================

  const bottomNavItems = [
    { id: "upload", label: "Upload", icon: Upload, disabled: false },
    { id: "transcription", label: "Transcription", icon: FileText, disabled: false },
    { id: "retention", label: "Retention", icon: BarChart3, disabled: false },
    { id: "insights", label: "Insights", icon: Lightbulb, disabled: false },
    { id: "thumbnails", label: "Thumbnails", icon: Image, disabled: false },
    { id: "history", label: "History", icon: Clock, disabled: false },
  ];

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get processing stages based on current operation
  // Check if message is a retry/quota message (starts with timer emoji)
  const isQuotaMessage = analysisMessage?.startsWith("⏳") ?? false;
  
  const getProcessingStages = () => {
    if (isTranscribing) {
      const transcribeProgress = 50; // Simulated
      return createTranscriptionStages(true, transcribeProgress);
    }
    if (isAnalyzing) {
      // Pass quota message only if it's a retry/quota-related message
      return createAnalysisStages(true, analysisProgress, isQuotaMessage ? analysisMessage : null);
    }
    return [];
  };

  const processingStages = getProcessingStages();
  const completedCount = processingStages.filter((s) => s.status === "completed").length;
  const overallProgress =
    processingStages.length > 0 ? (completedCount / processingStages.length) * 100 : 0;

  // Mock timeline data (used when no real data available)
  const mockTimelineSegments: TimelineSegment[] = [
    {
      id: "1",
      start: 0,
      end: 30,
      duration: 30,
      type: "speech",
      confidence: 0.95,
      speaker: "Speaker 1",
      transcriptionText: "Welcome to the video...",
      audioLevel: -14,
      isSelected: false,
    },
    {
      id: "2",
      start: 35,
      end: 90,
      duration: 55,
      type: "speech",
      confidence: 0.92,
      speaker: "Speaker 1",
      transcriptionText: "Let me explain...",
      audioLevel: -12,
      isSelected: false,
    },
    {
      id: "3",
      start: 95,
      end: 150,
      duration: 55,
      type: "speech",
      confidence: 0.88,
      speaker: "Speaker 1",
      transcriptionText: "In summary...",
      audioLevel: -11,
      isSelected: false,
    },
  ];

  const mockChapterMarkers: ChapterMarker[] = [
    { id: "c1", title: "Introduction", start: 0, end: 30, isAIGenerated: true },
    { id: "c2", title: "Main Content", start: 35, end: 90, isAIGenerated: true },
    { id: "c3", title: "Conclusion", start: 95, end: 150, isAIGenerated: true },
  ];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-20 pt-20">
      {/* Top Navigation */}
      <TopNavigation
        items={bottomNavItems}
        activeItem={activeTab}
        onItemClick={handleNavigationTabClick}
      />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header with Settings Button */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex-1 text-center">
            <h1 className="mb-4 text-5xl font-bold text-white">Video Copilot</h1>
            <p className="text-xl text-gray-400">AI-Powered Video Analysis Platform</p>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="rounded-lg border border-gray-600 bg-gray-800 p-3 text-gray-400 transition-all hover:border-gray-500 hover:bg-gray-700 hover:text-white"
            title="API Settings"
          >
            <Settings className="h-6 w-6" />
          </button>
        </div>

        {/* Show History Page when history tab is active */}
        {activeTab === "history" && dbInitialized ? (
          <div className="rounded-none border border-gray-700 bg-gray-800">
            <HistoryPage />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column - Upload & Controls */}
            <div className="lg:col-span-1">
              {stage === "upload" && (
                <UploadStage
                  isUploading={isUploading}
                  uploadProgress={uploadSession?.progress || 0}
                  uploadComplete={uploadComplete}
                  onFileSelect={handleFileSelect}
                  onUpload={handleUpload}
                  onReset={handleReset}
                  selectedFile={selectedFile}
                  onAnalyze={transcription ? handleAnalyze : undefined}
                  isAnalyzing={isAnalyzing}
                  analyzeProgress={analysisProgress}
                  onTranscribe={uploadComplete ? handleTranscribe : undefined}
                  isTranscribing={isTranscribing}
                  onYouTubeDownload={handleYouTubeDownload}
                  isDownloading={isDownloading}
                  downloadProgress={downloadProgress}
                  downloadError={downloadError}
                />
              )}

              {stage === "processing" && (
                <AnalysisProcessing
                  stages={processingStages}
                  overallProgress={overallProgress}
                  estimatedTimeRemaining={isAnalyzing ? 60 : isTranscribing ? 30 : undefined}
                />
              )}

              {stage === "results" && (
                <div className="space-y-6">
                  {/* Video Info */}
                  {uploadSession && (
                    <div className="rounded-none border border-gray-700 bg-gray-800 p-6">
                      <h3 className="mb-4 text-lg font-semibold text-white">Video Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Duration</span>
                          <span className="text-white">
                            {formatDuration(uploadSession.metadata.duration)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Resolution</span>
                          <span className="text-white">
                            {uploadSession.metadata.width}x{uploadSession.metadata.height}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">File Size</span>
                          <span className="text-white">
                            {(uploadSession.metadata.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {!transcription && (
                      <button
                        onClick={handleTranscribe}
                        disabled={!uploadSession || isTranscribing}
                        className="w-full rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-600"
                        title={!deepgramApiKey ? "Configure API key in settings" : ""}
                      >
                        {isTranscribing ? "Transcribing..." : "Transcribe"}
                      </button>
                    )}

                    {transcription && !analysisResult && (
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="w-full rounded-none bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-600"
                      >
                        {isAnalyzing ? "Analyzing..." : "Analyze Video"}
                      </button>
                    )}

                    {analysisResult && (
                      <>
                        <div className="rounded-none border border-green-600 bg-green-900/30 p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-none bg-green-600">
                              <svg
                                className="h-4 w-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-400">Analysis Complete!</p>
                              <p className="mt-1 text-xs text-green-300/70">
                                Overall Score: {(analysisResult.overallScore * 100).toFixed(0)}% •{" "}
                                {analysisResult.allIssues.length} Issues Found
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Save to History button - shown when analysis exists but not in history */}
                        {historyStatus.checked && !historyStatus.exists && (
                          <button
                            onClick={handleSaveToHistory}
                            disabled={historyStatus.saving}
                            className="flex w-full items-center justify-center gap-2 rounded-none bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-800"
                          >
                            <Save className="h-4 w-4" />
                            {historyStatus.saving ? "Saving..." : "Save to History"}
                          </button>
                        )}

                        {/* History saved indicator */}
                        {historyStatus.checked && historyStatus.exists && (
                          <div className="flex items-center justify-center gap-2 rounded-none border border-gray-600 bg-gray-700/50 px-4 py-2 text-sm text-gray-300">
                            <Clock className="h-4 w-4 text-green-400" />
                            Saved in History
                          </div>
                        )}

                        {/* Re-analyze button - always available when analysis exists */}
                        <button
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                          className="w-full rounded-none border border-purple-500 bg-transparent px-6 py-3 font-medium text-purple-400 transition-all hover:bg-purple-900/30 disabled:cursor-not-allowed disabled:border-gray-600 disabled:text-gray-500"
                        >
                          {isAnalyzing ? "Re-analyzing..." : "Re-analyze Video"}
                        </button>
                      </>
                    )}

                    <button
                      onClick={handleReset}
                      className="w-full rounded-none bg-gray-700 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-600"
                    >
                      Analyze New Video
                    </button>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-6 rounded-none border border-red-700 bg-red-900/50 p-4">
                  <div className="flex items-center">
                    <svg
                      className="mr-2 h-5 w-5 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Timeline & Results */}
            <div className="lg:col-span-2">
              {stage === "upload" && (
                <div className="rounded-none border border-gray-700 bg-gray-800 p-6">
                  {selectedFile ? (
                    <VideoPlayer
                      file={selectedFile}
                      className="h-96"
                      onTimeUpdate={setCurrentTime}
                    />
                  ) : (
                    <div className="flex h-96 flex-col items-center justify-center text-center">
                      <svg
                        className="mb-4 h-16 w-16 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-gray-400">Upload a video to begin analysis</p>
                    </div>
                  )}
                </div>
              )}

              {stage === "processing" && (
                <div className="rounded-none border border-gray-700 bg-gray-800 p-6">
                  <div className="flex h-96 flex-col items-center justify-center text-center">
                    <div className="mb-4 h-16 w-16 animate-spin rounded-none border-4 border-blue-500 border-t-transparent" />
                    <p className="text-gray-400">Processing your video...</p>
                  </div>
                </div>
              )}

              {stage === "results" && (
                <div className="space-y-6">
                  {/* Timeline */}
                  <Timeline
                    duration={uploadSession?.metadata.duration || 150}
                    segments={timelineSegments.length > 0 ? timelineSegments : mockTimelineSegments}
                    chapterMarkers={chapterMarkers.length > 0 ? chapterMarkers : mockChapterMarkers}
                    currentTime={currentTime}
                    onSegmentClick={handleSegmentClick}
                    onChapterClick={handleChapterClick}
                  />

                  {/* Results View */}
                  {activeTab !== "thumbnails" && (
                    <ResultsView
                      transcription={transcription || undefined}
                      retentionAnalysis={retentionAnalysis || undefined}
                      aiInsights={aiInsights || undefined}
                      activeTab={activeTab === "upload" ? "transcription" : activeTab}
                      onTabChange={handleResultsTabChange}
                      className="min-h-[calc(100vh-400px)]"
                    />
                  )}

                  {/* Thumbnail Generator */}
                  {activeTab === "thumbnails" && analysisResult && (
                    <div className="mt-8">
                      <ThumbnailGenerator
                        videoId={uploadSession?.metadata.id}
                        suggestedTitle={
                          uploadSession?.metadata.originalTitle || aiInsights?.seoMetadata?.title
                        }
                        suggestedTopic={
                          aiInsights?.seoMetadata?.keywords?.join(", ") ||
                          uploadSession?.metadata.filename
                        }
                        huggingfaceApiKey={huggingfaceApiKey}
                      />
                    </div>
                  )}

                  {activeTab === "thumbnails" && !analysisResult && (
                     <div className="rounded-none border border-gray-700 bg-gray-800 p-6">
                       <div className="flex h-96 flex-col items-center justify-center text-center">
                         <Image className="mb-4 h-16 w-16 text-gray-600" />
                         <p className="text-gray-400">Complete analysis to generate thumbnails</p>
                       </div>
                     </div>
                  )}
                </div>

              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        deepgramApiKey={deepgramApiKey}
        geminiApiKey={geminiApiKey}
        huggingfaceApiKey={huggingfaceApiKey}
        onDeepgramKeyChange={handleDeepgramKeyChange}
        onGeminiKeyChange={handleGeminiKeyChange}
        onHuggingfaceKeyChange={handleHuggingfaceKeyChange}
      />
    </main>
  );
}
