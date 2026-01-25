/**
 * Video Repository
 *
 * Handles CRUD operations for video metadata
 */

import { v4 as uuidv4 } from "uuid";
import type { VideoMetadata } from "../../../types";
import { database } from "../database";
import type { DBVideo } from "../schema";

/**
 * Video Repository
 */
export class VideoRepository {
  /**
   * Create a new video record
   */
  createVideo(metadata: VideoMetadata): string {
    const db = database.getDb();

    const videoId = metadata.id || uuidv4();

    const insert = db.prepare(`
      INSERT OR REPLACE INTO videos (
        id, filename, filepath, file_size, duration, width, height, codec, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      videoId,
      metadata.filename,
      metadata.filepath,
      metadata.fileSize ?? null,
      metadata.duration ?? null,
      metadata.width ?? null,
      metadata.height ?? null,
      metadata.codec ?? null,
      metadata.uploadedAt.toISOString()
    );

    return videoId;
  }

  /**
   * Get video by ID
   */
  getVideoById(id: string): DBVideo | null {
    const db = database.getDb();
    return db.prepare("SELECT * FROM videos WHERE id = ?").get(id) as DBVideo | null;
  }

  /**
   * Get all videos
   */
  getAllVideos(): DBVideo[] {
    const db = database.getDb();
    return db.prepare("SELECT * FROM videos ORDER BY uploaded_at DESC").all() as DBVideo[];
  }

  /**
   * Delete video by ID
   */
  deleteVideo(id: string): void {
    const db = database.getDb();
    db.prepare("DELETE FROM videos WHERE id = ?").run(id);
  }

  /**
   * Update video metadata
   */
  updateVideo(id: string, updates: Partial<DBVideo>): void {
    const db = database.getDb();

    const fields = Object.keys(updates).filter((key) => key !== "id");
    if (fields.length === 0) {
      return;
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => updates[field as keyof DBVideo]);

    const sql = `UPDATE videos SET ${setClause} WHERE id = ?`;
    db.prepare(sql).run(...values, id);
  }
}

export const videoRepository = new VideoRepository();
