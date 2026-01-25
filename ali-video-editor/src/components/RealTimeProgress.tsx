"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  Brain,
  Cpu,
  Sparkles,
} from "lucide-react";

export type ProcessingStage = {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error";
  message?: string;
  progress?: number;
};

interface RealTimeProgressProps {
  stages: ProcessingStage[];
  overallProgress: number;
  estimatedTimeRemaining?: number;
}

export function RealTimeProgress({
  stages,
  overallProgress,
  estimatedTimeRemaining,
}: RealTimeProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedProgress((prev) => {
        if (prev < overallProgress) {
          return Math.min(prev + 1, overallProgress);
        }
        return overallProgress;
      });
    }, 20);

    return () => clearInterval(timer);
  }, [overallProgress]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getStatusIcon = (status: ProcessingStage["status"]) => {
    switch (status) {
      case "completed":
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          </div>
        );
      case "processing":
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          </div>
        );
      case "error":
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20">
            <Circle className="h-4 w-4 text-red-400" />
          </div>
        );
      default:
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-500/20">
            <Circle className="h-4 w-4 text-gray-400" />
          </div>
        );
    }
  };

  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case "upload":
        return <FileText className="h-5 w-5" />;
      case "transcribe":
        return <FileText className="h-5 w-5" />;
      case "extract_audio":
        return <Cpu className="h-5 w-5" />;
      case "timeline":
        return <Sparkles className="h-5 w-5" />;
      case "retention":
        return <Sparkles className="h-5 w-5" />;
      case "insights":
        return <Brain className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Processing Video</h2>
                <p className="text-sm text-gray-300">
                  Analyzing your content with AI
                </p>
              </div>
            </div>
            {estimatedTimeRemaining && (
              <div className="rounded-lg bg-gray-900/50 px-4 py-2">
                <p className="text-xs text-gray-400">Estimated Time</p>
                <p className="text-lg font-semibold text-white">
                  {formatTime(estimatedTimeRemaining)}
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Overall Progress</span>
              <span className="font-semibold text-white">
                {Math.round(animatedProgress)}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-900/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
                style={{ width: `${animatedProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Processing Stages */}
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/30 border border-gray-700/50 p-4 transition-all hover:border-blue-500/50"
          >
            <div className="flex items-start gap-4">
              <div className="flex shrink-0 flex-col items-center">
                {getStatusIcon(stage.status)}
                {index < stages.length - 1 && (
                  <div className="mt-2 h-8 w-0.5 bg-gray-700" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                        stage.status === "completed"
                          ? "bg-green-500/20"
                          : stage.status === "processing"
                            ? "bg-blue-500/20"
                            : "bg-gray-700/50"
                      }`}
                    >
                      {getStageIcon(stage.id)}
                    </div>
                    <div>
                      <p
                        className={`font-medium ${
                          stage.status === "completed"
                            ? "text-green-400"
                            : stage.status === "processing"
                              ? "text-white"
                              : "text-gray-400"
                        }`}
                      >
                        {stage.label}
                      </p>
                      {stage.status === "processing" && stage.message && (
                        <p className="text-sm text-blue-400">{stage.message}</p>
                      )}
                    </div>
                  </div>
                  {stage.status === "processing" && stage.progress !== undefined && (
                    <div className="text-right">
                      <p className="text-lg font-semibold text-blue-400">
                        {Math.round(stage.progress)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Individual Stage Progress Bar */}
                {stage.status === "processing" && stage.progress !== undefined && (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-900/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Processing Info */}
      <div className="rounded-xl bg-gradient-to-br from-gray-800/30 to-gray-900/20 border border-gray-700/30 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
            <Sparkles className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-sm text-gray-300">
            Our AI is analyzing your video to extract transcriptions, generate
            insights, and provide actionable recommendations. This may take a few
            minutes depending on the video length.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper to create transcription stages
export function createTranscriptionStages(
  isTranscribing: boolean,
  progress: number
): ProcessingStage[] {
  const stages: ProcessingStage[] = [
    {
      id: "upload",
      label: "Video Upload",
      status: "completed",
      message: "Video uploaded successfully",
    },
    {
      id: "extract_audio",
      label: "Extracting Audio",
      status: isTranscribing && progress < 30 ? "processing" : "completed",
      message:
        isTranscribing && progress < 30
          ? "Extracting audio from video..."
          : "Audio extracted",
      progress: isTranscribing && progress < 30 ? (progress / 30) * 100 : 100,
    },
    {
      id: "transcribe",
      label: "Transcribing Speech",
      status:
        isTranscribing && progress >= 30 && progress < 70
          ? "processing"
          : isTranscribing && progress >= 70
            ? "completed"
            : "pending",
      message:
        isTranscribing && progress >= 30 && progress < 70
          ? "Converting speech to text..."
          : isTranscribing && progress >= 70
            ? "Transcription complete"
            : "Waiting to start",
      progress:
        isTranscribing && progress >= 30 && progress < 70
          ? ((progress - 30) / 40) * 100
          : isTranscribing && progress >= 70
            ? 100
            : 0,
    },
    {
      id: "timeline",
      label: "Generating Timeline",
      status:
        isTranscribing && progress >= 70 && progress < 85
          ? "processing"
          : isTranscribing && progress >= 85
            ? "completed"
            : "pending",
      message:
        isTranscribing && progress >= 70 && progress < 85
          ? "Creating timeline segments..."
          : isTranscribing && progress >= 85
            ? "Timeline generated"
            : "Waiting to start",
      progress:
        isTranscribing && progress >= 70 && progress < 85
          ? ((progress - 70) / 15) * 100
          : isTranscribing && progress >= 85
            ? 100
            : 0,
    },
    {
      id: "retention",
      label: "Analyzing Retention",
      status:
        isTranscribing && progress >= 85 && progress < 95
          ? "processing"
          : isTranscribing && progress >= 95
            ? "completed"
            : "pending",
      message:
        isTranscribing && progress >= 85 && progress < 95
          ? "Calculating retention metrics..."
          : isTranscribing && progress >= 95
            ? "Retention analysis complete"
            : "Waiting to start",
      progress:
        isTranscribing && progress >= 85 && progress < 95
          ? ((progress - 85) / 10) * 100
          : isTranscribing && progress >= 95
            ? 100
            : 0,
    },
    {
      id: "insights",
      label: "Generating Insights",
      status:
        isTranscribing && progress >= 95 ? "processing" : "pending",
      message:
        isTranscribing && progress >= 95
          ? "Creating AI insights..."
          : "Waiting to start",
      progress: isTranscribing && progress >= 95 ? ((progress - 95) / 5) * 100 : 0,
    },
  ];

  return stages;
}

// Helper function to determine stage status based on progress thresholds
function getStageStatus(
  isActive: boolean,
  progress: number,
  startThreshold: number,
  endThreshold: number
): ProcessingStage["status"] {
  if (!isActive) {
    return "pending";
  }
  if (progress >= endThreshold) {
    return "completed";
  }
  if (progress >= startThreshold) {
    return "processing";
  }
  return "pending";
}

// Helper to create analysis stages
export function createAnalysisStages(
  isAnalyzing: boolean,
  progress: number,
  quotaMessage?: string | null
): ProcessingStage[] {
  const stages: ProcessingStage[] = [
    {
      id: "upload",
      label: "Video Upload",
      status: "completed",
      message: "Video uploaded successfully",
    },
    {
      id: "transcribe",
      label: "Transcription Complete",
      status: "completed",
      message: "Ready for analysis",
    },
    {
      id: "keyframes",
      label: "Extracting Keyframes",
      status: getStageStatus(isAnalyzing, progress, 0, 20),
      message:
        isAnalyzing && progress < 20
          ? "Extracting visual keyframes..."
          : "Keyframes extracted",
      progress: isAnalyzing && progress < 20 ? (progress / 20) * 100 : 100,
    },
    {
      id: "core_concepts",
      label: "Analyzing Core Concepts",
      status: getStageStatus(isAnalyzing, progress, 20, 35),
      message:
        isAnalyzing && progress >= 20 && progress < 35
          ? quotaMessage || "Identifying key concepts..."
          : progress >= 35
            ? "Core concepts analyzed"
            : "Waiting",
      progress:
        progress >= 35
          ? 100
          : isAnalyzing && progress >= 20 && progress < 35
            ? ((progress - 20) / 15) * 100
            : 0,
    },
    {
      id: "scripting",
      label: "Analyzing Script Structure",
      status: getStageStatus(isAnalyzing, progress, 35, 50),
      message:
        isAnalyzing && progress >= 35 && progress < 50
          ? quotaMessage || "Evaluating script patterns..."
          : progress >= 50
            ? "Script structure analyzed"
            : "Waiting",
      progress:
        progress >= 50
          ? 100
          : isAnalyzing && progress >= 35 && progress < 50
            ? ((progress - 35) / 15) * 100
            : 0,
    },
    {
      id: "visual_editing",
      label: "Analyzing Visual Editing",
      status: getStageStatus(isAnalyzing, progress, 50, 65),
      message:
        isAnalyzing && progress >= 50 && progress < 65
          ? quotaMessage || "Reviewing visual techniques..."
          : progress >= 65
            ? "Visual editing analyzed"
            : "Waiting",
      progress:
        progress >= 65
          ? 100
          : isAnalyzing && progress >= 50 && progress < 65
            ? ((progress - 50) / 15) * 100
            : 0,
    },
    {
      id: "audio_design",
      label: "Analyzing Audio Design",
      status: getStageStatus(isAnalyzing, progress, 65, 80),
      message:
        isAnalyzing && progress >= 65 && progress < 80
          ? quotaMessage || "Assessing audio quality..."
          : progress >= 80
            ? "Audio design analyzed"
            : "Waiting",
      progress:
        progress >= 80
          ? 100
          : isAnalyzing && progress >= 65 && progress < 80
            ? ((progress - 65) / 15) * 100
            : 0,
    },
    {
      id: "seo_metadata",
      label: "Generating SEO Metadata",
      status: getStageStatus(isAnalyzing, progress, 80, 90),
      message:
        isAnalyzing && progress >= 80 && progress < 90
          ? quotaMessage || "Creating SEO content..."
          : progress >= 90
            ? "SEO metadata generated"
            : "Waiting",
      progress:
        progress >= 90
          ? 100
          : isAnalyzing && progress >= 80 && progress < 90
            ? ((progress - 80) / 10) * 100
            : 0,
    },
    {
      id: "style_guides",
      label: "Matching Style Guides",
      status: getStageStatus(isAnalyzing, progress, 90, 95),
      message:
        isAnalyzing && progress >= 90 && progress < 95
          ? quotaMessage || "Comparing with style guides..."
          : progress >= 95
            ? "Style guides matched"
            : "Waiting",
      progress:
        progress >= 95
          ? 100
          : isAnalyzing && progress >= 90 && progress < 95
            ? ((progress - 90) / 5) * 100
            : 0,
    },
    {
      id: "report",
      label: "Generating Report",
      status: getStageStatus(isAnalyzing, progress, 95, 100),
      message:
        isAnalyzing && progress >= 95 && progress < 100
          ? quotaMessage || "Creating final report..."
          : progress >= 100
            ? "Report generated"
            : "Waiting",
      progress:
        progress >= 100
          ? 100
          : isAnalyzing && progress >= 95
            ? ((progress - 95) / 5) * 100
            : 0,
    },
  ];

  return stages;
}