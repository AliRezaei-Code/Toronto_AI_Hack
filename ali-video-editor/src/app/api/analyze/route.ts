/**
 * API route for video analysis
 * Orchestrates the complete video analysis pipeline on the server
 * 
 * Supports two modes:
 * 1. With video file: Extract keyframes and analyze (for new videos)
 * 2. With keyframes: Use pre-extracted keyframes (for re-analysis from history)
 */

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { tmpdir } from "os";
import { join } from "path";
import { z } from "zod";
import { analysisService } from "../../../lib/analysis/analysis-service";
import { createErrorResponse, getErrorStatusCode } from "../../../lib/security/error-sanitizer";
import { AnalysisConfig, ExtractedKeyframe, TranscriptionResult } from "../../../types";
import { logInfo, logWarning } from "../../../lib/logger";

// ============================================================================
// Validation Schema for FormData fields
// ============================================================================

const transcriptionSchema = z.object({
  id: z.string(),
  videoId: z.string(),
  text: z.string(),
  segments: z.array(z.any()),
  confidence: z.number().min(0).max(1),
  language: z.string().optional(),
  speakerCount: z.number().optional(),
});

const keyframeSchema = z.object({
  timestamp: z.number(),
  base64Data: z.string(),
  mimeType: z.enum(["image/jpeg", "image/png"]),
  width: z.number().optional(),
  height: z.number().optional(),
  sizeBytes: z.number().optional(),
});

const configSchema = z.object({
  categories: z.array(z.string()).optional(),
  keyframeStrategy: z.object({}).passthrough().optional(),
}).passthrough().optional();

const apiKeySchema = z.string().min(10).max(500);

// ============================================================================
// Supported video types
// ============================================================================

const VALID_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];

const VALID_VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|avi|mkv)$/i;

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
  let tempVideoPath: string | null = null;

  try {
    // Parse FormData
    const formData = await request.formData();
    
    // Get video file (optional if keyframes are provided)
    const videoFile = formData.get("video") as File | null;
    
    // Get keyframes (for re-analysis from history)
    const keyframesStr = formData.get("keyframes") as string | null;
    let keyframes: ExtractedKeyframe[] | null = null;
    
    if (keyframesStr) {
      try {
        const parsed = JSON.parse(keyframesStr);
        if (!Array.isArray(parsed)) {
          return NextResponse.json(
            { error: "Keyframes must be an array" },
            { status: 400 }
          );
        }
        // Validate each keyframe
        keyframes = parsed.map((kf: unknown) => {
          const validated = keyframeSchema.safeParse(kf);
          if (!validated.success) {
            throw new Error(`Invalid keyframe: ${validated.error.errors.map(e => e.message).join(", ")}`);
          }
          return validated.data as ExtractedKeyframe;
        });
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Invalid keyframes JSON" },
          { status: 400 }
        );
      }
    }

    // Must have either video file or keyframes
    if (!videoFile && !keyframes) {
      return NextResponse.json(
        { error: "Either video file or keyframes are required" },
        { status: 400 }
      );
    }

    // Validate video file if provided
    if (videoFile) {
      if (videoFile.size === 0) {
        return NextResponse.json(
          { error: "Video file is empty" },
          { status: 400 }
        );
      }

      if (!VALID_VIDEO_TYPES.includes(videoFile.type) && !videoFile.name.match(VALID_VIDEO_EXTENSIONS)) {
        return NextResponse.json(
          { error: `Invalid video file type: ${videoFile.type}. Supported formats: MP4, WEBM, OGG, MOV, AVI, MKV` },
          { status: 400 }
        );
      }
    }

    // Get and validate transcription
    const transcriptionStr = formData.get("transcription") as string | null;
    if (!transcriptionStr) {
      return NextResponse.json(
        { error: "Transcription data is required" },
        { status: 400 }
      );
    }

    let transcription: TranscriptionResult;
    try {
      const parsed = JSON.parse(transcriptionStr);
      const validated = transcriptionSchema.safeParse(parsed);
      if (!validated.success) {
        return NextResponse.json(
          { error: `Invalid transcription: ${validated.error.errors.map(e => e.message).join(", ")}` },
          { status: 400 }
        );
      }
      transcription = validated.data as TranscriptionResult;
    } catch {
      return NextResponse.json(
        { error: "Invalid transcription JSON" },
        { status: 400 }
      );
    }

    // Get and validate config (optional)
    const configStr = formData.get("config") as string | null;
    let config: AnalysisConfig = {};
    if (configStr) {
      try {
        const parsed = JSON.parse(configStr);
        const validated = configSchema.safeParse(parsed);
        if (!validated.success) {
          return NextResponse.json(
            { error: `Invalid config: ${validated.error.errors.map(e => e.message).join(", ")}` },
            { status: 400 }
          );
        }
        config = (validated.data ?? {}) as AnalysisConfig;
      } catch {
        return NextResponse.json(
          { error: "Invalid config JSON" },
          { status: 400 }
        );
      }
    }

    // Get and validate Gemini API key
    const geminiApiKey = formData.get("geminiApiKey") as string | null;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "geminiApiKey is required" },
        { status: 400 }
      );
    }
    
    const apiKeyValidation = apiKeySchema.safeParse(geminiApiKey);
    if (!apiKeyValidation.success) {
      return NextResponse.json(
        { error: "Invalid Gemini API key format" },
        { status: 400 }
      );
    }

    // Initialize Gemini service with provided API key
    try {
      const { geminiService } = await import("../../../lib/ai/gemini-service");
      geminiService.initialize({ apiKey: geminiApiKey });
    } catch (error) {
      console.error("Failed to initialize Gemini service:", error);
      return NextResponse.json(
        { error: "Failed to initialize Gemini service" },
        { status: 500 }
      );
    }

    let result;

    if (keyframes && keyframes.length > 0) {
      // Mode 2: Re-analysis with pre-extracted keyframes
      logInfo("Analysis request with keyframes", "analyze", {
        keyframeCount: keyframes.length,
        transcriptionId: transcription.id,
      });

      logInfo("Starting analysis with pre-extracted keyframes", "analyze");
      result = await analysisService.analyzeWithKeyframes(
        keyframes,
        transcription,
        config
      );
    } else if (videoFile) {
      // Mode 1: Full analysis with video file
      logInfo("Analysis request with video", "analyze", {
        filename: videoFile.name,
        size: videoFile.size,
        type: videoFile.type,
        transcriptionId: transcription.id,
      });

      // Save video to temp file
      const tempDir = join(tmpdir(), "videocopilot");
      await mkdir(tempDir, { recursive: true });
      tempVideoPath = join(tempDir, `${randomUUID()}-${videoFile.name}`);
      
      const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
      await writeFile(tempVideoPath, videoBuffer);

      logInfo("Video saved to temp file", "analyze", { path: tempVideoPath, size: videoBuffer.length });

      // Run the analysis pipeline
      logInfo("Starting analysis pipeline", "analyze");
      result = await analysisService.analyzeVideo(
        tempVideoPath,
        transcription,
        config
      );

      // Clean up temp video file after successful analysis
      if (tempVideoPath) {
        await unlink(tempVideoPath).catch((err) => {
          logWarning("Failed to clean up temp file", "analyze", { path: tempVideoPath, error: err });
        });
      }
    } else {
      // This shouldn't happen due to earlier validation
      return NextResponse.json(
        { error: "No video file or keyframes provided" },
        { status: 400 }
      );
    }

    logInfo("Analysis complete", "analyze", {
      videoId: result.videoId,
      overallScore: result.overallScore,
      processingTimeMs: result.processingTimeMs,
    });

    return NextResponse.json(result);
  } catch (error) {
    // Clean up on error
    if (tempVideoPath) {
      await unlink(tempVideoPath).catch(() => { /* ignore cleanup errors */ });
    }

    console.error("Analysis error:", error);
    return NextResponse.json(
      createErrorResponse(error, "analyze video"),
      { status: getErrorStatusCode(error) }
    );
  }
}
