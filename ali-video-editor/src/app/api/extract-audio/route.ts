/**
 * API Route: Extract Audio from Video
 * Uses FFmpeg server-side to extract audio from video files
 */

import { NextRequest, NextResponse } from "next/server";
import { audioExtractor } from "@/lib/analysis/audio-extractor";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { logInfo } from "@/lib/logger";

export async function POST(request: NextRequest) {
  let tempVideoPath: string | null = null;

  try {
    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;

    if (!videoFile) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    // Validate video file
    if (videoFile.size === 0) {
      return NextResponse.json(
        { error: "Video file is empty" },
        { status: 400 }
      );
    }

    // Validate video file type
    const validVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
    ];
    
    if (!validVideoTypes.includes(videoFile.type) && !videoFile.name.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
      return NextResponse.json(
        { error: `Invalid video file type: ${videoFile.type}. Supported formats: MP4, WEBM, OGG, MOV, AVI, MKV` },
        { status: 400 }
      );
    }

    logInfo("Audio extraction request", "extract-audio", {
      filename: videoFile.name,
      size: videoFile.size,
      type: videoFile.type,
    });

    // Save video to temp file
    const tempDir = join(tmpdir(), "videocopilot");
    await mkdir(tempDir, { recursive: true });
    tempVideoPath = join(tempDir, `${randomUUID()}-${videoFile.name}`);
    
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    await writeFile(tempVideoPath, videoBuffer);

    logInfo("Video saved to temp file", "extract-audio", { path: tempVideoPath, size: videoBuffer.length });

    // Convert to File object for audioExtractor
    const videoFileObj = new File(
      [videoBuffer],
      videoFile.name,
      { type: videoFile.type }
    );

    // Extract audio using the server-side audioExtractor
    logInfo("Starting audio extraction", "extract-audio");
    const audioFile = await audioExtractor.extractAudioFromVideo(videoFileObj);
    logInfo("Audio extraction complete", "extract-audio", { name: audioFile.name, size: audioFile.size });

    // Clean up temp video file
    if (tempVideoPath) {
      await unlink(tempVideoPath).catch((err) => {
        logInfo("Failed to clean up temp file", "extract-audio", { path: tempVideoPath, error: err });
      });
    }

    // Return audio file
    const audioBuffer = await audioFile.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": audioFile.type,
        "Content-Disposition": `attachment; filename="${audioFile.name}"`,
      },
    });
  } catch (error) {
    // Clean up on error
    if (tempVideoPath) {
      await unlink(tempVideoPath).catch((err) => {
        logInfo("Failed to clean up temp file", "extract-audio", { path: tempVideoPath, error: err });
      });
    }

    logInfo("Audio extraction failed", "extract-audio", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Audio extraction failed",
        details: "Please ensure the video file contains an audio track and is not corrupted."
      },
      { status: 500 }
    );
  }
}
