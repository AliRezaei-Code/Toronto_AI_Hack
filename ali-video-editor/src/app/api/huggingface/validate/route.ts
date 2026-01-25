/**
 * API route for HuggingFace API key validation
 *
 * POST /api/huggingface/validate
 *
 * Validates the provided HuggingFace API token.
 */

import { logError, logInfo } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST handler for HuggingFace API key validation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ valid: false, error: "API key is required" }, { status: 400 });
    }

    logInfo("Validating HuggingFace API key", "huggingface.validate");

    try {
      // Use the whoami-v2 endpoint to validate the token
      const response = await fetch("https://huggingface.co/api/whoami-v2", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        logInfo("HuggingFace API key validated successfully", "huggingface.validate", {
          username: data.name || data.user,
        });
        return NextResponse.json({
          valid: true,
          message: "API key is valid",
          username: data.name || data.user,
        });
      } else if (response.status === 401) {
        return NextResponse.json(
          { 
            valid: false, 
            error: "Invalid token. Make sure you copied the full token (starts with 'hf_') and that it has been generated." 
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { valid: false, error: `HuggingFace returned status ${response.status}` },
          { status: 400 }
        );
      }
    } catch (error) {
      logError(error as Error, "huggingface.validate");

      return NextResponse.json(
        { valid: false, error: "Failed to connect to HuggingFace" },
        { status: 400 }
      );
    }
  } catch (error) {
    logError(error as Error, "huggingface.validate");

    return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 500 });
  }
}

