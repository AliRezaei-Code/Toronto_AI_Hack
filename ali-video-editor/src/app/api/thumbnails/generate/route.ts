/**
 * API route for thumbnail generation
 *
 * POST /api/thumbnails/generate
 *
 * Generates YouTube thumbnails using HuggingFace models with automatic fallback.
 */

import { logError, logInfo } from "@/lib/logger";
import { thumbnailGenerationSchema, validateRequestBody } from "@/lib/security/api-schemas";
import { createThumbnailRequest, thumbnailService } from "@/lib/thumbnail";
import { getUserErrorMessage } from "@/lib/thumbnail/domain/errors";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST handler for thumbnail generation
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate with Zod schema
    const validation = validateRequestBody(thumbnailGenerationSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Extract API key from request body
    const { huggingfaceApiKey } = validation.data;

    // Initialize thumbnail service with API key
    try {
      thumbnailService.initialize(huggingfaceApiKey);
    } catch (error) {
      logError(error as Error, "thumbnail.generate");
      return NextResponse.json(
        { error: "Failed to initialize thumbnail service. Please configure your HuggingFace API token in Settings." },
        { status: 500 }
      );
    }

    // Create thumbnail request
    const thumbnailRequest = createThumbnailRequest(validation.data);

    // Log generation start (redact sensitive info)
    logInfo("Thumbnail generation started", "thumbnail.generate", {
      requestId: thumbnailRequest.id,
      style: thumbnailRequest.style,
      titleLength: thumbnailRequest.titleText.length,
      hasFaceImage: !!thumbnailRequest.faceImageUrl,
    });

    // Generate thumbnail
    const result = await thumbnailService.generateThumbnail(thumbnailRequest);

    // Log generation complete
    logInfo("Thumbnail generation completed", "thumbnail.generate", {
      requestId: thumbnailRequest.id,
      resultId: result.id,
      model: result.model,
      strategy: result.strategy,
      latencyMs: result.latencyMs,
    });

    return NextResponse.json(result);
  } catch (error) {
    // Log error
    logError(error as Error, "thumbnail.generate");

    // Get user-friendly error message
    const errorMessage = getUserErrorMessage(error);

    // Return error response
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
