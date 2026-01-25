"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChapterMarker, TimelineSegment } from "@/types";
import { cn } from "@/utils/cn";
import { useState } from "react";

interface TimelineProps {
  duration: number;
  segments: TimelineSegment[];
  chapterMarkers: ChapterMarker[];
  currentTime?: number;
  onSegmentClick?: (segment: TimelineSegment) => void;
  onChapterClick?: (chapter: ChapterMarker) => void;
  className?: string;
}

export function Timeline({
  duration,
  segments,
  chapterMarkers,
  currentTime = 0,
  onSegmentClick,
  onChapterClick,
  className,
}: TimelineProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSegmentColor = (segment: TimelineSegment): string => {
    switch (segment.type) {
      case "speech":
        return "bg-blue-500";
      case "silence":
        return "bg-gray-600";
      case "action":
        return "bg-green-500";
      case "transition":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRetentionColor = (score?: number): string => {
    if (!score) {
      return "bg-gray-500";
    }
    if (score >= 0.8) {
      return "bg-green-500";
    }
    if (score >= 0.6) {
      return "bg-yellow-500";
    }
    return "bg-red-500";
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Timeline Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-300">Timeline</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-blue-500" />
              <span className="text-xs text-gray-400">Speech</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-gray-600" />
              <span className="text-xs text-gray-400">Silence</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500" />
              <span className="text-xs text-gray-400">Action</span>
            </div>
          </div>
        </div>
        <span className="text-sm text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Timeline Bar */}
      <div className="relative h-16 w-full overflow-hidden rounded-none bg-gray-800">
        {/* Progress Indicator */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-blue-600/20"
          style={{ width: `${(currentTime / duration) * 100}%` }}
          layout
          transition={{ duration: 0.2 }}
        />

        {/* Current Time Marker */}
        <motion.div
          className="absolute top-0 z-20 h-full w-0.5 bg-blue-500"
          style={{ left: `${(currentTime / duration) * 100}%` }}
          layout
        >
          <div className="absolute -left-1.5 -top-1 h-3 w-3 bg-blue-500 shadow-lg" />
        </motion.div>

        {/* Segments */}
        <div className="relative z-10 flex h-full w-full">
          {segments.map((segment, index) => {
            const left = (segment.start / duration) * 100;
            const width = ((segment.end - segment.start) / duration) * 100;
            const isHovered = hoveredSegment === segment.id;

            return (
              <motion.div
                key={segment.id}
                className={cn(
                  "relative h-full cursor-pointer",
                  getSegmentColor(segment),
                  segment.isSelected && "ring-2 ring-white ring-offset-2 ring-offset-gray-800"
                )}
                style={{ left: `${left}%`, width: `${width}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
                onClick={() => onSegmentClick?.(segment)}
                onMouseEnter={() => setHoveredSegment(segment.id)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                {/* Retention Score Indicator */}
                {segment.retentionScore && (
                  <motion.div
                    className={cn(
                      "absolute bottom-0 left-0 h-1",
                      getRetentionColor(segment.retentionScore)
                    )}
                    style={{ width: `${segment.retentionScore * 100}%` }}
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.02 + 0.1 }}
                  />
                )}

                {/* Tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      className="absolute -top-12 left-1/2 z-30 w-48 -translate-x-1/2 rounded-none bg-gray-900 p-3 shadow-xl"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="mb-1 text-xs font-medium text-white">
                        {segment.type.charAt(0).toUpperCase() + segment.type.slice(1)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTime(segment.start)} - {formatTime(segment.end)}
                      </div>
                      {segment.retentionScore && (
                        <div className="mt-1 text-xs text-gray-400">
                          Retention: {Math.round(segment.retentionScore * 100)}%
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Chapter Markers */}
        {chapterMarkers.map((chapter, index) => {
          const left = (chapter.start / duration) * 100;
          return (
            <motion.div
              key={chapter.id}
              className="absolute top-0 z-20 flex h-full w-0.5 cursor-pointer bg-yellow-500"
              style={{ left: `${left}%` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: index * 0.03 + 0.2 }}
              whileHover={{ scale: 1.2 }}
              onClick={() => onChapterClick?.(chapter)}
            >
              <div className="absolute -left-1 -top-1 h-2 w-2 bg-yellow-500" />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-yellow-500">
                {chapter.title}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Time Scale */}
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>0:00</span>
        <span>{formatTime(duration / 4)}</span>
        <span>{formatTime(duration / 2)}</span>
        <span>{formatTime((duration * 3) / 4)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
