/**
 * API Route: Transcribe Audio
 * Server-side transcription using Deepgram to avoid CORS issues
 */

import { deepgramService } from "@/lib/ai/deepgram-service";
import { transcribeRequestSchema, validateRequestBody } from "@/lib/security/api-schemas";
import { createErrorResponse, getErrorStatusCode } from "@/lib/security/error-sanitizer";
import { NextRequest, NextResponse } from "next/server";
import { logInfo, logError } from "@/lib/logger";

export interface TranscribeRequestBody {
  audioBuffer: string; // Base64 encoded audio
  videoId: string;
  deepgramApiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod schema
    const validation = validateRequestBody(transcribeRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { audioBuffer, videoId, deepgramApiKey } = validation.data;

    logInfo("Transcription request", "transcribe", {
      videoId,
      audioBufferSize: audioBuffer.length,
      hasApiKey: !!deepgramApiKey,
    });

    // Initialize Deepgram service with API key
    if (deepgramApiKey) {
      deepgramService.initialize(deepgramApiKey);
    } else {
      // Try to initialize from environment
      try {
        deepgramService.initialize();
      } catch (error) {
        return NextResponse.json(
          { 
            error: "Deepgram API key not provided",
            details: "Please provide a Deepgram API key either in the request body or set DEEPGRAM_API_KEY environment variable."
          },
          { status: 400 }
        );
      }
    }

    // Convert base64 buffer to File object
    const audioData = Buffer.from(audioBuffer, "base64");
    const audioFile = new File([audioData], "audio.wav", { type: "audio/wav" });

    logInfo("Starting transcription", "transcribe", {
      audioFileSize: audioData.length,
      fileType: audioFile.type,
    });

    // Transcribe the audio
    const transcription = await deepgramService.transcribeAudio(
      audioFile,
      videoId,
      (progress, message) => {
        logInfo(`Transcription progress: ${progress}% - ${message || ""}`, "transcribe");
      }
    );

    logInfo("Transcription completed", "transcribe", {
      videoId,
      textLength: transcription.text.length,
      segmentsCount: transcription.segments.length,
      confidence: transcription.confidence,
    });

    return NextResponse.json(transcription);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), "transcribe");

    return NextResponse.json(
      createErrorResponse(error, "transcribe audio"),
      { status: getErrorStatusCode(error) }
    );
  }
}