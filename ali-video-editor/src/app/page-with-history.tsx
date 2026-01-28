"use client";

import { AnalysisProcessing } from "@/components/AnalysisProcessing";
import { ResultsView } from "@/components/ResultsView";
import { Timeline } from "@/components/Timeline";
import { TopNavigation } from "@/components/TopNavigation";
import { UploadStage } from "@/components/UploadStage";
import { HistoryPage } from "@/components/history";
import { deepgramService } from "@/lib/ai/deepgram-service";
import { clientAnalysisService } from "@/lib/analysis/client-analysis-service";
import { clientLogger } from "@/lib/client-logger";
import { historyService } from "@/lib/database/history-service";
import { uploadService } from "@/lib/upload/upload-service";
import {
    AnalysisResult,
    ChapterMarker,
    TimelineSegment,
    TranscriptionResult,
    VideoUploadSession,
} from "@/types";
import { BarChart3, Clock, FileText, Lightbulb, Upload } from "lucide-react";
import { useEffect, useState } from "react";

type AppStage = "upload" | "processing" | "results";
type NavigationTab = "upload" | "transcription" | "retention" | "insights" | "history";

export default function Home() {
  const [stage, setStage] = useState<AppStage>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSession, setUploadSession] = useState<VideoUploadSession | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<NavigationTab>("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database on mount
  useEffect(() => {
    try {
      historyService.initialize();
      setDbInitialized(true);
      clientLogger.info("Database initialized successfully");
    } catch (err) {
      clientLogger.error("Failed to initialize database", err);
    }
  }, []);

  // Mock timeline data for demonstration
  const mockTimelineSegments: TimelineSegment[] = [
    {
      id: "1",
      start: 0,
      end: 30,
      duration: 30,
      type: "speech",
      audioLevel: -10,
      isSelected: false,
    },
    {
      id: "2",
      start: 30,
      end: 35,
      duration: 5,
      type: "silence",
      audioLevel: -60,
      isSelected: false,
    },
    {
      id: "3",
      start: 35,
      end: 90,
      duration: 55,
      type: "speech",
      audioLevel: -12,
      isSelected: false,
    },
    {
      id: "4",
      start: 90,
      end: 95,
      duration: 5,
      type: "transition",
      audioLevel: -15,
      isSelected: false,
    },
    {
      id: "5",
      start: 95,
      end: 150,
      duration: 55,
      type: "speech",
      audioLevel: -11,
      isSelected: false,
    },
  ];

  const mockChapterMarkers: ChapterMarker[] = [
    { id: "c1", title: "Introduction", start: 0, end: 30, isAIGenerated: true },
    { id: "c2", title: "Main Content", start: 35, end: 90, isAIGenerated: true },
    { id: "c3", title: "Conclusion", start: 95, end: 150, isAIGenerated: true },
  ];

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setTranscription(null);
    setUploadSession(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a video file first");
      return;
    }

    setIsUploading(true);
    setUploadComplete(false);
    setError(null);

    try {
      const session = await uploadService.uploadVideo(selectedFile, (progress) => {
        setUploadSession((prev) => {
          if (!prev) {
            return null;
          }
          return { ...prev, progress };
        });
      });
      setUploadSession(session);

      // Save video metadata to database
      if (dbInitialized) {
        historyService.saveVideo(session.metadata);
      }

      setUploadComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadComplete(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadSession || !transcription || !selectedFile) {
      setError("Please upload and transcribe a video first");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError(null);
    setStage("processing");

    try {
      const result = await clientAnalysisService.analyzeVideo(
        selectedFile,
        transcription,
        {
          categories: undefined, // All 8 categories
          keyframeStrategy: { type: "uniform", count: 10 },
        },
        (progress: number, _message?: string) => {
          setAnalysisProgress(progress);
        }
      );

      setAnalysisResult(result);

      // Save analysis to database
      if (dbInitialized) {
        try {
          const transcriptionId = transcription?.id || null;
          // Convert AnalysisResult to FullVideoAnalysis format
          // The structures are compatible at runtime
          const fullAnalysis = {
            ...result,
            duration: uploadSession.metadata.duration,
            analyzedAt: new Date(),
          } as unknown as import("@/lib/ai/gemini-service").FullVideoAnalysis;
          historyService.saveAnalysis(uploadSession.metadata.id, transcriptionId, fullAnalysis);
          clientLogger.info("Analysis saved to database");
        } catch (saveErr) {
          clientLogger.error("Failed to save analysis to database", saveErr);
        }
      }

      setStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStage("upload");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTranscribe = async () => {
    if (!selectedFile || !uploadSession) {
      setError("Please upload a video first");
      return;
    }

    if (!apiKey) {
      setError("Please enter your Deepgram API key");
      return;
    }

    setIsTranscribing(true);
    setError(null);
    setStage("processing");

    try {
      // Initialize Deepgram service
      deepgramService.initialize(apiKey);

      // Transcribe the video
      const result = await deepgramService.transcribeAudio(
        selectedFile,
        uploadSession.metadata.id,
        (_progress) => {}
      );

      setTranscription(result);

      // Save transcription to database
      if (dbInitialized) {
        try {
          historyService.saveTranscription(result);
          clientLogger.info("Transcription saved to database");
        } catch (saveErr) {
          clientLogger.error("Failed to save transcription to database", saveErr);
        }
      }

      setStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
      setStage("upload");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadSession(null);
    setTranscription(null);
    setError(null);
    setIsUploading(false);
    setUploadComplete(false);
    setIsTranscribing(false);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setAnalysisResult(null);
    setStage("upload");
    setCurrentTime(0);
    setActiveTab("upload");
  };

  const handleSegmentClick = (segment: TimelineSegment) => {
    setCurrentTime(segment.start);
  };

  const handleChapterClick = (chapter: ChapterMarker) => {
    setCurrentTime(chapter.start);
  };

  const handleNavigationTabClick = (tabId: string) => {
    const newTab = tabId as NavigationTab;
    setActiveTab(newTab);

    if (tabId === "upload") {
      setStage("upload");
    } else {
      setStage("results");
    }
  };

  const handleResultsTabChange = (tabId: string) => {
    setActiveTab(tabId as NavigationTab);
  };

  const bottomNavItems = [
    { id: "upload", label: "Upload", icon: Upload, disabled: false },
    { id: "transcription", label: "Transcription", icon: FileText, disabled: false },
    { id: "retention", label: "Retention", icon: BarChart3, disabled: false },
    { id: "insights", label: "Insights", icon: Lightbulb, disabled: false },
    { id: "history", label: "History", icon: Clock, disabled: false },
  ];

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProcessingStages = () => {
    return [
      { id: "upload", label: "Uploading Video", status: "completed" as const },
      { id: "transcribe", label: "Transcribing Speech", status: "completed" as const },
      {
        id: "keyframes",
        label: "Extracting Keyframes",
        status:
          isAnalyzing && analysisProgress < 20
            ? ("processing" as const)
            : isAnalyzing
              ? ("completed" as const)
              : ("pending" as const),
      },
      {
        id: "core_concepts",
        label: "Analyzing Core Concepts",
        status:
          isAnalyzing && analysisProgress >= 30 && analysisProgress < 40
            ? ("processing" as const)
            : isAnalyzing && analysisProgress >= 40
              ? ("completed" as const)
              : ("pending" as const),
      },
      {
        id: "report",
        label: "Generating Report",
        status:
          isAnalyzing && analysisProgress >= 95 ? ("processing" as const) : ("pending" as const),
      },
    ];
  };

  const processingStages = getProcessingStages();

  // Calculate overall progress based on actual completed stages
  const completedCount = processingStages.filter((s) => s.status === "completed").length;
  const overallProgress =
    processingStages.length > 0 ? (completedCount / processingStages.length) * 100 : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-20 pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white">Video Copilot</h1>
          <p className="text-xl text-gray-400">AI-Powered Video Analysis Platform</p>
        </div>

        <div className="mb-8 rounded-none border border-gray-700 bg-gray-800 p-6">
          <label className="mb-2 block text-sm font-medium text-gray-300">Deepgram API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Deepgram API key"
            className="w-full rounded-none border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Show History Page when history tab is active */}
        {activeTab === "history" && dbInitialized ? (
          <div className="rounded-none border border-gray-700 bg-gray-800">
            <HistoryPage />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
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

                  <div className="space-y-3">
                    {!transcription && (
                      <button
                        onClick={handleTranscribe}
                        disabled={!uploadSession || isTranscribing || !apiKey}
                        className="w-full rounded-none bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-600"
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

            <div className="lg:col-span-2">
              {stage === "upload" && (
                <div className="rounded-none border border-gray-700 bg-gray-800 p-6">
                  <div className="flex h-96 flex-col items-center justify-center text-center">
                    <p className="text-gray-400">Upload a video to begin analysis</p>
                  </div>
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
                  <Timeline
                    duration={uploadSession?.metadata.duration || 150}
                    segments={mockTimelineSegments}
                    chapterMarkers={mockChapterMarkers}
                    currentTime={currentTime}
                    onSegmentClick={handleSegmentClick}
                    onChapterClick={handleChapterClick}
                  />

                  <ResultsView
                    transcription={transcription || undefined}
                    activeTab={activeTab === "upload" ? "transcription" : activeTab}
                    onTabChange={handleResultsTabChange}
                    className="min-h-[calc(100vh-400px)]"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <TopNavigation
        items={bottomNavItems}
        activeItem={activeTab}
        onItemClick={handleNavigationTabClick}
      />
    </main>
  );
}
