/**
 * History Card Component
 *
 * Displays a single history item in the list
 */

import { motion } from "framer-motion";
import type { HistoryListItem } from "@/lib/database/schema";

interface HistoryCardProps {
  item: HistoryListItem;
  index?: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function HistoryCard({ item, index = 0, isSelected, onSelect, onDelete }: HistoryCardProps) {
  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) {
      return "—";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) {
      return "text-gray-400";
    }
    if (score >= 80) {
      return "text-green-400";
    }
    if (score >= 60) {
      return "text-yellow-400";
    }
    return "text-red-400";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "processing":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <motion.div
      onClick={onSelect}
      className={`cursor-pointer border-b border-gray-700 p-4 hover:bg-gray-800 ${
        isSelected ? "border-l-2 border-l-blue-500 bg-blue-900/30" : ""
      }`}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: index * 0.05,
      }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="mb-2 flex items-start justify-between">
        <h4 className="flex-1 truncate font-medium text-white">{item.filename}</h4>
        <div className="ml-2 flex items-center gap-2">
          <div className={`h-2 w-2 ${getStatusColor(item.status)}`} />
          <span className={`text-lg font-bold ${getScoreColor(item.overallScore)}`}>
            {item.overallScore !== null ? `${Math.round(item.overallScore * 100)}%` : "—"}
          </span>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-3 text-xs text-gray-400">
        <span>{formatDate(item.analyzedAt)}</span>
        <span>•</span>
        <span>{formatDuration(item.duration)}</span>
      </div>

      {/* Issue badges */}
      <div className="flex flex-wrap gap-2">
        {item.issuesCritical > 0 && (
          <span className="rounded bg-red-900/50 px-2 py-0.5 text-xs text-red-300">
            {item.issuesCritical} critical
          </span>
        )}
        {item.issuesMajor > 0 && (
          <span className="rounded bg-orange-900/50 px-2 py-0.5 text-xs text-orange-300">
            {item.issuesMajor} major
          </span>
        )}
        {item.issuesMinor > 0 && (
          <span className="rounded bg-yellow-900/50 px-2 py-0.5 text-xs text-yellow-300">
            {item.issuesMinor} minor
          </span>
        )}
        {item.issuesSuggestion > 0 && (
          <span className="rounded bg-blue-900/50 px-2 py-0.5 text-xs text-blue-300">
            {item.issuesSuggestion} tips
          </span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="mt-3 text-xs text-red-400 hover:text-red-300"
      >
        Delete
      </button>
    </motion.div>
  );
}
