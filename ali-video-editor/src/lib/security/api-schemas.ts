/**
 * Video Copilot - API Validation Schemas
 *
 * Zod schemas for validating API request bodies.
 * Provides type-safe validation with descriptive error messages.
 *
 * @module api-schemas
 */

import { z } from "zod";

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * YouTube URL validation
 */
export const youtubeUrlSchema = z
  .string()
  .min(1, "YouTube URL is required")
  .max(500, "URL is too long")
  .regex(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/, "Invalid YouTube URL format");

/**
 * Safe file path validation (basic - additional validation done by path-validator)
 */
export const filePathSchema = z
  .string()
  .min(1, "File path is required")
  .max(1000, "File path is too long")
  .refine((val) => !val.includes("..") && !val.includes("\0"), "Invalid file path");

/**
 * Video ID validation
 */
export const videoIdSchema = z
  .string()
  .min(1, "Video ID is required")
  .max(100, "Video ID is too long")
  .regex(/^[\w-]+$/, "Video ID contains invalid characters");

/**
 * API key format validation (basic format check, not verification)
 */
export const apiKeySchema = z
  .string()
  .min(10, "API key is too short")
  .max(500, "API key is too long")
  .regex(/^[\w-]+$/, "API key contains invalid characters");

/**
 * Base64 encoded data validation
 */
export const base64Schema = z
  .string()
  .min(1, "Data is required")
  .max(100 * 1024 * 1024, "Data is too large (max 100MB)")
  .regex(/^[A-Za-z0-9+/=]+$/, "Invalid base64 encoding");

// ============================================================================
// API Route Schemas
// ============================================================================

/**
 * /api/analyze request body
 */
export const analyzeRequestSchema = z.object({
  videoPath: filePathSchema,
  transcription: z.object({
    id: z.string(),
    videoId: z.string(),
    text: z.string().max(5 * 1024 * 1024, "Transcription text is too large"),
    segments: z.array(z.any()).max(10000, "Too many segments"),
    confidence: z.number().min(0).max(1),
    language: z.string().optional(),
  }),
  config: z.object({}).passthrough().optional(),
  deepgramApiKey: apiKeySchema.optional(),
  geminiApiKey: apiKeySchema.optional(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

/**
 * /api/transcribe request body
 */
export const transcribeRequestSchema = z.object({
  audioBuffer: base64Schema,
  videoId: videoIdSchema,
  deepgramApiKey: apiKeySchema.optional(),
});

export type TranscribeRequest = z.infer<typeof transcribeRequestSchema>;

/**
 * /api/youtube/download request body
 */
export const youtubeDownloadSchema = z.object({
  url: youtubeUrlSchema,
});

export type YoutubeDownloadRequest = z.infer<typeof youtubeDownloadSchema>;

/**
 * /api/youtube/chapters request body
 */
export const youtubeChaptersSchema = z.object({
  url: youtubeUrlSchema,
});

export type YoutubeChaptersRequest = z.infer<typeof youtubeChaptersSchema>;

/**
 * /api/extract-keyframes request body
 */
export const extractKeyframesSchema = z.object({
  videoPath: filePathSchema,
  strategy: z
    .object({
      type: z.enum(["uniform", "interval", "timestamps", "scene_change"]),
      count: z.number().int().positive().max(100).optional(),
      intervalSeconds: z.number().positive().max(3600).optional(),
      timestamps: z.array(z.number().min(0).max(86400)).max(100).optional(),
      sensitivity: z.number().min(0).max(1).optional(),
    })
    .optional(),
  category: z.string().max(50).optional(),
  frameCount: z.number().int().positive().max(100).optional(),
});

export type ExtractKeyframesRequest = z.infer<typeof extractKeyframesSchema>;

/**
 * /api/insights request body
 */
export const insightsRequestSchema = z.object({
  transcription: z.object({
    id: z.string(),
    videoId: z.string(),
    text: z.string().max(5 * 1024 * 1024),
    segments: z.array(z.any()).max(10000),
    confidence: z.number().min(0).max(1),
  }),
  retentionAnalysis: z.object({}).passthrough(),
  videoId: videoIdSchema,
  geminiApiKey: apiKeySchema.optional(),
  keyframes: z
    .array(
      z.object({
        timestamp: z.number().min(0),
        base64Data: base64Schema,
        mimeType: z.string(),
      })
    )
    .max(50)
    .optional(),
});

export type InsightsRequest = z.infer<typeof insightsRequestSchema>;

/**
 * /api/generate-description request body
 */
export const generateDescriptionSchema = z.object({
  videoId: videoIdSchema,
  transcription: z
    .string()
    .min(10)
    .max(5 * 1024 * 1024),
  title: z.string().max(200).optional(),
  chapters: z
    .array(
      z.object({
        title: z.string().max(200),
        start: z.number().min(0),
        end: z.number().min(0),
      })
    )
    .max(100)
    .optional(),
  options: z.object({
    length: z.enum(["short", "medium", "long"]),
    tone: z.enum(["professional", "casual", "engaging"]),
    includeHashtags: z.boolean(),
    customKeywords: z.array(z.string().max(50)).max(20).optional(),
    includeChapters: z.boolean(),
    channelName: z.string().max(100).optional(),
    socialLinks: z
      .object({
        twitter: z.string().url().optional(),
        instagram: z.string().url().optional(),
        tiktok: z.string().url().optional(),
        website: z.string().url().optional(),
      })
      .optional(),
  }),
});

export type GenerateDescriptionRequest = z.infer<typeof generateDescriptionSchema>;

/**
 * /api/deepgram/validate request body
 */
export const validateApiKeySchema = z.object({
  apiKey: apiKeySchema,
});

export type ValidateApiKeyRequest = z.infer<typeof validateApiKeySchema>;

/**
 * /api/thumbnails/generate request body
 */
export const thumbnailGenerationSchema = z.object({
  titleText: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title is too long")
    .refine((val) => {
      const words = val.trim().split(/\s+/);
      return words.length >= 2;
    }, "Title must have at least 2 words")
    .refine((val) => {
      const words = val.trim().split(/\s+/);
      return words.length <= 7;
    }, "Title must have at most 7 words"),
  topic: z.string().min(1, "Topic is required").max(200, "Topic is too long"),
  style: z.enum(["HIGH_ENERGY", "MINIMAL_TECH", "FINANCE", "GAMING"]),
  faceImageUrl: z.string().url().optional(),
  brandOptions: z
    .object({
      primaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Primary color must be in hex format (#RRGGBB)")
        .optional(),
      accentColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Accent color must be in hex format (#RRGGBB)")
        .optional(),
      fontStyle: z.enum(["bold", "modern", "playful", "professional"]).optional(),
    })
    .optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
  numInferenceSteps: z.number().int().min(10).max(50).optional(),
  seed: z.number().int().min(0).optional(),
  huggingfaceApiKey: apiKeySchema.optional(),
});

export type ThumbnailGenerationRequest = z.infer<typeof thumbnailGenerationSchema>;

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validate request body with a schema and return typed result or error
 */
export function validateRequestBody<T extends z.ZodSchema>(
  schema: T,
  body: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors into a readable message
  const errors = result.error.errors.map((err) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });

  return { success: false, error: errors.join("; ") };
}
