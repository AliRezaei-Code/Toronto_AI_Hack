"use client";

import { useState, useEffect } from "react";
import { cn } from "@/utils/cn";

interface ProcessingStage {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error";
  progress?: number;
  error?: string;
}

interface AnalysisProcessingProps {
  stages: ProcessingStage[];
  overallProgress: number;
  estimatedTimeRemaining?: number;
  className?: string;
}

// Dynamic tips that rotate during processing
const ANALYSIS_TIPS = [
  {
    icon: "🎯",
    title: "Hook Optimization",
    tip: "Videos with strong hooks in the first 8 seconds average 47% higher retention rates.",
  },
  {
    icon: "⚡",
    title: "Pattern Interrupts",
    tip: "Pattern interrupts every 10-15 seconds help reset viewer attention and prevent habituation.",
  },
  {
    icon: "🧠",
    title: "Dopamine Loops",
    tip: "Micro-rewards like visual changes and audio cues create dopamine loops that keep viewers engaged.",
  },
  {
    icon: "📊",
    title: "Pacing Science",
    tip: "The 3-Second Visual Change Rule prevents visual fatigue and maintains attention.",
  },
  {
    icon: "🎬",
    title: "B-Roll Power",
    tip: "Strategic B-roll increases information retention by up to 65% compared to talking head only.",
  },
  {
    icon: "🔊",
    title: "Audio Impact",
    tip: "Viewers are 2x more likely to abandon videos with poor audio quality than poor video quality.",
  },
  {
    icon: "📈",
    title: "SEO Secrets",
    tip: "Videos with optimized titles and descriptions get 3x more organic search traffic.",
  },
  {
    icon: "✨",
    title: "Thumbnail Truth",
    tip: "Thumbnails drive 90% of click-through decisions. Faces with emotion perform 38% better.",
  },
];

// Category descriptions for the current stage
const CATEGORY_DETAILS: Record<string, { icon: string; description: string }> = {
  "Core Concepts": { icon: "🧠", description: "Analyzing retention psychology and engagement patterns..." },
  "Script Structure": { icon: "📝", description: "Evaluating narrative flow and hook effectiveness..." },
  "Visual Editing": { icon: "🎬", description: "Checking pacing, transitions, and visual dynamics..." },
  "Audio Design": { icon: "🔊", description: "Analyzing audio balance, SFX, and music timing..." },
  "SEO Metadata": { icon: "🔍", description: "Optimizing title, description, and discoverability..." },
  "Style Guides": { icon: "🎨", description: "Matching against proven creator style patterns..." },
  "Tools & Workflows": { icon: "🛠️", description: "Identifying workflow improvements and tool suggestions..." },
  "Checklists": { icon: "✅", description: "Running comprehensive quality checklists..." },
};

export function AnalysisProcessing({
  stages,
  overallProgress,
  estimatedTimeRemaining,
  className,
}: AnalysisProcessingProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Rotate tips every 6 seconds with fade animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % ANALYSIS_TIPS.length);
        setIsVisible(true);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const currentTip = ANALYSIS_TIPS[currentTipIndex];
  const completedCount = stages.filter((s) => s.status === "completed").length;
  const processingStage = stages.find((s) => s.status === "processing");

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getStageIcon = (status: ProcessingStage["status"]) => {
    switch (status) {
      case "pending":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-gray-600 bg-gray-800/50">
            <div className="h-2 w-2 rounded-full bg-gray-600" />
          </div>
        );
      case "processing":
        return (
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-xl bg-blue-500/30" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl border-2 border-blue-500 bg-blue-500/20">
              <div className="h-3 w-3 animate-spin rounded-sm border-2 border-blue-400 border-t-transparent" />
            </div>
          </div>
        );
      case "completed":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/25">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={cn("space-y-5", className)}>
      {/* Hero Progress Section */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 p-6">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
                <svg className="h-6 w-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">AI Analysis in Progress</h3>
                <p className="text-sm text-gray-400">{completedCount} of {stages.length} stages complete</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-white">{Math.round(overallProgress)}%</div>
              {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
                <div className="text-sm text-gray-400">~{formatTime(estimatedTimeRemaining)} remaining</div>
              )}
            </div>
          </div>

          {/* Main Progress Bar */}
          <div className="relative mb-2 h-4 w-full overflow-hidden rounded-full bg-gray-700/50">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400/50 via-purple-400/50 to-pink-400/50 blur-sm transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Stage indicator dots */}
          <div className="flex justify-between px-1">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all duration-300",
                  stage.status === "completed" ? "bg-emerald-500" :
                  stage.status === "processing" ? "bg-blue-500 animate-pulse" :
                  "bg-gray-600"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Current Stage Detail */}
      {processingStage && (
        <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-2xl">
              {CATEGORY_DETAILS[processingStage.label]?.icon || "🔄"}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">{processingStage.label}</h4>
                <span className="text-sm font-medium text-purple-400">
                  {processingStage.progress ? `${Math.round(processingStage.progress)}%` : "Processing..."}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                {CATEGORY_DETAILS[processingStage.label]?.description || "Analyzing..."}
              </p>
              {processingStage.progress !== undefined && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-700/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${processingStage.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing Stages Grid */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-5">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Analysis Stages</h4>
        <div className="grid grid-cols-2 gap-3">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 transition-all duration-300",
                stage.status === "completed" && "bg-emerald-500/10 border border-emerald-500/20",
                stage.status === "processing" && "bg-blue-500/10 border border-blue-500/30",
                stage.status === "pending" && "bg-gray-800/50 border border-gray-700/50",
                stage.status === "error" && "bg-red-500/10 border border-red-500/30"
              )}
            >
              {getStageIcon(stage.status)}
              <div className="min-w-0 flex-1">
                <span className={cn(
                  "text-sm font-medium truncate block",
                  stage.status === "completed" && "text-emerald-400",
                  stage.status === "processing" && "text-blue-400",
                  stage.status === "pending" && "text-gray-500",
                  stage.status === "error" && "text-red-400"
                )}>
                  {stage.label}
                </span>
                {stage.error && (
                  <span className="text-xs text-red-400 truncate block">{stage.error}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Tips Section */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-900/20 to-orange-900/20 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <span className="text-2xl">💡</span>
          </div>
          <div className={cn(
            "flex-1 transition-opacity duration-300",
            isVisible ? "opacity-100" : "opacity-0"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{currentTip?.icon}</span>
              <h4 className="font-semibold text-amber-400">{currentTip?.title}</h4>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{currentTip?.tip}</p>
          </div>
        </div>
        
        {/* Tip indicator dots */}
        <div className="mt-4 flex justify-center gap-1.5">
          {ANALYSIS_TIPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all duration-300",
                i === currentTipIndex ? "bg-amber-400 w-4" : "bg-gray-600"
              )}
            />
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-500/20 p-4 text-center">
          <div className="text-2xl mb-1">🎯</div>
          <div className="text-lg font-bold text-white">8</div>
          <div className="text-xs text-gray-400">Categories</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/20 p-4 text-center">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-lg font-bold text-white">50+</div>
          <div className="text-xs text-gray-400">Metrics</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-500/20 p-4 text-center">
          <div className="text-2xl mb-1">💡</div>
          <div className="text-lg font-bold text-white">AI</div>
          <div className="text-xs text-gray-400">Powered</div>
        </div>
      </div>
    </div>
  );
}