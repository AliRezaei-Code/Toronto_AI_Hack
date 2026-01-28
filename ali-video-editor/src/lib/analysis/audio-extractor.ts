/**
 * Video Copilot - Audio Extractor Service
 * Extracts audio from video files using FFmpeg
 */

import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffprobePath from "@ffprobe-installer/ffprobe";
import ffmpeg from "fluent-ffmpeg";
import { AppError, AppErrorType, ProgressCallback } from "../../types";
import { logger } from "../logger";

// Configure FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

/**
 * Audio Extractor Service
 * Extracts audio from video files for transcription
 */
export class AudioExtractor {
  private static instance: AudioExtractor;

  private constructor() {
    logger.info("AudioExtractor initialized");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AudioExtractor {
    if (!AudioExtractor.instance) {
      AudioExtractor.instance = new AudioExtractor();
    }
    return AudioExtractor.instance;
  }

  /**
   * Extract audio from video file
   * @param videoFile - The video file to extract audio from
   * @param onProgress - Optional progress callback
   * @returns Audio file as Blob
   */
  public async extractAudioFromVideo(
    videoFile: File,
    onProgress?: ProgressCallback
  ): Promise<File> {
    const startTime = Date.now();
    logger.info("Starting audio extraction", {
      filename: videoFile.name,
      size: videoFile.size,
      type: videoFile.type,
    });

    try {
      if (onProgress) {
        onProgress(0, "Preparing video for audio extraction...");
      }

      // Create temporary file path
      const tempDir = process.env.TMPDIR || process.env.TEMP || "/tmp";
      const videoPath = `${tempDir}/${Date.now()}_${videoFile.name}`;
      const audioPath = `${tempDir}/${Date.now()}_audio.wav`;

      if (onProgress) {
        onProgress(10, "Writing video to temporary file...");
      }

      // Write video file to disk
      await this.writeFile(videoPath, videoFile);

      if (onProgress) {
        onProgress(20, "Extracting audio track...");
      }

      // Extract audio using FFmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .output(audioPath)
          .audioCodec("pcm_s16le") // WAV format (16-bit PCM)
          .audioFrequency(16000) // 16 kHz sample rate (optimal for speech)
          .audioChannels(1) // Mono audio
          .on("start", (commandLine) => {
            logger.debug("FFmpeg command", { commandLine });
          })
          .on("progress", (progress) => {
            if (onProgress) {
              const percent = Math.min(20 + (progress.percent || 0) * 0.7, 90);
              onProgress(Math.round(percent), "Extracting audio track...");
            }
          })
          .on("end", () => {
            logger.info("Audio extraction completed");
            resolve();
          })
          .on("error", (err) => {
            logger.error("Audio extraction failed", { error: err.message });
            reject(
              new AppError(
                AppErrorType.AUDIO_EXTRACTION_FAILED,
                `Failed to extract audio: ${err.message}`,
                err
              )
            );
          })
          .run();
      });

      if (onProgress) {
        onProgress(90, "Reading extracted audio...");
      }

      // Read the extracted audio file
      const audioBuffer = await this.readFile(audioPath);
      const audioUint8Array = new Uint8Array(audioBuffer);
      const audioBlob = new Blob([audioUint8Array], { type: "audio/wav" });
      const audioFile = new File([audioBlob], "extracted_audio.wav", {
        type: "audio/wav",
      });

      if (onProgress) {
        onProgress(100, "Audio extraction completed");
      }

      // Clean up temporary files
      await this.cleanupFiles([videoPath, audioPath]);

      const processingDuration = (Date.now() - startTime) / 1000;
      logger.info("Audio extraction successful", {
        inputSize: videoFile.size,
        outputSize: audioFile.size,
        duration: processingDuration,
      });

      return audioFile;
    } catch (error) {
      logger.error("Audio extraction failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        AppErrorType.AUDIO_EXTRACTION_FAILED,
        "Failed to extract audio from video",
        error as Error
      );
    }
  }

  /**
   * Get audio duration from file
   */
  public async getAudioDuration(file: File | string): Promise<number> {
    const inputPath = typeof file === "string" ? file : URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          logger.error("Failed to get audio duration", { error: err.message });
          reject(
            new AppError(
              AppErrorType.AUDIO_EXTRACTION_FAILED,
              `Failed to get audio duration: ${err.message}`,
              err
            )
          );
          return;
        }

        const duration = metadata.format.duration || 0;
        resolve(duration);
      });
    });
  }

  /**
   * Write file to disk
   */
  private async writeFile(path: string, file: File): Promise<void> {
    const buffer = await file.arrayBuffer();
    const fs = await import("fs");
    const util = await import("util");
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(path, Buffer.from(buffer));
  }

  /**
   * Read file from disk
   */
  private async readFile(path: string): Promise<Buffer> {
    const fs = await import("fs");
    const util = await import("util");
    const readFile = util.promisify(fs.readFile);
    return await readFile(path);
  }

  /**
   * Clean up temporary files
   */
  private async cleanupFiles(filePaths: string[]): Promise<void> {
    const fs = await import("fs");
    const util = await import("util");
    const unlink = util.promisify(fs.unlink);

    for (const path of filePaths) {
      try {
        await unlink(path);
        logger.debug("Cleaned up temporary file", { path });
      } catch (err) {
        logger.warn("Failed to clean up temporary file", {
          path,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  }

  /**
   * Validate if file is a video
   */
  public isVideoFile(file: File): boolean {
    const videoMimeTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
    ];
    return videoMimeTypes.includes(file.type);
  }

  /**
   * Validate if file is audio
   */
  public isAudioFile(file: File): boolean {
    const audioMimeTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/x-m4a"];
    return audioMimeTypes.includes(file.type);
  }
}

// Export singleton instance
export const audioExtractor = AudioExtractor.getInstance();
