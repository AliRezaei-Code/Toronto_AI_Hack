/**
 * Analysis Repository
 *
 * Handles CRUD operations for video analysis sessions and results
 */

import { v4 as uuidv4 } from "uuid";
import type { FullVideoAnalysis } from "../../ai/gemini-service";
import { database } from "../database";
import type { DBAnalysisIssue, DBAnalysisSession, DBCategoryResult } from "../schema";

/**
 * Analysis Repository
 */
export class AnalysisRepository {
  /**
   * Save complete analysis session with all category results
   */
  saveAnalysis(
    videoId: string,
    transcriptionId: string | null,
    analysis: FullVideoAnalysis
  ): string {
    const db = database.getDb();
    const sessionId = uuidv4();

    const insertSession = db.prepare(`
      INSERT INTO analysis_sessions (
        id, video_id, transcription_id, status, overall_score,
        keyframes_count, processing_time_ms, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCategory = db.prepare(`
      INSERT INTO category_results (session_id, category, score, response_json, processing_time_ms)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertIssue = db.prepare(`
      INSERT INTO analysis_issues (
        session_id, category, severity, timestamp_start, timestamp_end,
        title, description, suggested_fix
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Transaction for atomicity
    const transaction = db.transaction(() => {
      // Insert session
      insertSession.run(
        sessionId,
        videoId,
        transcriptionId,
        "completed",
        analysis.overallScore,
        analysis.categoryResults ? Object.keys(analysis.categoryResults).length : 0,
        analysis.processingTimeMs,
        analysis.analyzedAt.toISOString()
      );

      // Insert category results
      for (const [category, result] of Object.entries(analysis.categoryResults)) {
        if (result !== null) {
          insertCategory.run(
            sessionId,
            category,
            result.overallScore ?? null,
            JSON.stringify(result),
            null
          );
        }
      }

      // Insert issues
      for (const issue of analysis.allIssues) {
        insertIssue.run(
          sessionId,
          issue.category ?? "general",
          issue.severity,
          issue.timestamp.start ?? null,
          issue.timestamp.end ?? null,
          issue.title,
          issue.description,
          issue.recommendation ?? null
        );
      }
    });

    transaction();

    return sessionId;
  }

  /**
   * Get analysis session by ID
   */
  getAnalysisById(sessionId: string): DBAnalysisSession | null {
    const db = database.getDb();
    return db
      .prepare("SELECT * FROM analysis_sessions WHERE id = ?")
      .get(sessionId) as DBAnalysisSession | null;
  }

  /**
   * Get all category results for a session
   */
  getCategoryResults(sessionId: string): DBCategoryResult[] {
    const db = database.getDb();
    return db
      .prepare("SELECT * FROM category_results WHERE session_id = ?")
      .all(sessionId) as DBCategoryResult[];
  }

  /**
   * Get all issues for a session
   */
  getIssues(sessionId: string): DBAnalysisIssue[] {
    const db = database.getDb();
    return db
      .prepare(
        "SELECT * FROM analysis_issues WHERE session_id = ? ORDER BY severity, timestamp_start"
      )
      .all(sessionId) as DBAnalysisIssue[];
  }

  /**
   * Delete analysis session and all related data (cascades)
   */
  deleteAnalysis(sessionId: string): void {
    const db = database.getDb();
    db.prepare("DELETE FROM analysis_sessions WHERE id = ?").run(sessionId);
  }

  /**
   * Update analysis session status
   */
  updateStatus(
    sessionId: string,
    status: DBAnalysisSession["status"],
    errorMessage?: string
  ): void {
    const db = database.getDb();

    if (status === "completed") {
      db.prepare(`UPDATE analysis_sessions SET status = ?, completed_at = ? WHERE id = ?`).run(
        status,
        new Date().toISOString(),
        sessionId
      );
    } else if (status === "error") {
      db.prepare(`UPDATE analysis_sessions SET status = ?, error_message = ? WHERE id = ?`).run(
        status,
        errorMessage ?? null,
        sessionId
      );
    } else {
      db.prepare(`UPDATE analysis_sessions SET status = ? WHERE id = ?`).run(status, sessionId);
    }
  }
}

export const analysisRepository = new AnalysisRepository();
