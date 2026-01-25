"use client";

import { AIInsights } from "@/types";
import {
  ArrowUp,
  Award,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Lightbulb,
  Tag,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

interface BeautifulInsightsViewProps {
  insights: AIInsights;
}

export function BeautifulInsightsView({ insights }: BeautifulInsightsViewProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  return (
    <div className="space-y-6">
      {/* Hero Score Section */}
      <div className="from-gradient-600/20 relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br to-purple-800/20 p-6 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10" />
        <div className="relative z-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-600">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Improvement Potential</h2>
                  <p className="text-sm text-gray-300">Based on AI analysis of your video</p>
                </div>
                {/* Confidence Badge */}
                {insights.improvementBreakdown && (
                  <span className={`ml-2 rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${
                    insights.improvementBreakdown.confidenceLevel === "high"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : insights.improvementBreakdown.confidenceLevel === "medium"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}>
                    {insights.improvementBreakdown.confidenceLevel} confidence
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-6xl font-bold text-white">
                  {insights.improvementBreakdown 
                    ? insights.improvementBreakdown.estimatedBoostPercent
                    : Math.round(insights.overallImprovementPotential * 100)}%
                </p>
                <p className="text-sm text-gray-300">
                  {insights.overallImprovementPotential > 0.7
                    ? "High potential for improvement"
                    : insights.overallImprovementPotential > 0.4
                      ? "Moderate room for growth"
                      : "Great performance overall"}
                </p>
              </div>
              <div className="flex h-24 w-24 items-center justify-center">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(139, 92, 246, 0.2)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    strokeDasharray={`${insights.overallImprovementPotential * 100}, 100`}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Factor Breakdown Grid */}
          {insights.improvementBreakdown && insights.improvementBreakdown.factors.length > 0 && (
            <div className="mt-6 border-t border-gray-700/50 pt-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Improvement Breakdown
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {insights.improvementBreakdown.factors
                  .filter(f => f.actionableItems > 0)
                  .slice(0, 6)
                  .map((factor, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between rounded-xl bg-gray-800/60 px-4 py-3 transition-colors hover:bg-gray-800/80"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {factor.name === "Title Optimization" && "📝"}
                          {factor.name === "Description Optimization" && "✍️"}
                          {factor.name === "Tags & Keywords" && "🏷️"}
                          {factor.name === "Content Suggestions" && "📖"}
                          {factor.name === "Thumbnail Optimization" && "🖼️"}
                          {factor.name === "Retention Potential" && "📈"}
                          {factor.name === "Metadata Completeness" && "✅"}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">{factor.name}</p>
                          <p className="text-xs text-gray-400">
                            {factor.actionableItems} action{factor.actionableItems !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-400">
                          +{Math.round(factor.contribution * 100)}%
                        </p>
                        <div className="mt-1 h-1.5 w-12 overflow-hidden rounded-full bg-gray-700">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            style={{ width: `${factor.score * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Insights Section */}
      <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 backdrop-blur-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Top Actionable Insights</h3>
            <p className="text-sm text-gray-400">Key areas to focus on for better results</p>
          </div>
        </div>
        <div className="space-y-3">
          {insights.topInsights.map((insight, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/20 p-4 transition-all hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10"
            >
              <div className="flex items-start gap-4">
                <div className="flex shrink-0 items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/20 text-sm font-semibold text-yellow-400">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-base leading-relaxed text-gray-200">{insight}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-yellow-500/50 transition-colors group-hover:text-yellow-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEO Metadata Section */}
      <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">SEO Metadata</h3>
              <p className="text-sm text-gray-400">
                Optimized for discoverability • Score:{" "}
                {Math.round(insights.seoMetadata.seoScore * 100)}%
              </p>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/20">
            <Award className="h-6 w-6 text-green-400" />
          </div>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div className="rounded-xl bg-gray-900/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-400" />
                <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
                  Optimized Title
                </p>
              </div>
              <button
                onClick={() => handleCopy(insights.seoMetadata.title, "title")}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                title="Copy title"
              >
                <Copy className="h-3 w-3" />
                {copiedSection === "title" ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-lg font-semibold text-white">{insights.seoMetadata.title}</p>
          </div>

          {/* Description */}
          <div className="rounded-xl bg-gray-900/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-400" />
                <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
                  Description
                </p>
              </div>
              <button
                onClick={() => handleCopy(insights.seoMetadata.description, "description")}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                title="Copy description"
              >
                <Copy className="h-3 w-3" />
                {copiedSection === "description" ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">
              {insights.seoMetadata.description}
            </p>
          </div>

          {/* Tags */}
          <div className="rounded-xl bg-gray-900/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-400" />
                <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
                  Keywords & Tags
                </p>
              </div>
              <button
                onClick={() =>
                  handleCopy(insights.seoMetadata.tags.map((tag) => `#${tag}`).join(", "), "tags")
                }
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                title="Copy tags (comma-separated)"
              >
                <Copy className="h-3 w-3" />
                {copiedSection === "tags" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {insights.seoMetadata.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex cursor-pointer items-center rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Chapters */}
          {insights.seoMetadata.chapters.length > 0 && (
            <div className="rounded-xl bg-gray-900/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
                  Video Chapters
                </p>
              </div>
              <div className="space-y-2">
                {insights.seoMetadata.chapters.map((chapter, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/20 text-xs font-semibold text-blue-400">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-white">{chapter.title}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {Math.floor(chapter.start / 60)}:
                      {Math.floor(chapter.start % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Script Suggestions */}
      {insights.scriptSuggestions.length > 0 && (
        <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Script Suggestions</h3>
              <p className="text-sm text-gray-400">
                {insights.scriptSuggestions.length} recommendations
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {insights.scriptSuggestions.slice(0, 5).map((suggestion, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl border border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/20 p-4 transition-all hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10"
              >
                <div className="flex items-start gap-4">
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 text-sm font-semibold text-green-400">
                      {index + 1}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <ArrowUp className="h-3 w-3" />
                      <span>{Math.round(suggestion.expectedImpact * 100)}% impact</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium capitalize text-green-400">
                        {suggestion.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        Priority: {suggestion.priority}/5
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-200">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Recommendations */}
      {insights.visualRecommendations.length > 0 && (
        <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Visual Recommendations</h3>
              <p className="text-sm text-gray-400">
                {insights.visualRecommendations.length} enhancements
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {insights.visualRecommendations.slice(0, 5).map((rec, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl border border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/20 p-4 transition-all hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10"
              >
                <div className="flex items-start gap-4">
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 text-sm font-semibold text-pink-400">
                      {index + 1}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-pink-400">
                      <ArrowUp className="h-3 w-3" />
                      <span>{Math.round(rec.expectedImpact * 100)}% impact</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-pink-500/10 px-3 py-1 text-xs font-medium capitalize text-pink-400">
                        {rec.type}
                      </span>
                      <span className="text-xs text-gray-400">Priority: {rec.priority}/5</span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-200">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pacing Suggestions */}
      {insights.pacingSuggestions.length > 0 && (
        <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Pacing Suggestions</h3>
              <p className="text-sm text-gray-400">
                {insights.pacingSuggestions.length} timing adjustments
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {insights.pacingSuggestions.slice(0, 5).map((suggestion, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl border border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/20 p-4 transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10"
              >
                <div className="flex items-start gap-4">
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 text-sm font-semibold text-orange-400">
                      {index + 1}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-orange-400">
                      <ArrowUp className="h-3 w-3" />
                      <span>{Math.round(suggestion.expectedImpact * 100)}% impact</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium capitalize text-orange-400">
                        {suggestion.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        Priority: {suggestion.priority}/5
                      </span>
                      {suggestion.speedMultiplier && (
                        <span className="text-xs text-gray-400">
                          Speed: {suggestion.speedMultiplier}x
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-gray-200">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
