/**
 * History Detail Component
 *
 * Displays full detail for a selected analysis including
 * retention analysis, AI insights, and transcription
 */

import { BeautifulInsightsView } from "@/components/BeautifulInsightsView";
import { RetentionAnalysisView } from "@/components/RetentionAnalysisView";
import type { HistoryDetail as BrowserHistoryDetail } from "@/lib/database/browser-history-service";
import type { HistoryDetail as SchemaHistoryDetail } from "@/lib/database/schema";

// Support both SQLite and IndexedDB detail formats
type HistoryDetailType = SchemaHistoryDetail | BrowserHistoryDetail;

interface HistoryDetailProps {
  detail: HistoryDetailType;
  onExport: () => void;
  onDelete: () => void;
  onRestore?: () => void;
}

// Type guard to check if detail is from browser history
function isBrowserDetail(detail: HistoryDetailType): detail is BrowserHistoryDetail {
  return "retentionAnalysis" in detail || "aiInsights" in detail || !("categoryResults" in detail);
}

export function HistoryDetail({ detail, onExport, onDelete, onRestore }: HistoryDetailProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) {
      return "—";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-900/50 text-red-300 border-red-700";
      case "major":
        return "bg-orange-900/50 text-orange-300 border-orange-700";
      case "minor":
        return "bg-yellow-900/50 text-yellow-300 border-yellow-700";
      case "suggestion":
        return "bg-blue-900/50 text-blue-300 border-blue-700";
      default:
        return "bg-gray-900/50 text-gray-300 border-gray-700";
    }
  };

  // For browser history details
  if (isBrowserDetail(detail)) {
    const analyzedAt =
      detail.createdAt instanceof Date
        ? detail.createdAt.toLocaleString()
        : new Date(detail.createdAt).toLocaleString();

    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="border-b border-gray-700 pb-4">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white">{detail.filename}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Duration: {formatDuration(detail.duration)}</span>
                <span>Analyzed: {analyzedAt}</span>
                <span>
                  Score:{" "}
                  {detail.overallScore !== null ? `${Math.round(detail.overallScore * 100)}%` : "—"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {onRestore &&
                (detail.hasTranscription ||
                  detail.retentionAnalysis ||
                  detail.aiInsights ||
                  detail.hasAnalysisResult) && (
                  <button
                    onClick={onRestore}
                    className="rounded-none bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                  >
                    Restore to Workspace
                  </button>
                )}
              <button
                onClick={onExport}
                className="rounded-none bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                Export JSON
              </button>
              <button
                onClick={onDelete}
                className="rounded-none bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap gap-3">
            {detail.hasVideo && (
              <span className="rounded-none bg-green-900/50 px-3 py-1 text-sm text-green-300">
                ✓ Video Saved
              </span>
            )}
            {detail.hasTranscription && (
              <span className="rounded-none bg-green-900/50 px-3 py-1 text-sm text-green-300">
                ✓ Transcription
              </span>
            )}
            {detail.hasKeyframes && (
              <span className="rounded-none bg-cyan-900/50 px-3 py-1 text-sm text-cyan-300">
                ✓ Keyframes
              </span>
            )}
            {detail.hasAnalysisResult && (
              <span className="rounded-none bg-emerald-900/50 px-3 py-1 text-sm text-emerald-300">
                ✓ Full Analysis
              </span>
            )}
            {detail.retentionAnalysis && (
              <span className="rounded-none bg-blue-900/50 px-3 py-1 text-sm text-blue-300">
                ✓ Retention Analysis
              </span>
            )}
            {detail.aiInsights && (
              <span className="rounded-none bg-purple-900/50 px-3 py-1 text-sm text-purple-300">
                ✓ AI Insights
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        {detail.summary && (
          <section>
            <h3 className="mb-4 text-lg font-semibold text-white">Summary</h3>
            <p className="text-gray-300">{detail.summary}</p>
          </section>
        )}

        {/* Retention Analysis */}
        {detail.retentionAnalysis && (
          <section>
            <h3 className="mb-4 text-lg font-semibold text-white">Retention Analysis</h3>
            <RetentionAnalysisView retentionAnalysis={detail.retentionAnalysis} />
          </section>
        )}

        {/* AI Insights */}
        {detail.aiInsights && (
          <section>
            <h3 className="mb-4 text-lg font-semibold text-white">AI Insights</h3>
            <BeautifulInsightsView insights={detail.aiInsights} />
          </section>
        )}

        {/* Transcription */}
        {detail.transcription && (
          <section>
            <h3 className="mb-4 text-lg font-semibold text-white">Transcription</h3>
            <div className="max-h-96 overflow-y-auto rounded-none border border-gray-700 bg-gray-900 p-4">
              <p className="whitespace-pre-wrap text-gray-300">{detail.transcription.text}</p>
            </div>
          </section>
        )}
      </div>
    );
  }

  // For SQLite history details (original implementation)
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-white">{detail.filename}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Duration: {formatDuration(detail.duration)}</span>
              <span>Analyzed: {new Date(detail.analyzedAt).toLocaleString()}</span>
              <span>
                Score:{" "}
                {detail.overallScore !== null ? `${Math.round(detail.overallScore * 100)}%` : "—"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onExport}
              className="rounded-none bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Export JSON
            </button>
            <button
              onClick={onDelete}
              className="rounded-none bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Issue Summary */}
        <div className="flex flex-wrap gap-3">
          <span className="rounded-none bg-red-900/50 px-3 py-1 text-sm text-red-300">
            {detail.issuesCritical} Critical
          </span>
          <span className="rounded-none bg-orange-900/50 px-3 py-1 text-sm text-orange-300">
            {detail.issuesMajor} Major
          </span>
          <span className="rounded-none bg-yellow-900/50 px-3 py-1 text-sm text-yellow-300">
            {detail.issuesMinor} Minor
          </span>
          <span className="rounded-none bg-blue-900/50 px-3 py-1 text-sm text-blue-300">
            {detail.issuesSuggestion} Suggestions
          </span>
        </div>
      </div>

      {/* Category Results */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-white">Category Analysis</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {detail.categoryResults.map((cat) => (
            <div key={cat.category} className="rounded-none border border-gray-700 bg-gray-900 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium capitalize text-white">
                  {cat.category.replace(/_/g, " ")}
                </h4>
                <span
                  className={`text-lg font-bold ${cat.score && cat.score >= 0.8 ? "text-green-400" : cat.score && cat.score >= 0.6 ? "text-yellow-400" : "text-red-400"}`}
                >
                  {cat.score !== null ? `${Math.round(cat.score * 100)}%` : "—"}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {cat.response && typeof cat.response === "object" && "summary" in cat.response
                  ? (cat.response as { summary?: string }).summary
                  : "Analysis complete"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Issues */}
      {detail.issues.length > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-semibold text-white">Issues & Recommendations</h3>
          <div className="space-y-3">
            {detail.issues.map((issue) => (
              <div
                key={issue.id}
                className={`rounded-none border p-4 ${getSeverityColor(issue.severity)}`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-medium capitalize">{issue.title}</h4>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase">
                    {issue.severity}
                  </span>
                </div>
                <p className="mb-2 text-sm">{issue.description}</p>
                {issue.suggested_fix && (
                  <p className="text-sm font-medium">
                    <span className="opacity-75">Suggested fix:</span> {issue.suggested_fix}
                  </p>
                )}
                {issue.timestamp_start !== null && (
                  <div className="mt-2 text-xs opacity-75">
                    Timestamp: {issue.timestamp_start.toFixed(2)}s -{" "}
                    {issue.timestamp_end !== null ? issue.timestamp_end.toFixed(2) + "s" : "—"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transcription */}
      {detail.transcription && (
        <section>
          <h3 className="mb-4 text-lg font-semibold text-white">Transcription</h3>
          <div className="max-h-96 overflow-y-auto rounded-none border border-gray-700 bg-gray-900 p-4">
            <p className="whitespace-pre-wrap text-gray-300">{detail.transcription}</p>
          </div>
        </section>
      )}
    </div>
  );
}
