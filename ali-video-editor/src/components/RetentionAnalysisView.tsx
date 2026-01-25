"use client";

import { RetentionAnalysis } from "@/types";

interface RetentionAnalysisViewProps {
  retentionAnalysis: RetentionAnalysis;
}

export function RetentionAnalysisView({ retentionAnalysis }: RetentionAnalysisViewProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
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
      {retentionAnalysis.suspenseMoments && retentionAnalysis.suspenseMoments.length > 0 && (
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
                  <p className="truncate text-sm text-gray-300">{moment.description}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-medium text-pink-400">Intensity:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 w-3 rounded-full ${
                            level <= Math.ceil(moment.intensity * 5) ? "bg-pink-500" : "bg-gray-600"
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
  );
}
