/**
 * Keyframe Extractor
 *
 * Production-grade utility for extracting keyframes from videos for AI analysis.
 * Uses ffmpeg for efficient frame extraction with configurable sampling strategies.
 *
 * Design Principles:
 * - SOLID: Single responsibility - only handles keyframe extraction
 * - DRY: Reusable extraction strategies
 * - Fast: Parallel extraction, efficient sampling
 * - Modular: Strategy pattern for different sampling approaches
 *
 * @module keyframe-extractor
 */

import { spawn } from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { logger } from "../logger";

// ============================================================================
// Types
// ============================================================================

/**
 * Extracted keyframe data ready for Gemini API
 */
export interface ExtractedKeyframe {
  /** Timestamp in seconds */
  timestamp: number;
  /** Base64-encoded image data */
  base64Data: string;
  /** MIME type of the image */
  mimeType: "image/jpeg" | "image/png";
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** File size in bytes */
  sizeBytes: number;
}

/**
 * Extraction configuration
 */
export interface KeyframeExtractionConfig {
  /** Output format */
  format?: "jpeg" | "png";
  /** Output quality (1-100 for JPEG, ignored for PNG) */
  quality?: number;
  /** Max width (maintains aspect ratio) */
  maxWidth?: number;
  /** Max height (maintains aspect ratio) */
  maxHeight?: number;
}

/**
 * Sampling strategy options
 */
export type SamplingStrategy =
  | { type: "uniform"; count: number } // Extract N frames uniformly
  | { type: "interval"; intervalSeconds: number } // Extract every N seconds
  | { type: "timestamps"; timestamps: number[] } // Extract at specific times
  | { type: "scene_change"; sensitivity?: number }; // Scene change detection

/**
 * Extraction result
 */
export interface ExtractionResult {
  /** Extracted keyframes */
  keyframes: ExtractedKeyframe[];
  /** Video duration in seconds */
  videoDuration: number;
  /** Extraction time in ms */
  extractionTimeMs: number;
  /** Any warnings during extraction */
  warnings: string[];
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<KeyframeExtractionConfig> = {
  format: "jpeg",
  quality: 85,
  maxWidth: 1280,
  maxHeight: 720,
};

// ============================================================================
// Keyframe Extractor Class
// ============================================================================

/**
 * Keyframe Extractor
 * Extracts frames from videos using ffmpeg
 */
export class KeyframeExtractor {
  private readonly config: Required<KeyframeExtractionConfig>;
  private tempDir: string | null = null;

  constructor(config?: KeyframeExtractionConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Extract keyframes from a video file
   *
   * @param videoPath - Path to the video file
   * @param strategy - Sampling strategy to use
   * @returns Extraction result with keyframes
   */
  async extractKeyframes(
    videoPath: string,
    strategy: SamplingStrategy
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    // Verify video exists
    try {
      await fs.access(videoPath);
    } catch {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    // Get video duration
    const videoDuration = await this.getVideoDuration(videoPath);

    // Calculate timestamps based on strategy
    const timestamps = this.calculateTimestamps(
      strategy,
      videoDuration,
      warnings
    );

    if (timestamps.length === 0) {
      return {
        keyframes: [],
        videoDuration,
        extractionTimeMs: Date.now() - startTime,
        warnings: ["No timestamps to extract"],
      };
    }

    // Create temp directory for frames
    this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "keyframes-"));

    try {
      // Extract frames at timestamps
      const keyframes = await this.extractFramesAtTimestamps(
        videoPath,
        timestamps
      );

      logger.info("Keyframe extraction completed", {
        videoPath: path.basename(videoPath),
        frameCount: keyframes.length,
        videoDuration,
        strategy: strategy.type,
      });

      return {
        keyframes,
        videoDuration,
        extractionTimeMs: Date.now() - startTime,
        warnings,
      };
    } finally {
      // Cleanup temp directory
      await this.cleanup();
    }
  }

  /**
   * Get video duration using ffprobe
   */
  private async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const args = [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        videoPath,
      ];

      const ffprobe = spawn("ffprobe", args);
      let output = "";
      let error = "";

      ffprobe.stdout.on("data", (data) => {
        output += data.toString();
      });

      ffprobe.stderr.on("data", (data) => {
        error += data.toString();
      });

      ffprobe.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe failed: ${error}`));
          return;
        }

        const duration = parseFloat(output.trim());
        if (isNaN(duration)) {
          reject(new Error("Could not parse video duration"));
          return;
        }

        resolve(duration);
      });

      ffprobe.on("error", (err) => {
        reject(new Error(`ffprobe not found. Install ffmpeg: ${err.message}`));
      });
    });
  }

  /**
   * Calculate timestamps based on sampling strategy
   */
  private calculateTimestamps(
    strategy: SamplingStrategy,
    duration: number,
    warnings: string[]
  ): number[] {
    switch (strategy.type) {
      case "uniform": {
        const count = Math.min(strategy.count, Math.floor(duration));
        if (count <= 0) {
          return [];
        }
        const interval = duration / (count + 1);
        return Array.from({ length: count }, (_, i) => (i + 1) * interval);
      }

      case "interval": {
        const interval = strategy.intervalSeconds;
        if (interval <= 0) {
          warnings.push("Invalid interval, using 1 second");
          return this.calculateTimestamps(
            { type: "interval", intervalSeconds: 1 },
            duration,
            warnings
          );
        }
        const timestamps: number[] = [];
        for (let t = interval; t < duration; t += interval) {
          timestamps.push(t);
        }
        return timestamps;
      }

      case "timestamps": {
        // Filter timestamps within video duration
        return strategy.timestamps
          .filter((t) => t >= 0 && t < duration)
          .sort((a, b) => a - b);
      }

      case "scene_change": {
        // Scene change detection requires different approach
        // For MVP, fall back to uniform sampling with more frames
        warnings.push("Scene change detection not yet implemented, using uniform sampling");
        return this.calculateTimestamps(
          { type: "uniform", count: 10 },
          duration,
          warnings
        );
      }
    }
  }

  /**
   * Extract frames at specific timestamps
   */
  private async extractFramesAtTimestamps(
    videoPath: string,
    timestamps: number[]
  ): Promise<ExtractedKeyframe[]> {
    const keyframes: ExtractedKeyframe[] = [];

    // Extract frames in parallel (batch of 5)
    const batchSize = 5;
    for (let i = 0; i < timestamps.length; i += batchSize) {
      const batch = timestamps.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((ts) => this.extractSingleFrame(videoPath, ts))
      );
      keyframes.push(...results.filter((f): f is ExtractedKeyframe => f !== null));
    }

    return keyframes;
  }

  /**
   * Extract a single frame at a timestamp
   */
  private async extractSingleFrame(
    videoPath: string,
    timestamp: number
  ): Promise<ExtractedKeyframe | null> {
    if (!this.tempDir) {
      return null;
    }
    const ext = this.config.format === "png" ? "png" : "jpg";
    const outputPath = path.join(this.tempDir, `frame_${timestamp.toFixed(3)}.${ext}`);

    return new Promise((resolve) => {
      const scaleFilter = `scale='min(${this.config.maxWidth},iw)':'min(${this.config.maxHeight},ih)':force_original_aspect_ratio=decrease`;

      const args = [
        "-ss",
        timestamp.toFixed(3),
        "-i",
        videoPath,
        "-vframes",
        "1",
        "-vf",
        scaleFilter,
      ];

      // Add format-specific options
      if (this.config.format === "jpeg") {
        args.push("-q:v", String(Math.round((100 - this.config.quality) / 4 + 1)));
      }

      args.push("-y", outputPath);

      const ffmpeg = spawn("ffmpeg", args);

      ffmpeg.on("close", async (code) => {
        if (code !== 0) {
          logger.warn("Failed to extract frame", { timestamp, code });
          resolve(null);
          return;
        }

        try {
          // Read frame and convert to base64
          const buffer = await fs.readFile(outputPath);
          const base64Data = buffer.toString("base64");

          // Get image dimensions (approximate from file)
          const stats = await fs.stat(outputPath);

          resolve({
            timestamp,
            base64Data,
            mimeType: this.config.format === "png" ? "image/png" : "image/jpeg",
            width: this.config.maxWidth,
            height: this.config.maxHeight,
            sizeBytes: stats.size,
          });
        } catch (error) {
          logger.warn("Failed to read extracted frame", {
            timestamp,
            error: error instanceof Error ? error.message : "Unknown",
          });
          resolve(null);
        }
      });

      ffmpeg.on("error", () => {
        resolve(null);
      });
    });
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(): Promise<void> {
    if (this.tempDir) {
      const tempDirPath = this.tempDir;
      try {
        const files = await fs.readdir(tempDirPath);
        await Promise.all(
          files.map((file) => fs.unlink(path.join(tempDirPath, file)))
        );
        await fs.rmdir(this.tempDir);
      } catch {
        // Ignore cleanup errors
      }
      this.tempDir = null;
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick extraction with uniform sampling
 *
 * @param videoPath - Path to video file
 * @param frameCount - Number of frames to extract (default: 5)
 * @returns Array of extracted keyframes
 */
export async function extractUniformKeyframes(
  videoPath: string,
  frameCount: number = 5
): Promise<ExtractedKeyframe[]> {
  const extractor = new KeyframeExtractor();
  const result = await extractor.extractKeyframes(videoPath, {
    type: "uniform",
    count: frameCount,
  });
  return result.keyframes;
}

/**
 * Extract keyframes at specific timestamps
 *
 * @param videoPath - Path to video file
 * @param timestamps - Array of timestamps in seconds
 * @returns Array of extracted keyframes
 */
export async function extractKeyframesAtTimestamps(
  videoPath: string,
  timestamps: number[]
): Promise<ExtractedKeyframe[]> {
  const extractor = new KeyframeExtractor();
  const result = await extractor.extractKeyframes(videoPath, {
    type: "timestamps",
    timestamps,
  });
  return result.keyframes;
}

/**
 * Extract keyframes at regular intervals
 *
 * @param videoPath - Path to video file
 * @param intervalSeconds - Interval between frames
 * @param maxFrames - Maximum number of frames (default: 20)
 * @returns Array of extracted keyframes
 */
export async function extractKeyframesAtIntervals(
  videoPath: string,
  intervalSeconds: number,
  maxFrames: number = 20
): Promise<ExtractedKeyframe[]> {
  const extractor = new KeyframeExtractor();
  const result = await extractor.extractKeyframes(videoPath, {
    type: "interval",
    intervalSeconds,
  });
  return result.keyframes.slice(0, maxFrames);
}

// ============================================================================
// Category-Specific Extraction Presets
// ============================================================================

/**
 * Extraction presets optimized for specific analysis categories
 */
export const CategoryExtractionPresets = {
  /**
   * Visual editing analysis - more frames to catch pacing
   */
  visual_editing: {
    strategy: { type: "interval", intervalSeconds: 3 } as SamplingStrategy,
    maxFrames: 15,
  },

  /**
   * Style guides analysis - uniform sampling for style consistency
   */
  style_guides: {
    strategy: { type: "uniform", count: 8 } as SamplingStrategy,
    maxFrames: 8,
  },

  /**
   * Core concepts - focus on hook and key moments
   */
  core_concepts: {
    strategy: {
      type: "timestamps",
      timestamps: [1, 3, 5, 8, 15, 30, 60], // First minute focus
    } as SamplingStrategy,
    maxFrames: 10,
  },

  /**
   * Scripting - scattered frames to match visual cues
   */
  scripting: {
    strategy: { type: "uniform", count: 5 } as SamplingStrategy,
    maxFrames: 5,
  },
} as const;

/**
 * Extract keyframes optimized for a specific category
 *
 * @param videoPath - Path to video file
 * @param category - Analysis category
 * @returns Array of extracted keyframes
 */
export async function extractKeyframesForCategory(
  videoPath: string,
  category: keyof typeof CategoryExtractionPresets | string
): Promise<ExtractedKeyframe[]> {
  const preset =
    CategoryExtractionPresets[category as keyof typeof CategoryExtractionPresets];

  if (!preset) {
    // Default to uniform sampling
    return extractUniformKeyframes(videoPath, 5);
  }

  const extractor = new KeyframeExtractor();
  const result = await extractor.extractKeyframes(videoPath, preset.strategy);
  return result.keyframes.slice(0, preset.maxFrames);
}
