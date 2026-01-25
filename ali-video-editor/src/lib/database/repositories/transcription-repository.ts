/**
 * Transcription Repository
 *
 * Handles CRUD operations for transcription results
 */

import { v4 as uuidv4 } from "uuid";
import type { TranscriptionResult } from "../../../types";
import { database } from "../database";
import type { DBTranscription, DBTranscriptionSegment } from "../schema";

/**
 * Transcription Repository
 */
export class TranscriptionRepository {
  /**
   * Save complete transcription result
   */
  saveTranscription(transcription: TranscriptionResult): string {
    const db = database.getDb();

    const transcriptionId = transcription.id || uuidv4();

    const insertTranscription = db.prepare(`
      INSERT OR REPLACE INTO transcriptions (
        id, video_id, full_text, language, confidence, processing_duration
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertSegment = db.prepare(`
      INSERT INTO transcription_segments (
        transcription_id, text, start_time, end_time, confidence, speaker
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Transaction for atomicity
    const transaction = db.transaction(() => {
      // Insert transcription
      insertTranscription.run(
        transcriptionId,
        transcription.videoId,
        transcription.text,
        transcription.language,
        transcription.confidence,
        transcription.processingDuration
      );

      // Delete existing segments for this transcription (in case of replace)
      db.prepare("DELETE FROM transcription_segments WHERE transcription_id = ?").run(
        transcriptionId
      );

      // Insert segments
      for (const segment of transcription.segments) {
        insertSegment.run(
          transcriptionId,
          segment.text,
          segment.start,
          segment.end,
          segment.confidence,
          segment.speaker ?? null
        );
      }
    });

    transaction();

    return transcriptionId;
  }

  /**
   * Get transcription by ID
   */
  getTranscriptionById(id: string): DBTranscription | null {
    const db = database.getDb();
    return db
      .prepare("SELECT * FROM transcriptions WHERE id = ?")
      .get(id) as DBTranscription | null;
  }

  /**
   * Get transcription by video ID
   */
  getTranscriptionByVideoId(videoId: string): DBTranscription | null {
    const db = database.getDb();
    return db
      .prepare("SELECT * FROM transcriptions WHERE video_id = ?")
      .get(videoId) as DBTranscription | null;
  }

  /**
   * Get transcription segments
   */
  getSegments(transcriptionId: string): DBTranscriptionSegment[] {
    const db = database.getDb();
    return db
      .prepare(
        "SELECT * FROM transcription_segments WHERE transcription_id = ? ORDER BY start_time"
      )
      .all(transcriptionId) as DBTranscriptionSegment[];
  }

  /**
   * Delete transcription by ID
   */
  deleteTranscription(id: string): void {
    const db = database.getDb();
    db.prepare("DELETE FROM transcriptions WHERE id = ?").run(id);
  }
}

export const transcriptionRepository = new TranscriptionRepository();
