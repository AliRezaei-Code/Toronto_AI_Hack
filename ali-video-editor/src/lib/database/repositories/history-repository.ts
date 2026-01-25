/**
 * History Repository
 *
 * Provides UI-friendly queries for browsing analysis history
 */

import { database } from "../database";
import type { DashboardStats, HistoryDetail, HistoryListItem, HistoryQuery } from "../schema";

/**
 * History Repository
 */
export class HistoryRepository {
  /**
   * Get paginated list of analysis history
   */
  getHistoryList(query: HistoryQuery = {}): { items: HistoryListItem[]; total: number } {
    const db = database.getDb();

    const {
      search = "",
      sortBy = "date",
      sortOrder = "desc",
      limit = 20,
      offset = 0,
      status = "all",
    } = query;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push("v.filename LIKE ?");
      params.push(`%${search}%`);
    }

    if (status !== "all") {
      conditions.push("s.status = ?");
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Sort mapping
    const sortColumn = {
      date: "s.created_at",
      score: "s.overall_score",
      filename: "v.filename",
    }[sortBy];

    // Count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM analysis_sessions s
      JOIN videos v ON s.video_id = v.id
      ${whereClause}
    `;
    const { total } = db.prepare(countSql).get(...params) as { total: number };

    // Main query with issue counts
    const sql = `
      SELECT
        s.id,
        s.video_id as videoId,
        v.filename,
        v.duration,
        v.uploaded_at as uploadedAt,
        s.created_at as analyzedAt,
        s.overall_score as overallScore,
        s.status,
        COALESCE(SUM(CASE WHEN i.severity = 'critical' THEN 1 ELSE 0 END), 0) as issuesCritical,
        COALESCE(SUM(CASE WHEN i.severity = 'major' THEN 1 ELSE 0 END), 0) as issuesMajor,
        COALESCE(SUM(CASE WHEN i.severity = 'minor' THEN 1 ELSE 0 END), 0) as issuesMinor,
        COALESCE(SUM(CASE WHEN i.severity = 'suggestion' THEN 1 ELSE 0 END), 0) as issuesSuggestion
      FROM analysis_sessions s
      JOIN videos v ON s.video_id = v.id
      LEFT JOIN analysis_issues i ON s.id = i.session_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const items = db.prepare(sql).all(...params, limit, offset) as HistoryListItem[];

    return { items, total };
  }

  /**
   * Get full detail for a single analysis session
   */
  getHistoryDetail(sessionId: string): HistoryDetail | null {
    const db = database.getDb();

    // Get base info
    const baseSql = `
      SELECT
        s.id,
        s.video_id as videoId,
        v.filename,
        v.duration,
        v.uploaded_at as uploadedAt,
        s.created_at as analyzedAt,
        s.overall_score as overallScore,
        s.status,
        t.full_text as transcription
      FROM analysis_sessions s
      JOIN videos v ON s.video_id = v.id
      LEFT JOIN transcriptions t ON s.transcription_id = t.id
      WHERE s.id = ?
    `;

    const base = db.prepare(baseSql).get(sessionId) as
      | (HistoryDetail & { transcription: string | null })
      | null;
    if (!base) {
      return null;
    }

    // Get category results
    const categoryResults = db
      .prepare(
        `SELECT category, score, response_json as response FROM category_results WHERE session_id = ?`
      )
      .all(sessionId) as Array<{ category: string; score: number | null; response: string }>;

    // Get issues
    interface AnalysisIssueRow {
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
    const issues = db
      .prepare(
        `SELECT * FROM analysis_issues WHERE session_id = ? ORDER BY severity, timestamp_start`
      )
      .all(sessionId) as AnalysisIssueRow[];

    // Get issue counts
    const issueCounts = db
      .prepare(
        `
        SELECT
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as issuesCritical,
          SUM(CASE WHEN severity = 'major' THEN 1 ELSE 0 END) as issuesMajor,
          SUM(CASE WHEN severity = 'minor' THEN 1 ELSE 0 END) as issuesMinor,
          SUM(CASE WHEN severity = 'suggestion' THEN 1 ELSE 0 END) as issuesSuggestion
        FROM analysis_issues WHERE session_id = ?
      `
      )
      .get(sessionId) as {
      issuesCritical: number;
      issuesMajor: number;
      issuesMinor: number;
      issuesSuggestion: number;
    };

    return {
      ...base,
      ...issueCounts,
      categoryResults: categoryResults.map((cr) => ({
        category: cr.category,
        score: cr.score,
        response: JSON.parse(cr.response),
      })),
      issues,
    };
  }

  /**
   * Get statistics for dashboard
   */
  getStats(): DashboardStats {
    const db = database.getDb();

    const stats = db
      .prepare(
        `
        SELECT
          (SELECT COUNT(*) FROM videos) as totalVideos,
          (SELECT COUNT(*) FROM analysis_sessions WHERE status = 'completed') as totalAnalyses,
          (SELECT AVG(overall_score) FROM analysis_sessions WHERE status = 'completed') as averageScore
      `
      )
      .get() as { totalVideos: number; totalAnalyses: number; averageScore: number | null };

    const { items: recentAnalyses } = this.getHistoryList({ limit: 5, sortBy: "date" });

    return { ...stats, recentAnalyses };
  }

  /**
   * Search analyses by filename
   */
  searchAnalyses(searchTerm: string, limit: number = 10): HistoryListItem[] {
    const db = database.getDb();

    const sql = `
      SELECT
        s.id,
        s.video_id as videoId,
        v.filename,
        v.duration,
        v.uploaded_at as uploadedAt,
        s.created_at as analyzedAt,
        s.overall_score as overallScore,
        s.status,
        COALESCE(SUM(CASE WHEN i.severity = 'critical' THEN 1 ELSE 0 END), 0) as issuesCritical,
        COALESCE(SUM(CASE WHEN i.severity = 'major' THEN 1 ELSE 0 END), 0) as issuesMajor,
        COALESCE(SUM(CASE WHEN i.severity = 'minor' THEN 1 ELSE 0 END), 0) as issuesMinor,
        COALESCE(SUM(CASE WHEN i.severity = 'suggestion' THEN 1 ELSE 0 END), 0) as issuesSuggestion
      FROM analysis_sessions s
      JOIN videos v ON s.video_id = v.id
      LEFT JOIN analysis_issues i ON s.id = i.session_id
      WHERE v.filename LIKE ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `;

    return db.prepare(sql).all(`%${searchTerm}%`, limit) as HistoryListItem[];
  }
}

export const historyRepository = new HistoryRepository();
