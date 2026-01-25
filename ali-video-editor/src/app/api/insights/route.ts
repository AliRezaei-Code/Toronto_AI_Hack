/**
 * API Route: Generate AI Insights
 * Server-side insights generation using Gemini
 */

import { geminiService } from "@/lib/ai/gemini-service";
import { insightsService } from "@/lib/insights/insights-service";
import { RetentionAnalysis, TranscriptionResult } from "@/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * Original metadata for improvement delta calculation
 */
interface OriginalMetadata {
  title?: string;
  description?: string;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      transcription, 
      retentionAnalysis, 
      videoId, 
      geminiApiKey, 
      keyframes,
      originalMetadata 
    } = body as {
      transcription: TranscriptionResult;
      retentionAnalysis: RetentionAnalysis;
      videoId: string;
      geminiApiKey?: string;
      keyframes?: Array<{
        timestamp: number;
        base64Data: string;
        mimeType: string;
      }>;
      originalMetadata?: OriginalMetadata;
    };

    if (!transcription || !retentionAnalysis || !videoId) {
      return NextResponse.json(
        { error: "Missing required fields: transcription, retentionAnalysis, videoId" },
        { status: 400 }
      );
    }

    // Initialize Gemini service with provided API key or fall back to env
    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    if (apiKey) {
      geminiService.initialize({ apiKey });
    }

    const insights = await insightsService.generateInsights(
      transcription,
      retentionAnalysis,
      videoId,
      undefined, // onProgress
      keyframes, // Pass keyframes for visual analysis
      originalMetadata // Pass original metadata for delta calculation
    );

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Insights generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Insights generation failed" },
      { status: 500 }
    );
  }
}
