/**
 * Database Schema Types
 *
 * TypeScript types matching the SQLite database schema for video analysis history
 */

// ============================================================================
// Core Database Tables
// ============================================================================

/**
 * Core video metadata table
 */
export interface DBVideo {
  id: string;
  filename: string;
  filepath: string | null;
  file_size: number | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  codec: string | null;
  uploaded_at: string;
  created_at: string;
}

/**
 * Transcription results table
 */
export interface DBTranscription {
  id: string;
  video_id: string;
  full_text: string;
  language: string | null;
  confidence: number | null;
  processing_duration: number | null;
  created_at: string;
}

/**
 * Transcription segments table (for timeline sync)
 */
export interface DBTranscriptionSegment {
  id: number;
  transcription_id: string;
  text: string;
  start_time: number;
  end_time: number;
  confidence: number | null;
  speaker: string | null;
}

/**
 * Analysis sessions table (one per analyze click)
 */
export interface DBAnalysisSession {
  id: string;
  video_id: string;
  transcription_id: string | null;
  status: "pending" | "processing" | "completed" | "error";
  overall_score: number | null;
  keyframes_count: number | null;
  processing_time_ms: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Category analysis results table
 */
export interface DBCategoryResult {
  id: number;
  session_id: string;
  category: string;
  score: number | null;
  response_json: string;
  processing_time_ms: number | null;
  created_at: string;
}

/**
 * Individual issues extracted from analysis
 */
export interface DBAnalysisIssue {
  id: number;
  session_id: string;
  category: string;
  severity: "critical" | "major" | "minor" | "suggestion";
  timestamp_start: number | null;
  timestamp_end: number | null;
  title: string;
  description: string;
  suggested_fix: string | null;
  created_at: string;
}

/**
 * Keyframes table
 */
export interface DBKeyframe {
  id: number;
  session_id: string;
  timestamp: number;
  file_path: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
}

// ============================================================================
// UI-Friendly Types
// ============================================================================

/**
 * List item for history view
 */
export interface HistoryListItem {
  id: string; // session_id
  videoId: string;
  filename: string;
  duration: number | null;
  uploadedAt: string;
  analyzedAt: string;
  overallScore: number | null;
  status: DBAnalysisSession["status"];
  issuesCritical: number;
  issuesMajor: number;
  issuesMinor: number;
  issuesSuggestion: number;
}

/**
 * Full detail for history view
 */
export interface HistoryDetail extends HistoryListItem {
  transcription: string | null;
  categoryResults: Array<{
    category: string;
    score: number | null;
    response: unknown;
  }>;
  issues: DBAnalysisIssue[];
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalVideos: number;
  totalAnalyses: number;
  averageScore: number | null;
  recentAnalyses: HistoryListItem[];
}

/**
 * Query parameters for history list
 */
export interface HistoryQuery {
  search?: string;
  sortBy?: "date" | "score" | "filename";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  status?: "completed" | "error" | "all";
}
