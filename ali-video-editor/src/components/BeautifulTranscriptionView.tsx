"use client";

import { TranscriptionResult } from "@/types";
import { Clock, FileText, MessageSquare, Sparkles } from "lucide-react";

interface BeautifulTranscriptionViewProps {
  transcription: TranscriptionResult;
}

export function BeautifulTranscriptionView({
  transcription,
}: BeautifulTranscriptionViewProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const wordCount = transcription.segments.reduce(
    (acc, seg) => acc + seg.text.split(" ").length,
    0
  );

  const avgDuration =
    transcription.segments.length > 0
      ? transcription.segments.reduce(
          (acc, seg) => acc + (seg.end - seg.start),
          0
        ) / transcription.segments.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Hero Stats Section */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 p-5 transition-all hover:shadow-lg hover:shadow-blue-500/20">
          <div className="absolute right-2 top-2 opacity-10">
            <FileText className="h-12 w-12 text-blue-400" />
          </div>
          <p className="text-xs font-medium text-blue-300 uppercase tracking-wider">
            Word Count
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{wordCount}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
            <Sparkles className="h-3 w-3" />
            <span>Full transcript</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm border border-green-500/30 p-5 transition-all hover:shadow-lg hover:shadow-green-500/20">
          <div className="absolute right-2 top-2 opacity-10">
            <MessageSquare className="h-12 w-12 text-green-400" />
          </div>
          <p className="text-xs font-medium text-green-300 uppercase tracking-wider">
            Confidence
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {Math.round(transcription.confidence * 100)}%
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-green-900/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600"
              style={{ width: `${transcription.confidence * 100}%` }}
            />
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 p-5 transition-all hover:shadow-lg hover:shadow-purple-500/20">
          <div className="absolute right-2 top-2 opacity-10">
            <Clock className="h-12 w-12 text-purple-400" />
          </div>
          <p className="text-xs font-medium text-purple-300 uppercase tracking-wider">
            Duration
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {formatTime(
              transcription.segments[transcription.segments.length - 1]?.end || 0
            )}
          </p>
          <p className="mt-2 text-xs text-purple-400">
            {transcription.segments.length} segments
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600/20 to-orange-800/20 backdrop-blur-sm border border-orange-500/30 p-5 transition-all hover:shadow-lg hover:shadow-orange-500/20">
          <p className="text-xs font-medium text-orange-300 uppercase tracking-wider">
            Language
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{transcription.language}</p>
          <p className="mt-2 text-xs text-orange-400">
            Detected automatically
          </p>
        </div>
      </div>

      {/* Full Transcript Section */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Full Transcript</h3>
              <p className="text-sm text-gray-400">
                Complete text with {wordCount} words
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(transcription.text);
            }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/10"
          >
            Copy
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto rounded-xl bg-gray-900/50 p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-200">
            {transcription.text}
          </p>
        </div>
      </div>

      {/* Segments Timeline */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Segment Timeline</h3>
              <p className="text-sm text-gray-400">
                Timestamped sections • Avg: {formatTime(avgDuration)} per segment
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {transcription.segments.map((segment, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/30 border border-gray-700/50 p-4 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-purple-500 to-blue-500" />
              <div className="flex items-start gap-4">
                <div className="flex shrink-0 items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-sm font-semibold text-purple-400">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                      {formatTime(segment.start)} - {formatTime(segment.end)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                      {Math.round(segment.confidence * 100)}% confidence
                    </span>
                    {segment.speaker && (
                      <span className="inline-flex items-center rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
                        {segment.speaker}
                      </span>
                    )}
                  </div>
                  <p className="text-base leading-relaxed text-gray-200">
                    {segment.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}