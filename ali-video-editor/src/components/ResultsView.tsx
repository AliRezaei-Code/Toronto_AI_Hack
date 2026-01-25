"use client";

import { BeautifulInsightsView } from "@/components/BeautifulInsightsView";
import { ChapterExport } from "@/components/ChapterExport";
import { FloatingLimeOrb } from "@/components/ui/FloatingLimeOrb";
import { AIInsights, RetentionAnalysis, TranscriptionResult } from "@/types";
import { cn } from "@/utils/cn";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface ResultsViewProps {
  transcription?: TranscriptionResult;
  retentionAnalysis?: RetentionAnalysis;
  aiInsights?: AIInsights;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export function ResultsView({
  transcription,
  retentionAnalysis,
  aiInsights,
  activeTab: externalActiveTab,
  className,
}: ResultsViewProps) {
  const activeTab = externalActiveTab || "transcription";
  const reduceMotion = useReducedMotion();

  const springTransition = { type: "spring" as const, stiffness: 160, damping: 24 };
  const panelTransition = reduceMotion ? { duration: 0 } : springTransition;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Tab Content */}
      <div className="mb-4 min-h-[400px] flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "transcription" && (
            <motion.div
              key="transcription"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={panelTransition}
              className="space-y-4"
            >
              {!transcription ? (
                <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-none bg-gray-800 p-8 text-center">
                  <FloatingLimeOrb className="absolute -right-10 -top-16 opacity-50" size={180} />
                  <div className="relative z-10 flex flex-col items-center">
                    <motion.svg
                      className="mb-4 h-16 w-16 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={reduceMotion ? { y: 0 } : { y: [0, -6, 0] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </motion.svg>
                    <h3 className="mb-2 text-lg font-medium text-white">
                      No Transcription Available
                    </h3>
                    <p className="text-sm text-gray-400">
                      Upload and transcribe a video to see the transcription results here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      className="rounded-none bg-gray-800 p-4"
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={panelTransition}
                    >
                      <p className="mb-1 text-xs text-gray-400">Word Count</p>
                      <p className="text-2xl font-bold text-white">
                        {transcription.segments.reduce((acc, seg) => acc + seg.words.length, 0)}
                      </p>
                    </motion.div>
                    <motion.div
                      className="rounded-none bg-gray-800 p-4"
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={panelTransition}
                    >
                      <p className="mb-1 text-xs text-gray-400">Confidence</p>
                      <p className="text-2xl font-bold text-white">
                        {Math.round(transcription.confidence * 100)}%
                      </p>
                    </motion.div>
                    <motion.div
                      className="rounded-none bg-gray-800 p-4"
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={panelTransition}
                    >
                      <p className="mb-1 text-xs text-gray-400">Language</p>
                      <p className="text-2xl font-bold text-white">{transcription.language}</p>
                    </motion.div>
                    <motion.div
                      className="rounded-none bg-gray-800 p-4"
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={panelTransition}
                    >
                      <p className="mb-1 text-xs text-gray-400">Segments</p>
                      <p className="text-2xl font-bold text-white">
                        {transcription.segments.length}
                      </p>
                    </motion.div>
                  </div>

                  {/* Full Transcript */}
                  <motion.div
                    className="rounded-none bg-gray-800 p-4"
                    whileHover={{ scale: 1.01 }}
                    transition={panelTransition}
                  >
                    <h4 className="mb-3 text-sm font-medium text-gray-300">Full Transcript</h4>
                    <div className="max-h-96 overflow-y-auto">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                        {transcription.text}
                      </p>
                    </div>
                  </motion.div>

                  {/* Segments */}
                  <motion.div
                    className="rounded-none bg-gray-800 p-4"
                    whileHover={{ scale: 1.01 }}
                    transition={panelTransition}
                  >
                    <h4 className="mb-3 text-sm font-medium text-gray-300">Segments</h4>
                    <div className="max-h-64 space-y-3 overflow-y-auto">
                      {transcription.segments.map((segment, index) => (
                        <div key={index} className="border-l-2 border-blue-500 pl-3">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {formatTime(segment.start)} - {formatTime(segment.end)}
                            </span>
                            {segment.speaker && (
                              <span className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white">
                                {segment.speaker}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300">{segment.text}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "retention" && (
            <motion.div
              key="retention"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={panelTransition}
              className="space-y-5"
            >
              {!retentionAnalysis && (
                <motion.div
                  className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 p-12 text-center"
                  whileHover={{ scale: 1.01 }}
                  transition={panelTransition}
                >
                  <FloatingLimeOrb className="absolute -right-16 -top-14 opacity-50" size={190} />
                  <div className="relative z-10 flex flex-col items-center">
                    <motion.div
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                      animate={reduceMotion ? { y: 0 } : { y: [0, -6, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span className="text-4xl">📊</span>
                    </motion.div>
                    <h3 className="mb-3 text-xl font-bold text-white">No Retention Analysis Yet</h3>
                    <p className="max-w-sm text-sm text-gray-400">
                      Upload and transcribe a video to unlock powerful retention insights and
                      engagement predictions.
                    </p>
                  </div>
                </motion.div>
              )}

              {retentionAnalysis && (
                <div className="space-y-5">
                  {/* Hero Score Section */}
                  <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 p-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5" />
                    <div className="relative z-10">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
                          <span className="text-2xl">🎯</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Retention Score</h3>
                          <p className="text-sm text-gray-400">AI-powered engagement analysis</p>
                        </div>
                      </div>

                      {/* Score Cards */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-900/40 to-blue-800/20 p-4 text-center">
                          <div className="mb-1 text-3xl font-black text-white">
                            {Math.round(retentionAnalysis.averageRetentionRate * 100)}%
                          </div>
                          <div className="text-xs font-medium uppercase tracking-wider text-blue-400">
                            Avg Retention
                          </div>
                        </div>
                        <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/40 to-purple-800/20 p-4 text-center">
                          <div className="mb-1 text-3xl font-black text-white">
                            {Math.round(retentionAnalysis.overallEngagementPrediction * 100)}%
                          </div>
                          <div className="text-xs font-medium uppercase tracking-wider text-purple-400">
                            Engagement
                          </div>
                        </div>
                        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 p-4 text-center">
                          <div className="mb-1 text-3xl font-black text-white">
                            {retentionAnalysis.suspenseMoments?.length || 0}
                          </div>
                          <div className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                            Hot Spots
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Quality Card */}
                  <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                        <span className="text-xl">📈</span>
                      </div>
                      <h4 className="text-lg font-bold text-white">Content Quality Breakdown</h4>
                    </div>
                    <div className="space-y-4">
                      {Object.entries(retentionAnalysis.contentQuality).map(([key, value]) => {
                        if (typeof value !== "number") {
                          return null;
                        }
                        const percentage = Math.round(value * 100);
                        const getBarColor = (val: number) => {
                          if (val >= 0.8) {
                            return "from-emerald-500 to-green-500";
                          }
                          if (val >= 0.6) {
                            return "from-blue-500 to-purple-500";
                          }
                          if (val >= 0.4) {
                            return "from-amber-500 to-orange-500";
                          }
                          return "from-red-500 to-rose-500";
                        };
                        return (
                          <div key={key} className="group">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-medium capitalize text-gray-300 transition-colors group-hover:text-white">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                              <span className="text-sm font-bold text-white">{percentage}%</span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-700/50">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${getBarColor(value)} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Key Insights Card */}
                  <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                        <span className="text-xl">💡</span>
                      </div>
                      <h4 className="text-lg font-bold text-white">Key Insights</h4>
                    </div>
                    <div className="space-y-3">
                      {retentionAnalysis.keyInsights.map((insight, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-4 transition-all hover:border-emerald-500/40"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-sm font-bold text-emerald-400">
                            {index + 1}
                          </div>
                          <p className="text-sm leading-relaxed text-gray-300">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suspense Moments (if available) */}
                  {retentionAnalysis.suspenseMoments &&
                    retentionAnalysis.suspenseMoments.length > 0 && (
                      <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-6">
                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-500/30 bg-gradient-to-br from-pink-500/20 to-rose-500/20">
                            <span className="text-xl">🔥</span>
                          </div>
                          <h4 className="text-lg font-bold text-white">Engagement Hot Spots</h4>
                        </div>
                        <div className="space-y-3">
                          {retentionAnalysis.suspenseMoments.slice(0, 5).map((moment, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4 rounded-xl border border-pink-500/20 bg-gradient-to-r from-pink-500/10 to-rose-500/5 p-4"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-500/20 font-mono text-sm font-bold text-pink-400">
                                {formatTime(moment.start)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-gray-300">
                                  {moment.description}
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-xs font-medium text-pink-400">
                                    Intensity:
                                  </span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                      <div
                                        key={level}
                                        className={`h-1.5 w-3 rounded-full ${
                                          level <= Math.ceil(moment.intensity * 5)
                                            ? "bg-pink-500"
                                            : "bg-gray-600"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={panelTransition}
              className="space-y-5"
            >
              {!aiInsights && (
                <motion.div
                  className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 p-12 text-center"
                  whileHover={{ scale: 1.01 }}
                  transition={panelTransition}
                >
                  <FloatingLimeOrb className="absolute -right-12 -top-14 opacity-45" size={180} />
                  <div className="relative z-10 flex flex-col items-center">
                    <motion.div
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                      animate={reduceMotion ? { y: 0 } : { y: [0, -6, 0] }}
                      transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span className="text-4xl">🚀</span>
                    </motion.div>
                    <h3 className="mb-3 text-xl font-bold text-white">No AI Insights Yet</h3>
                    <p className="max-w-sm text-sm text-gray-400">
                      Upload and transcribe a video to unlock AI-powered recommendations that will
                      supercharge your content.
                    </p>
                  </div>
                </motion.div>
              )}

              {aiInsights && (
                <>
                  {/* Improvement Potential Hero */}
                  <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 p-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5" />
                    <div className="relative z-10">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                          <span className="text-2xl">🚀</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Improvement Potential</h3>
                          <p className="text-sm text-gray-400">
                            AI-powered optimization suggestions
                          </p>
                        </div>
                        {/* Confidence Badge */}
                        {aiInsights.improvementBreakdown && (
                          <span className={cn(
                            "ml-auto rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide",
                            aiInsights.improvementBreakdown.confidenceLevel === "high"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : aiInsights.improvementBreakdown.confidenceLevel === "medium"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-gray-500/20 text-gray-400"
                          )}>
                            {aiInsights.improvementBreakdown.confidenceLevel} confidence
                          </span>
                        )}
                      </div>

                      {/* Main progress bar */}
                      <div className="mb-4">
                        <div className="mb-2 flex items-end justify-between">
                          <span className="text-4xl font-black text-white">
                            {aiInsights.improvementBreakdown 
                              ? aiInsights.improvementBreakdown.estimatedBoostPercent
                              : Math.round(aiInsights.overallImprovementPotential * 100)}%
                          </span>
                          <span className="text-sm text-gray-400">potential boost</span>
                        </div>
                        <div className="h-4 w-full overflow-hidden rounded-full bg-gray-700/50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-1000"
                            style={{ width: `${aiInsights.overallImprovementPotential * 100}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-sm italic text-gray-400">
                        &ldquo;Implementing these suggestions could boost your viewer retention by
                        up to{" "}
                        <span className="font-semibold text-white">
                          {aiInsights.improvementBreakdown 
                            ? aiInsights.improvementBreakdown.estimatedBoostPercent
                            : Math.round(aiInsights.overallImprovementPotential * 50)}%
                        </span>
                        &rdquo;
                      </p>

                      {/* Factor Breakdown */}
                      {aiInsights.improvementBreakdown && aiInsights.improvementBreakdown.factors.length > 0 && (
                        <div className="mt-5 border-t border-gray-700/50 pt-4">
                          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                            Improvement Breakdown
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {aiInsights.improvementBreakdown.factors
                              .filter(f => f.actionableItems > 0)
                              .slice(0, 6)
                              .map((factor, index) => (
                                <div 
                                  key={index}
                                  className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs">
                                      {factor.name === "Title Optimization" && "📝"}
                                      {factor.name === "Description Optimization" && "✍️"}
                                      {factor.name === "Tags & Keywords" && "🏷️"}
                                      {factor.name === "Content Suggestions" && "📖"}
                                      {factor.name === "Thumbnail Optimization" && "🖼️"}
                                      {factor.name === "Retention Potential" && "📈"}
                                      {factor.name === "Metadata Completeness" && "✅"}
                                    </span>
                                    <span className="text-xs text-gray-400">{factor.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-700">
                                      <div 
                                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                                        style={{ width: `${factor.score * 100}%` }}
                                      />
                                    </div>
                                    <span className="min-w-[2.5rem] text-right text-xs font-medium text-emerald-400">
                                      +{Math.round(factor.contribution * 100)}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Insights */}
                  {aiInsights.topInsights.length > 0 && (
                    <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-6">
                      <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
                          <span className="text-xl">⚡</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">Top Priority Actions</h4>
                      </div>
                      <div className="space-y-3">
                        {aiInsights.topInsights.map((insight, index) => (
                          <div
                            key={index}
                            className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 p-4"
                          >
                            <div className="absolute left-0 top-0 rounded-br-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 text-xs font-bold text-white">
                              #{index + 1}
                            </div>
                            <div className="pt-4">
                              <p className="text-sm leading-relaxed text-gray-300">{insight}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Script Suggestions */}
                  {aiInsights.scriptSuggestions.length > 0 && (
                    <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-6">
                      <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                          <span className="text-xl">📝</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">Script Suggestions</h4>
                      </div>
                      <div className="space-y-3">
                        {aiInsights.scriptSuggestions.slice(0, 5).map((suggestion, index) => (
                          <div
                            key={index}
                            className="group rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/5 p-4 transition-all hover:border-blue-500/40"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                                <span className="text-lg">📝</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-sm font-semibold capitalize text-white">
                                    {suggestion.type}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-emerald-400">
                                      +{Math.round(suggestion.expectedImpact * 100)}%
                                    </span>
                                    <span className="text-xs text-gray-500">impact</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-400 transition-colors group-hover:text-gray-300">
                                  {suggestion.description}
                                </p>
                                {suggestion.start !== undefined && (
                                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gray-700/50 px-2 py-0.5 text-xs text-gray-400">
                                    <span>@</span>
                                    <span className="font-mono">
                                      {formatTime(suggestion.start)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visual Recommendations */}
                  {aiInsights.visualRecommendations.length > 0 && (
                    <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-6">
                      <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-500/30 bg-gradient-to-br from-pink-500/20 to-rose-500/20">
                          <span className="text-xl">🎬</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">Visual Recommendations</h4>
                      </div>
                      <div className="space-y-3">
                        {aiInsights.visualRecommendations.slice(0, 5).map((rec, index) => (
                          <div
                            key={index}
                            className="group rounded-xl border border-pink-500/20 bg-gradient-to-r from-pink-500/10 to-rose-500/5 p-4 transition-all hover:border-pink-500/40"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400">
                                <span className="text-lg">🎬</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-sm font-semibold capitalize text-white">
                                    {rec.type}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-emerald-400">
                                      +{Math.round(rec.expectedImpact * 100)}%
                                    </span>
                                    <span className="text-xs text-gray-500">impact</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-400 transition-colors group-hover:text-gray-300">
                                  {rec.description}
                                </p>
                                {rec.start !== undefined && (
                                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gray-700/50 px-2 py-0.5 text-xs text-gray-400">
                                    <span>@</span>
                                    <span className="font-mono">{formatTime(rec.start)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pacing Suggestions */}
                  {aiInsights.pacingSuggestions && aiInsights.pacingSuggestions.length > 0 && (
                    <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-6">
                      <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                          <span className="text-xl">⏱️</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">Pacing Optimization</h4>
                      </div>
                      <div className="space-y-3">
                        {aiInsights.pacingSuggestions.slice(0, 3).map((pacing, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-4"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-semibold capitalize text-white">
                                {pacing.type}
                              </span>
                              <span className="text-xs text-emerald-400">
                                +{Math.round(pacing.expectedImpact * 100)}% impact
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">{pacing.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chapter Export */}
                  {aiInsights.seoMetadata &&
                    aiInsights.seoMetadata.chapters &&
                    aiInsights.seoMetadata.chapters.length > 0 && (
                      <ChapterExport
                        chapters={aiInsights.seoMetadata.chapters}
                        videoTitle={aiInsights.seoMetadata.title}
                        className="mb-5"
                      />
                    )}

                  {/* AI Insights - Use reusable component */}
                  {aiInsights && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="space-y-6"
                    >
                      <BeautifulInsightsView insights={aiInsights} />
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
