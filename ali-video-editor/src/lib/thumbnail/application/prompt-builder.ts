/**
 * Prompt Builder for Thumbnail Generation
 *
 * Constructs style-specific prompts with exact LoRA trigger phrase.
 */

import type { BrandOptions, ThumbnailStyle } from "../domain";
import { getStyleConfig } from "./style-configs";

// ============================================================================
// LoRA Trigger Phrase
// ============================================================================

/**
 * EXACT LoRA trigger phrase for specialized model
 * This must be used verbatim to activate the YouTube thumbnail LoRA
 */
const LORA_TRIGGER_PHRASE = 'Generate youtube thumbnails using text "{title}"';

// ============================================================================
// Prompt Builder
// ============================================================================

/**
 * Build prompt for thumbnail generation
 *
 * @param titleText - Title text to display
 * @param style - Visual style
 * @param topic - Topic/context
 * @param brandOptions - Brand color and font options
 * @param strategy - Generation strategy (SPECIALIZED vs FALLBACK)
 * @returns Complete prompt for image generation
 */
export function buildPrompt(
  titleText: string,
  style: ThumbnailStyle,
  topic: string,
  brandOptions?: BrandOptions,
  strategy: "SPECIALIZED" | "FALLBACK" = "SPECIALIZED"
): string {
  const styleConfig = getStyleConfig(style);

  // Build brand options description
  const brandDescription = buildBrandDescription(brandOptions, styleConfig);

  let prompt: string;

  if (strategy === "SPECIALIZED") {
    // Use exact LoRA trigger phrase for specialized model
    const trigger = LORA_TRIGGER_PHRASE.replace("{title}", titleText);
    prompt = `${trigger}, ${styleConfig.basePrompt} about ${topic}${brandDescription}`;
  } else {
    // Fallback: don't use LoRA trigger, just describe the scene
    prompt = `YouTube thumbnail for video about "${topic}" with title "${titleText}", ${styleConfig.basePrompt}${brandDescription}`;
  }

  return prompt.trim();
}

/**
 * Build negative prompt
 *
 * @param style - Visual style
 * @returns Negative prompt for the style
 */
export function buildNegativePrompt(style: ThumbnailStyle): string {
  const styleConfig = getStyleConfig(style);

  // Common negative prompts to apply across all styles
  const commonNegative =
    "blurry, low quality, pixelated, distorted, ugly, bad quality, worst quality";

  return `${styleConfig.negativePrompt}, ${commonNegative}`;
}

/**
 * Build brand options description
 *
 * @param brandOptions - Brand color and font options
 * @param styleConfig - Default style configuration
 * @returns String describing brand options
 */
function buildBrandDescription(
  brandOptions: BrandOptions | undefined,
  styleConfig: { defaultColors: { primary: string; accent: string } }
): string {
  const primaryColor = brandOptions?.primaryColor || styleConfig.defaultColors.primary;
  const accentColor = brandOptions?.accentColor || styleConfig.defaultColors.accent;

  return `, using primary color ${primaryColor} and accent color ${accentColor}`;
}

/**
 * Get inference parameters with defaults
 *
 * @param guidanceScale - Optional guidance scale (1.0-20.0)
 * @param numInferenceSteps - Optional inference steps (10-50)
 * @returns Parameters with defaults applied
 */
export function getInferenceParameters(
  guidanceScale?: number,
  numInferenceSteps?: number
): {
  guidance_scale: number;
  num_inference_steps: number;
} {
  return {
    guidance_scale: guidanceScale ?? 7.5,
    num_inference_steps: numInferenceSteps ?? 30,
  };
}

/**
 * Validate prompt parameters
 *
 * @param titleText - Title text
 * @param style - Visual style
 * @param topic - Topic
 * @returns Validation result
 */
export function validatePromptParameters(
  titleText: string,
  style: ThumbnailStyle,
  topic: string
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate title text
  if (!titleText || titleText.trim().length === 0) {
    errors.push("Title text is required");
  }

  const words = titleText.trim().split(/\s+/);
  if (words.length < 2) {
    errors.push("Title must have at least 2 words");
  }
  if (words.length > 7) {
    errors.push("Title must have at most 7 words");
  }

  // Validate topic
  if (!topic || topic.trim().length === 0) {
    errors.push("Topic is required");
  }

  // Validate style
  if (!["HIGH_ENERGY", "MINIMAL_TECH", "FINANCE", "GAMING"].includes(style)) {
    errors.push(`Invalid style: ${style}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
