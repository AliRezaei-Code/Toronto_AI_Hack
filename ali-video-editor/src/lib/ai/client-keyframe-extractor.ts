/**
 * Client-side keyframe extractor service
 * Calls API endpoints instead of using Node.js modules directly
 */

// Types copied from server-side for client use
export interface ExtractedKeyframe {
  timestamp: number;
  base64Data: string;
  mimeType: "image/jpeg" | "image/png";
  width: number;
  height: number;
  sizeBytes: number;
}

export interface ExtractionResult {
  keyframes: ExtractedKeyframe[];
  videoDuration: number;
  extractionTimeMs: number;
  warnings: string[];
}

export type SamplingStrategy =
  | { type: "uniform"; count: number }
  | { type: "interval"; intervalSeconds: number }
  | { type: "timestamps"; timestamps: number[] }
  | { type: "scene_change"; sensitivity?: number };

/**
 * Client-side keyframe extractor that calls API
 */
export class ClientKeyframeExtractor {
  /**
   * Extract keyframes via API
   */
  async extractKeyframes(videoPath: string, strategy: SamplingStrategy): Promise<ExtractionResult> {
    const response = await fetch("/api/extract-keyframes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoPath, strategy }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to extract keyframes");
    }

    return response.json();
  }
}

/**
 * Quick extraction with uniform sampling
 */
export async function extractUniformKeyframes(
  videoPath: string,
  frameCount: number = 5
): Promise<ExtractedKeyframe[]> {
  const response = await fetch("/api/extract-keyframes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ videoPath, frameCount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to extract keyframes");
  }

  const result = await response.json();
  return result.keyframes;
}

/**
 * Extract keyframes optimized for a specific category
 */
export async function extractKeyframesForCategory(
  videoPath: string,
  category: string
): Promise<ExtractedKeyframe[]> {
  const response = await fetch("/api/extract-keyframes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ videoPath, category }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to extract keyframes");
  }

  const result = await response.json();
  return result.keyframes;
}
