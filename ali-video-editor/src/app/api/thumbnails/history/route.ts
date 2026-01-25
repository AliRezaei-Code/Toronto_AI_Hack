/**
 * API route for thumbnail history
 *
 * GET /api/thumbnails/history
 *
 * Returns thumbnail generation history from browser storage.
 */

import { logError, logInfo } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

interface StoredThumbnail {
  id: string;
  imageData: string;
  titleText: string;
  topic: string;
  style: string;
  generatedAt: Date;
}

/**
 * GET handler for thumbnail history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    logInfo("Fetching thumbnail history", "thumbnail.history", {
      videoId,
      limit,
    });

    // Get thumbnails from history
    // Note: This will require extending browserHistoryService with thumbnail support
    // For now, return an empty array as placeholder
    const thumbnails: StoredThumbnail[] = [];

    return NextResponse.json({
      thumbnails,
      total: thumbnails.length,
    });
  } catch (error) {
    logError(error as Error, "thumbnail.history");

    return NextResponse.json({ error: "Failed to fetch thumbnail history" }, { status: 500 });
  }
}
