/**
 * Transcription Formatter Utilities
 *
 * Formats transcription data for LLM consumption with proper timestamps
 * and speaker diarization annotations.
 *
 * @module transcription-formatter
 */

import type { TranscriptionResult, TranscriptionSegment } from "../../types";

// ============================================================================
// Timestamp Formatting
// ============================================================================

/**
 * Format seconds to timestamp string (MM:SS or HH:MM:SS)
 */
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Format seconds to timestamp with milliseconds
 */
export function formatTimestampPrecise(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

// ============================================================================
// Speaker Utilities
// ============================================================================

/**
 * Count unique speakers in transcription
 */
export function countUniqueSpeakers(transcription: TranscriptionResult): number {
  const speakers = new Set<string>();

  for (const segment of transcription.segments) {
    if (segment.speaker) {
      speakers.add(segment.speaker);
    }
    // Also check word-level speakers
    for (const word of segment.words) {
      if (word.speaker) {
        speakers.add(word.speaker);
      }
    }
  }

  return speakers.size;
}

/**
 * Get list of unique speaker labels
 */
export function getUniqueSpeakers(transcription: TranscriptionResult): string[] {
  const speakers = new Set<string>();

  for (const segment of transcription.segments) {
    const label = segment.speakerLabel || (segment.speaker ? `Speaker ${parseInt(segment.speaker) + 1}` : null);
    if (label) {
      speakers.add(label);
    }
  }

  return Array.from(speakers).sort();
}

// ============================================================================
// LLM Formatting
// ============================================================================

/**
 * Format transcription with timestamps and speaker diarization for LLM consumption
 *
 * Output format:
 * [00:00] Speaker 1: Hello, welcome to our video.
 * [00:05] Speaker 2: Thanks for having me.
 * [00:12] Speaker 1: Let's dive into the topic...
 */
export function formatTranscriptionForLLM(transcription: TranscriptionResult): string {
  const lines: string[] = [];

  for (const segment of transcription.segments) {
    const timestamp = formatTimestamp(segment.start);
    const speaker = segment.speakerLabel || (segment.speaker ? `Speaker ${parseInt(segment.speaker) + 1}` : "Narrator");
    const text = segment.text.trim();

    if (text) {
      lines.push(`[${timestamp}] ${speaker}: ${text}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format transcription with time ranges for detailed analysis
 *
 * Output format:
 * [00:00 - 00:15] Speaker 1: Hello, welcome to our video about editing.
 */
export function formatTranscriptionWithRanges(transcription: TranscriptionResult): string {
  const lines: string[] = [];

  for (const segment of transcription.segments) {
    const startTs = formatTimestamp(segment.start);
    const endTs = formatTimestamp(segment.end);
    const speaker = segment.speakerLabel || (segment.speaker ? `Speaker ${parseInt(segment.speaker) + 1}` : "Narrator");
    const text = segment.text.trim();

    if (text) {
      lines.push(`[${startTs} - ${endTs}] ${speaker}: ${text}`);
    }
  }

  return lines.join("\n");
}

/**
 * Create speaker summary statistics for LLM context
 *
 * Output:
 * Speaker 1: 450 words, 3m 25s speaking time
 * Speaker 2: 280 words, 2m 10s speaking time
 */
export function createSpeakerSummary(transcription: TranscriptionResult): string {
  const speakerStats = new Map<string, { wordCount: number; duration: number; segmentCount: number }>();

  for (const segment of transcription.segments) {
    const speaker = segment.speakerLabel || (segment.speaker ? `Speaker ${parseInt(segment.speaker) + 1}` : "Narrator");
    const stats = speakerStats.get(speaker) || { wordCount: 0, duration: 0, segmentCount: 0 };

    stats.wordCount += segment.words.length;
    stats.duration += segment.end - segment.start;
    stats.segmentCount += 1;

    speakerStats.set(speaker, stats);
  }

  return Array.from(speakerStats.entries())
    .sort(([, a], [, b]) => b.duration - a.duration) // Sort by speaking time
    .map(([speaker, stats]) => {
      const mins = Math.floor(stats.duration / 60);
      const secs = Math.floor(stats.duration % 60);
      const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      return `${speaker}: ${stats.wordCount} words, ${timeStr} speaking time (${stats.segmentCount} segments)`;
    })
    .join("\n");
}

/**
 * Create a condensed transcript for token-limited contexts
 * Summarizes by speaker turns without word-level details
 */
export function createCondensedTranscript(
  transcription: TranscriptionResult,
  maxLength: number = 4000
): string {
  const lines: string[] = [];
  let currentLength = 0;

  for (const segment of transcription.segments) {
    const timestamp = formatTimestamp(segment.start);
    const speaker = segment.speakerLabel || (segment.speaker ? `Speaker ${parseInt(segment.speaker) + 1}` : "Narrator");
    const text = segment.text.trim();

    const line = `[${timestamp}] ${speaker}: ${text}`;

    if (currentLength + line.length > maxLength) {
      lines.push("... [transcript truncated for brevity]");
      break;
    }

    lines.push(line);
    currentLength += line.length + 1; // +1 for newline
  }

  return lines.join("\n");
}

/**
 * Extract transcript segments for a specific time range
 */
export function extractTimeRangeSegments(
  transcription: TranscriptionResult,
  startTime: number,
  endTime: number
): TranscriptionSegment[] {
  return transcription.segments.filter(
    (segment) => segment.start >= startTime && segment.end <= endTime
  );
}

/**
 * Format a subset of the transcript for a specific time range
 */
export function formatTimeRange(
  transcription: TranscriptionResult,
  startTime: number,
  endTime: number
): string {
  const segments = extractTimeRangeSegments(transcription, startTime, endTime);
  const lines: string[] = [];

  for (const segment of segments) {
    const timestamp = formatTimestamp(segment.start);
    const speaker = segment.speakerLabel || (segment.speaker ? `Speaker ${parseInt(segment.speaker) + 1}` : "Narrator");
    lines.push(`[${timestamp}] ${speaker}: ${segment.text.trim()}`);
  }

  return lines.join("\n");
}

// ============================================================================
// Diarized Text Generation
// ============================================================================

/**
 * Generate full diarized text with speaker annotations
 * Similar to formatTranscriptionForLLM but without timestamps
 */
export function generateDiarizedText(transcription: TranscriptionResult): string {
  let previousSpeaker: string | null = null;
  const parts: string[] = [];

  for (const segment of transcription.segments) {
    const speaker = segment.speakerLabel || (segment.speaker ? `Speaker ${parseInt(segment.speaker) + 1}` : "Narrator");
    const text = segment.text.trim();

    if (!text) {
      continue;
    }

    // Only add speaker label if it changed
    if (speaker !== previousSpeaker) {
      parts.push(`\n${speaker}:\n${text}`);
      previousSpeaker = speaker;
    } else {
      parts.push(text);
    }
  }

  return parts.join(" ").trim();
}

// ============================================================================
// Exports
// ============================================================================

// Named exports available above - individual function exports preferred over default
// Re-export all functions for convenience bundling
export const transcriptionFormatter = {
  formatTimestamp,
  formatTimestampPrecise,
  countUniqueSpeakers,
  getUniqueSpeakers,
  formatTranscriptionForLLM,
  formatTranscriptionWithRanges,
  createSpeakerSummary,
  createCondensedTranscript,
  extractTimeRangeSegments,
  formatTimeRange,
  generateDiarizedText,
};
