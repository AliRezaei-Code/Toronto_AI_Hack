/**
 * Video Copilot - Video Upload Service
 * Handles video file upload, validation, and metadata extraction
 */

import { v4 as uuidv4 } from "uuid";
import {
  AppError,
  AppErrorType,
  ProgressCallback,
  VideoFormat,
  VideoMetadata,
  VideoUploadSession,
} from "../../types";
import { clientLogger } from "../client-logger";

/**
 * Supported video formats
 */
const SUPPORTED_FORMATS: VideoFormat[] = ["mp4", "mov", "avi", "webm", "mkv"];

/**
 * Maximum file size in bytes (2GB)
 */
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

/**
 * Video Upload Service
 * Singleton service for handling video uploads
 */
export class UploadService {
  private static instance: UploadService;
  private activeSessions: Map<string, VideoUploadSession> = new Map();

  private constructor() {
    clientLogger.info("UploadService initialized");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  /**
   * Validate video file format
   */
  private validateFormat(filename: string): VideoFormat {
    const extension = filename.split(".").pop()?.toLowerCase() as VideoFormat;

    if (!extension || !SUPPORTED_FORMATS.includes(extension)) {
      throw new AppError(
        AppErrorType.VIDEO_FORMAT_NOT_SUPPORTED,
        `Unsupported video format: ${extension}. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`
      );
    }

    return extension;
  }

  /**
   * Validate file size
   */
  private validateFileSize(fileSize: number): void {
    if (fileSize > MAX_FILE_SIZE) {
      throw new AppError(
        AppErrorType.VIDEO_UPLOAD_FAILED,
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`
      );
    }
  }

  /**
   * Extract video metadata using HTML5 video element
   */
  private async extractMetadata(file: File, filepath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        try {
          const metadata: VideoMetadata = {
            id: uuidv4(),
            filename: file.name,
            filepath,
            fileSize: file.size,
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            codec: "h264", // Default, would need more sophisticated detection
            audioCodec: "aac", // Default, would need more sophisticated detection
            frameRate: 30, // Default, would need more sophisticated detection
            bitrate: Math.round((file.size * 8) / video.duration / 1000), // Approximate
            uploadedAt: new Date(),
            uploadProgress: 0,
            estimatedProcessingTime: Math.ceil(video.duration * 0.2), // Estimate: 20% of video duration
          };

          clientLogger.info("Video metadata extracted", {
            videoId: metadata.id,
            filename: metadata.filename,
            duration: metadata.duration,
            size: metadata.fileSize,
          });

          resolve(metadata);
        } catch (error) {
          reject(
            new AppError(
              AppErrorType.INVALID_VIDEO_FILE,
              "Failed to extract video metadata",
              error as Error
            )
          );
        }
      };

      video.onerror = () => {
        reject(new AppError(AppErrorType.INVALID_VIDEO_FILE, "Failed to load video file"));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload video file
   */
  public async uploadVideo(
    file: File,
    onProgress?: ProgressCallback,
    originalTitle?: string
  ): Promise<VideoUploadSession> {
    const sessionId = uuidv4();
    const startTime = Date.now();

    clientLogger.info("Starting video upload", {
      sessionId,
      filename: file.name,
      size: file.size,
    });

    try {
      // Validate format
      this.validateFormat(file.name);

      // Validate file size
      this.validateFileSize(file.size);

      // Create upload session
      const session: VideoUploadSession = {
        id: sessionId,
        metadata: {
          id: uuidv4(),
          filename: file.name,
          filepath: "", // Will be set after upload
          fileSize: file.size,
          duration: 0,
          width: 0,
          height: 0,
          codec: "",
          audioCodec: "",
          frameRate: 0,
          bitrate: 0,
          uploadedAt: new Date(),
          uploadProgress: 0,
          estimatedProcessingTime: 0,
        },
        status: "uploading",
        progress: 0,
        createdAt: new Date(),
      };

      this.activeSessions.set(sessionId, session);

      // Simulate upload progress (in real implementation, this would be actual upload)
      const uploadDuration = 2000; // 2 seconds for demo
      const progressInterval = 100; // Update every 100ms
      const progressSteps = uploadDuration / progressInterval;

      for (let i = 0; i <= progressSteps; i++) {
        const progress = (i / progressSteps) * 100;
        session.progress = progress;
        session.metadata.uploadProgress = progress;

        if (onProgress) {
          onProgress(progress, `Uploading... ${Math.round(progress)}%`);
        }

        await new Promise((resolve) => setTimeout(resolve, progressInterval));
      }

      // Extract metadata
      session.status = "processing";
      session.metadata = await this.extractMetadata(file, `/tmp/${file.name}`);

      // Set original title if provided (e.g., from YouTube)
      if (originalTitle) {
        session.metadata.originalTitle = originalTitle;
      }

      // Complete upload
      session.status = "completed";
      session.progress = 100;
      session.completedAt = new Date();

      const uploadDurationMs = Date.now() - startTime;
      clientLogger.info("Video upload completed", {
        sessionId,
        duration: uploadDurationMs,
        videoId: session.metadata.id,
      });

      return session;
    } catch (error) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = "error";
        session.error = error instanceof Error ? error.message : "Unknown error";
      }

      clientLogger.error("Video upload failed", {
        sessionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }

  /**
   * Get upload session by ID
   */
  public getSession(sessionId: string): VideoUploadSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  public getAllSessions(): VideoUploadSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Delete upload session
   */
  public deleteSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      this.activeSessions.delete(sessionId);
      clientLogger.info("Upload session deleted", { sessionId });
    }
  }

  /**
   * Clean up old sessions (older than 24 hours)
   */
  public cleanupOldSessions(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const sessionAge = now - session.createdAt.getTime();
      if (sessionAge > maxAge) {
        this.activeSessions.delete(sessionId);
        clientLogger.info("Old upload session cleaned up", { sessionId });
      }
    }
  }
}

// Export singleton instance
export const uploadService = UploadService.getInstance();
