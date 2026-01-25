/**
 * Video Copilot - YouTube Description Generation API
 * API route for generating SEO-optimized YouTube descriptions
 */

import { descriptionGeneratorService } from "@/lib/insights/description-generator";
import { logger } from "@/lib/logger";
import { AppError, AppErrorType } from "@/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate-description
 * Generate a YouTube-optimized description
 *
 * Request body:
 * {
 *   videoId: string,
 *   transcription: string,
 *   title?: string,
 *   chapters?: Array<{ title: string, start: number, end: number }>,
 *   options: {
 *     length: "short" | "medium" | "long",
 *     tone: "professional" | "casual" | "engaging",
 *     includeHashtags: boolean,
 *     customKeywords?: string[],
 *     includeChapters: boolean,
 *     channelName?: string,
 *     socialLinks?: {
 *       twitter?: string,
 *       instagram?: string,
 *       tiktok?: string,
 *       website?: string
 *     }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();

    logger.info("Description generation request received", {
      videoId: body.videoId,
    });

    // Validate required fields
    if (!body.videoId) {
      throw new AppError(AppErrorType.API_KEY_INVALID, "Missing required field: videoId");
    }

    if (!body.transcription || body.transcription.length < 10) {
      throw new AppError(
        AppErrorType.API_KEY_INVALID,
        "Transcription must be at least 10 characters long"
      );
    }

    if (!body.options) {
      throw new AppError(AppErrorType.API_KEY_INVALID, "Missing required field: options");
    }

    // Generate description
    const result = await descriptionGeneratorService.generateDescription(body);

    if (!result.success || !result.description) {
      throw new AppError(AppErrorType.AI_INSIGHTS_FAILED, "Failed to generate description");
    }

    const processingTime = (Date.now() - startTime) / 1000;
    logger.info("Description generation completed successfully", {
      videoId: body.videoId,
      wordCount: result.description.wordCount,
      seoScore: result.description.seoScore,
      processingTime,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: result.description,
        metadata: {
          processingTime: result.processingTime,
          wordCount: result.description.wordCount,
          characterCount: result.description.characterCount,
          seoScore: result.description.seoScore,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const processingTime = (Date.now() - startTime) / 1000;

    logger.error("Description generation API error", {
      error: error instanceof Error ? error.message : "Unknown error",
      processingTime,
    });

    // Handle AppError
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: error.type,
            message: error.message,
          },
          metadata: {
            processingTime,
          },
        },
        { status: 400 }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: {
          type: AppErrorType.AI_INSIGHTS_FAILED,
          message: "An unexpected error occurred while generating the description",
        },
        metadata: {
          processingTime,
        },
      },
      { status: 500 }
    );
  }
}
