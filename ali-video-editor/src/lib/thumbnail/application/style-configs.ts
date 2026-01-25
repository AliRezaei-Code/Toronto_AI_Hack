/**
 * Style Configurations for Thumbnail Generation
 *
 * Defines style-specific prompts, colors, and brand options.
 */

import type { StyleConfig } from "../domain";

// ============================================================================
// Style Configurations
// ============================================================================

/**
 * Style configurations for different thumbnail styles
 */
export const STYLE_CONFIGS: Record<
  "HIGH_ENERGY" | "MINIMAL_TECH" | "FINANCE" | "GAMING",
  StyleConfig
> = {
  HIGH_ENERGY: {
    basePrompt:
      "vibrant eye-catching YouTube thumbnail with bold expressive face, bright saturated colors, dynamic pose, surprised reaction expression, high contrast, energetic atmosphere",
    negativePrompt:
      "boring, dull colors, static pose, small text, cluttered background, low contrast, muted tones",
    defaultColors: {
      primary: "#FF0000",
      accent: "#FFFF00",
    },
    fontStyle: "bold",
  },

  MINIMAL_TECH: {
    basePrompt:
      "clean minimalist tech YouTube thumbnail, soft gradient background, modern sans-serif typography, subtle tech elements, professional aesthetic, simple composition",
    negativePrompt: "cluttered, too many colors, busy background, outdated design, chaotic, messy",
    defaultColors: {
      primary: "#1A1A2E",
      accent: "#4ECDC4",
    },
    fontStyle: "modern",
  },

  FINANCE: {
    basePrompt:
      "professional finance YouTube thumbnail, charts graphs, green money elements, authoritative confident expression, clean data visualization, trustworthy appearance",
    negativePrompt: "unprofessional, cartoon, low quality, pixelated, messy, dishonest looking",
    defaultColors: {
      primary: "#1B4332",
      accent: "#40916C",
    },
    fontStyle: "professional",
  },

  GAMING: {
    basePrompt:
      "dynamic gaming YouTube thumbnail, neon glow effects, action scene, RGB lighting, intense expression, energetic gaming atmosphere, high impact visuals",
    negativePrompt: "static, boring, no action, low energy, dull, lifeless",
    defaultColors: {
      primary: "#7B2CBF",
      accent: "#E500A4",
    },
    fontStyle: "playful",
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get style configuration for a given style
 */
export function getStyleConfig(
  style: "HIGH_ENERGY" | "MINIMAL_TECH" | "FINANCE" | "GAMING"
): StyleConfig {
  return STYLE_CONFIGS[style];
}

/**
 * Get all available styles
 */
export function getAvailableStyles(): Array<{ value: string; label: string }> {
  return [
    { value: "HIGH_ENERGY", label: "High Energy" },
    { value: "MINIMAL_TECH", label: "Minimal Tech" },
    { value: "FINANCE", label: "Finance" },
    { value: "GAMING", label: "Gaming" },
  ];
}
