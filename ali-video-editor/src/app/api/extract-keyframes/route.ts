/**
 * API route for keyframe extraction
 * Handles server-side video processing using ffmpeg
 */

import { createErrorResponse, getErrorStatusCode } from "@/lib/security/error-sanitizer";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import {
    KeyframeExtractor,
    extractKeyframesForCategory,
    extractUniformKeyframes,
} from "../../../lib/ai/keyframe-extractor";
import { extractKeyframesSchema, validateRequestBody } from "../../../lib/security/api-schemas";
import { validateVideoPath } from "../../../lib/security/path-validator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod schema
    const validation = validateRequestBody(extractKeyframesSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { videoPath, strategy, category, frameCount } = validation.data;

    // Validate video path to prevent path traversal
    const pathValidation = validateVideoPath(videoPath);
    if (!pathValidation.valid) {
      return NextResponse.json(
        { error: pathValidation.error || "Invalid video path" },
        { status: 400 }
      );
    }

    if (!pathValidation.sanitizedPath) {
      return NextResponse.json(
        { error: "Failed to validate video path" },
        { status: 500 }
      );
    }

    const safePath = pathValidation.sanitizedPath;

    let result;

    if (category) {
      const keyframes = await extractKeyframesForCategory(safePath, category);
      result = { keyframes, videoDuration: 0, extractionTimeMs: 0, warnings: [] };
    } else if (strategy) {
      const extractor = new KeyframeExtractor();
      result = await extractor.extractKeyframes(safePath, strategy as import("../../../lib/ai/keyframe-extractor").SamplingStrategy);
    } else if (frameCount) {
      const keyframes = await extractUniformKeyframes(safePath, frameCount);
      result = { keyframes, videoDuration: 0, extractionTimeMs: 0, warnings: [] };
    } else {
      const keyframes = await extractUniformKeyframes(safePath);
      result = { keyframes, videoDuration: 0, extractionTimeMs: 0, warnings: [] };
    }

    return NextResponse.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), "extract-keyframes");
    return NextResponse.json(
      createErrorResponse(error, "extract keyframes"),
      { status: getErrorStatusCode(error) }
    );
  }
}
