/**
 * Chapter Export Service
 * Handles exporting chapters in various formats including YouTube-friendly formats
 */

import { ChapterMarker } from "@/types";

// ============================================================================
// Export Format Types
// ============================================================================

/**
 * Supported export formats for chapters
 */
export type ChapterExportFormat =
  | "youtube" // YouTube description format (0:00 Title)
  | "youtube-bulk" // YouTube Studio bulk upload format
  | "plain-text" // Plain text with timestamps
  | "json"; // JSON export for developers

/**
 * Export result containing formatted content and metadata
 */
export interface ExportResult {
  /** Formatted content ready for export */
  content: string;
  /** File extension for download */
  fileExtension: string;
  /** MIME type for download */
  mimeType: string;
  /** Number of chapters exported */
  chapterCount: number;
  /** Whether export meets YouTube requirements */
  meetsYouTubeRequirements: boolean;
  /** Validation errors if any */
  validationErrors?: string[];
}

/**
 * YouTube chapter validation result
 */
export interface YouTubeValidationResult {
  /** Whether chapters are valid for YouTube */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Warnings (non-blocking) */
  warnings: string[];
}

// ============================================================================
// YouTube Constants & Rules
// ============================================================================

const YOUTUBE_REQUIREMENTS = {
  MIN_CHAPTERS: 3,
  MIN_DURATION_SECONDS: 10,
  FIRST_CHAPTER_START: 0,
} as const;

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export chapters in the specified format
 */
export function exportChapters(
  chapters: ChapterMarker[],
  format: ChapterExportFormat
): ExportResult {
  // Validate chapters
  const validation = validateForYouTube(chapters);
  const meetsRequirements = validation.isValid;

  // Generate content based on format
  let content: string;
  let fileExtension: string;
  let mimeType: string;

  switch (format) {
    case "youtube":
      content = generateYouTubeFormat(chapters);
      fileExtension = "txt";
      mimeType = "text/plain";
      break;

    case "youtube-bulk":
      content = generateYouTubeBulkFormat(chapters);
      fileExtension = "csv";
      mimeType = "text/csv";
      break;

    case "plain-text":
      content = generatePlainTextFormat(chapters);
      fileExtension = "txt";
      mimeType = "text/plain";
      break;

    case "json":
      content = generateJSONFormat(chapters);
      fileExtension = "json";
      mimeType = "application/json";
      break;

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  return {
    content,
    fileExtension,
    mimeType,
    chapterCount: chapters.length,
    meetsYouTubeRequirements: meetsRequirements,
    validationErrors: validation.errors.length > 0 ? validation.errors : undefined,
  };
}

// ============================================================================
// YouTube Format Generation
// ============================================================================

/**
 * Generate YouTube description format
 * Format: 0:00 Chapter Title
 */
function generateYouTubeFormat(chapters: ChapterMarker[]): string {
  return chapters
    .map((chapter) => {
      const timestamp = formatTimestampForYouTube(chapter.start);
      const title = optimizeChapterTitle(chapter.title);
      return `${timestamp} ${title}`;
    })
    .join("\n");
}

/**
 * Generate YouTube Studio bulk upload format
 * Format: timestamp,title
 */
function generateYouTubeBulkFormat(chapters: ChapterMarker[]): string {
  const header = "Timestamp,Title\n";
  const rows = chapters
    .map((chapter) => {
      const timestamp = formatTimestampForYouTube(chapter.start);
      const title = optimizeChapterTitle(chapter.title).replace(/"/g, '""');
      return `"${timestamp}","${title}"`;
    })
    .join("\n");

  return header + rows;
}

// ============================================================================
// Plain Text Format
// ============================================================================

/**
 * Generate plain text format with timestamps
 */
function generatePlainTextFormat(chapters: ChapterMarker[]): string {
  return chapters
    .map((chapter) => {
      const start = formatTimestampForYouTube(chapter.start);
      const end = formatTimestampForYouTube(chapter.end);
      const duration = formatDuration(chapter.end - chapter.start);
      const title = optimizeChapterTitle(chapter.title);

      let result = `${start} - ${end} | ${duration}\n`;
      result += `${title}`;

      if (chapter.description) {
        result += `\n${chapter.description}`;
      }

      if (chapter.retentionScore) {
        result += `\nRetention: ${Math.round(chapter.retentionScore * 100)}%`;
      }

      return result + "\n";
    })
    .join("\n" + "-".repeat(60) + "\n");
}

// ============================================================================
// JSON Format
// ============================================================================

/**
 * Generate JSON format for developers
 */
function generateJSONFormat(chapters: ChapterMarker[]): string {
  const exportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    chapterCount: chapters.length,
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      title: optimizeChapterTitle(chapter.title),
      description: chapter.description,
      startTime: chapter.start,
      endTime: chapter.end,
      duration: chapter.end - chapter.start,
      startTimeFormatted: formatTimestampForYouTube(chapter.start),
      endTimeFormatted: formatTimestampForYouTube(chapter.end),
      durationFormatted: formatDuration(chapter.end - chapter.start),
      isAIGenerated: chapter.isAIGenerated,
      retentionScore: chapter.retentionScore,
      engagementScore: chapter.engagementScore,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

// ============================================================================
// YouTube Validation
// ============================================================================

/**
 * Validate chapters against YouTube requirements
 */
export function validateForYouTube(chapters: ChapterMarker[]): YouTubeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum chapter count
  if (chapters.length < YOUTUBE_REQUIREMENTS.MIN_CHAPTERS) {
    errors.push(
      `YouTube requires at least ${YOUTUBE_REQUIREMENTS.MIN_CHAPTERS} chapters. You have ${chapters.length}.`
    );
  }

  // Check first chapter starts at 0:00
  if (chapters.length > 0 && chapters[0]?.start !== YOUTUBE_REQUIREMENTS.FIRST_CHAPTER_START) {
    errors.push(
      `First chapter must start at 0:00. Current start: ${formatTimestampForYouTube(chapters[0]?.start || 0)}`
    );
  }

  // Check minimum duration per chapter
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    if (!chapter) {
      continue;
    }

    const duration = chapter.end - chapter.start;
    if (duration < YOUTUBE_REQUIREMENTS.MIN_DURATION_SECONDS) {
      warnings.push(
        `Chapter "${chapter.title}" is only ${duration} seconds long. ` +
          `YouTube recommends at least ${YOUTUBE_REQUIREMENTS.MIN_DURATION_SECONDS} seconds.`
      );
    }
  }

  // Check for duplicate timestamps
  const timestamps = chapters.map((c) => c.start);
  const uniqueTimestamps = new Set(timestamps);
  if (timestamps.length !== uniqueTimestamps.size) {
    errors.push("Duplicate timestamps detected. Each chapter must start at a unique time.");
  }

  // Check title length (YouTube recommends under 100 chars per chapter)
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    if (chapter?.title && chapter.title.length > 100) {
      warnings.push(
        `Chapter "${chapter.title.substring(0, 50)}..." is too long. ` +
          `YouTube recommends under 100 characters.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format seconds into YouTube timestamp format (MM:SS or HH:MM:SS)
 */
function formatTimestampForYouTube(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }
}

/**
 * Format duration in seconds to human-readable format
 */
function formatDuration(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Optimize chapter title for SEO and readability
 * - Removes excessive whitespace
 * - Capitalizes first letter
 * - Removes special characters that might cause issues
 */
function optimizeChapterTitle(title: string): string {
  // Trim and normalize whitespace
  let optimized = title.trim().replace(/\s+/g, " ");

  // Remove or replace problematic characters
  optimized = optimized.replace(/[\r\n\t]/g, " ");

  // Ensure first letter is capitalized
  if (optimized.length > 0) {
    optimized = optimized.charAt(0).toUpperCase() + optimized.slice(1);
  }

  // Limit length to 100 characters for YouTube
  if (optimized.length > 100) {
    optimized = optimized.substring(0, 97) + "...";
  }

  return optimized;
}

/**
 * Generate a suggested filename for export
 */
export function generateExportFilename(format: ChapterExportFormat, videoTitle?: string): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const sanitizedTitle = videoTitle
    ? videoTitle.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)
    : "chapters";

  return `${sanitizedTitle}_chapters_${timestamp}.${getFileExtension(format)}`;
}

/**
 * Get file extension for a format
 */
function getFileExtension(format: ChapterExportFormat): string {
  switch (format) {
    case "youtube":
      return "txt";
    case "youtube-bulk":
      return "csv";
    case "plain-text":
      return "txt";
    case "json":
      return "json";
    default:
      return "txt";
  }
}

// ============================================================================
// Copy to Clipboard Helper
// ============================================================================

/**
 * Copy text to clipboard with error handling
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    // Fallback for browsers that don't support clipboard API
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
      return true;
    } catch (fallbackError) {
      console.error("Fallback clipboard copy failed:", fallbackError);
      return false;
    }
  }
}

/**
 * Trigger file download
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
