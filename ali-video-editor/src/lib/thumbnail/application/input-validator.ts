/**
 * Input Validator for Thumbnail Generation
 *
 * Validates user input using Zod schemas and additional content filtering.
 */

import { z } from "zod";
import type { BrandOptions } from "../domain";
import {
  BlockedContentError,
  PIIError,
  VALIDATION_RULES,
  ValidationError,
  containsBlockedWords,
  containsPII,
} from "../domain";

// ============================================================================
// Zod Validation Schemas
// ============================================================================

/**
 * Brand options schema
 */
export const brandOptionsSchema = z
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
  .optional();

/**
 * Thumbnail generation request schema
 */
export const thumbnailGenerationSchema = z.object({
  titleText: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(VALIDATION_RULES.MAX_TITLE_LENGTH, "Title is too long")
    .refine((val) => {
      const words = val.trim().split(/\s+/);
      return words.length >= VALIDATION_RULES.MIN_TITLE_WORDS;
    }, `Title must have at least ${VALIDATION_RULES.MIN_TITLE_WORDS} words`)
    .refine((val) => {
      const words = val.trim().split(/\s+/);
      return words.length <= VALIDATION_RULES.MAX_TITLE_WORDS;
    }, `Title must have at most ${VALIDATION_RULES.MAX_TITLE_WORDS} words`)
    .refine((val) => !containsPII(val), "Title cannot contain personally identifiable information")
    .refine((val) => !containsBlockedWords(val), "Title contains blocked content"),
  topic: z
    .string()
    .min(1, "Topic is required")
    .max(VALIDATION_RULES.MAX_TOPIC_LENGTH, "Topic is too long")
    .refine((val) => !containsPII(val), "Topic cannot contain personally identifiable information")
    .refine((val) => !containsBlockedWords(val), "Topic contains blocked content"),
  style: z.enum(["HIGH_ENERGY", "MINIMAL_TECH", "FINANCE", "GAMING"], {
    errorMap: () => ({
      message: "Invalid style. Must be one of: HIGH_ENERGY, MINIMAL_TECH, FINANCE, GAMING",
    }),
  }),
  faceImageUrl: z.string().url("Invalid face image URL").optional(),
  brandOptions: brandOptionsSchema,
  guidanceScale: z
    .number()
    .min(
      VALIDATION_RULES.MIN_GUIDANCE_SCALE,
      `Guidance scale must be at least ${VALIDATION_RULES.MIN_GUIDANCE_SCALE}`
    )
    .max(
      VALIDATION_RULES.MAX_GUIDANCE_SCALE,
      `Guidance scale must be at most ${VALIDATION_RULES.MAX_GUIDANCE_SCALE}`
    )
    .optional(),
  numInferenceSteps: z
    .number()
    .int("Number of inference steps must be an integer")
    .min(
      VALIDATION_RULES.MIN_INFERENCE_STEPS,
      `Must have at least ${VALIDATION_RULES.MIN_INFERENCE_STEPS} steps`
    )
    .max(
      VALIDATION_RULES.MAX_INFERENCE_STEPS,
      `Cannot exceed ${VALIDATION_RULES.MAX_INFERENCE_STEPS} steps`
    )
    .optional(),
  seed: z.number().int().min(0).max(VALIDATION_RULES.MAX_SEED).optional(),
});

/**
 * Type for validated thumbnail generation request
 */
export type ValidatedThumbnailGenerationRequest = z.infer<typeof thumbnailGenerationSchema>;

// ============================================================================
// Validator Class
// ============================================================================

/**
 * Input validator for thumbnail generation
 *
 * Validates and sanitizes user input before processing.
 */
export class InputValidator {
  /**
   * Validate thumbnail generation request
   *
   * @param data - Raw input data
   * @returns Validated and sanitized request
   * @throws ValidationError if validation fails
   */
  validate(data: unknown): ValidatedThumbnailGenerationRequest {
    // Run Zod schema validation
    const result = thumbnailGenerationSchema.safeParse(data);

    if (!result.success) {
      const errors = result.error.errors.map((err) => {
        const path = err.path.join(".");
        return path ? `${path}: ${err.message}` : err.message;
      });

      throw new ValidationError(errors.join("; "));
    }

    return result.data;
  }

  /**
   * Safe validation that returns errors without throwing
   *
   * @param data - Raw input data
   * @returns Validation result with success status
   */
  safeValidate(data: unknown): {
    success: boolean;
    data?: ValidatedThumbnailGenerationRequest;
    errors?: string[];
  } {
    try {
      const validated = this.validate(data);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          errors: error.message.split("; ").map((e) => e.trim()),
        };
      }

      return {
        success: false,
        errors: ["Validation failed with unknown error"],
      };
    }
  }

  /**
   * Validate title text specifically
   *
   * @param titleText - Title text to validate
   * @throws ValidationError or PIIError or BlockedContentError
   */
  validateTitleText(titleText: string): void {
    if (!titleText || titleText.trim().length === 0) {
      throw new ValidationError("Title text is required");
    }

    if (titleText.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
      throw new ValidationError("Title is too long");
    }

    const words = titleText.trim().split(/\s+/);
    if (words.length < VALIDATION_RULES.MIN_TITLE_WORDS) {
      throw new ValidationError(
        `Title must have at least ${VALIDATION_RULES.MIN_TITLE_WORDS} words`
      );
    }
    if (words.length > VALIDATION_RULES.MAX_TITLE_WORDS) {
      throw new ValidationError(
        `Title must have at most ${VALIDATION_RULES.MAX_TITLE_WORDS} words`
      );
    }

    if (containsPII(titleText)) {
      throw new PIIError();
    }

    if (containsBlockedWords(titleText)) {
      throw new BlockedContentError();
    }
  }

  /**
   * Validate topic specifically
   *
   * @param topic - Topic to validate
   * @throws ValidationError or PIIError or BlockedContentError
   */
  validateTopic(topic: string): void {
    if (!topic || topic.trim().length === 0) {
      throw new ValidationError("Topic is required");
    }

    if (topic.length > VALIDATION_RULES.MAX_TOPIC_LENGTH) {
      throw new ValidationError("Topic is too long");
    }

    if (containsPII(topic)) {
      throw new PIIError();
    }

    if (containsBlockedWords(topic)) {
      throw new BlockedContentError();
    }
  }

  /**
   * Validate style
   *
   * @param style - Style to validate
   * @throws ValidationError if invalid
   */
  validateStyle(style: string): void {
    const validStyles = ["HIGH_ENERGY", "MINIMAL_TECH", "FINANCE", "GAMING"];

    if (!validStyles.includes(style)) {
      throw new ValidationError(
        `Invalid style: ${style}. Must be one of: ${validStyles.join(", ")}`
      );
    }
  }

  /**
   * Validate brand options
   *
   * @param brandOptions - Brand options to validate
   * @throws ValidationError if invalid
   */
  validateBrandOptions(brandOptions?: BrandOptions): void {
    if (!brandOptions) {
      return;
    }

    if (brandOptions.primaryColor && !validHexColor(brandOptions.primaryColor)) {
      throw new ValidationError("Primary color must be in hex format (#RRGGBB)");
    }

    if (brandOptions.accentColor && !validHexColor(brandOptions.accentColor)) {
      throw new ValidationError("Accent color must be in hex format (#RRGGBB)");
    }

    const validFontStyles = ["bold", "modern", "playful", "professional"];
    if (brandOptions.fontStyle && !validFontStyles.includes(brandOptions.fontStyle)) {
      throw new ValidationError(
        `Invalid font style. Must be one of: ${validFontStyles.join(", ")}`
      );
    }
  }

  /**
   * Sanitize text input
   *
   * @param text - Text to sanitize
   * @returns Sanitized text
   */
  sanitizeText(text: string): string {
    return text.trim().replace(/\s+/g, " ");
  }

  /**
   * Generate random seed if not provided
   *
   * @param seed - Optional seed
   * @returns Seed value
   */
  normalizeSeed(seed?: number): number {
    if (seed !== undefined) {
      return Math.min(Math.max(0, Math.floor(seed)), VALIDATION_RULES.MAX_SEED);
    }
    return Math.floor(Math.random() * VALIDATION_RULES.MAX_SEED);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate hex color format
 */
function validHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Create validator instance
 */
export const inputValidator = new InputValidator();
