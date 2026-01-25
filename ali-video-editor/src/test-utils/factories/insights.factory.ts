/**
 * Video Copilot - AI Insights Factory
 * Hybrid factory using faker for dynamic data + fixtures for edge cases
 */

import { AIInsights, SEOMetadata } from "@/types";
import { faker } from "@faker-js/faker";

/**
 * AI Insights Factory
 * Generates realistic test data for AI insights results
 */
export class AIInsightsFactory {
  /**
   * Create AI insights with overrides
   */
  static create(overrides?: Partial<AIInsights>): AIInsights {
    const videoId = faker.string.uuid();

    return {
      id: `insights-${videoId}`,
      videoId,
      scriptSuggestions: generateScriptSuggestions(),
      visualRecommendations: generateVisualRecommendations(),
      pacingSuggestions: generatePacingSuggestions(),
      seoMetadata: generateSEOMetadata(),
      overallImprovementPotential: faker.number.float({ min: 0.3, max: 0.7, fractionDigits: 2 }),
      improvementBreakdown: generateImprovementBreakdown(),
      topInsights: generateTopInsights(),
      processingDuration: faker.number.float({ min: 5, max: 20, fractionDigits: 1 }),
      createdAt: faker.date.past(),
      ...overrides,
    };
  }

  /**
   * Create high-impact insights
   */
  static createHighImpact(overrides?: Partial<AIInsights>): AIInsights {
    return this.create({
      overallImprovementPotential: faker.number.float({ min: 0.6, max: 0.8, fractionDigits: 2 }),
      scriptSuggestions: generateScriptSuggestions({ minImpact: 0.7 }),
      visualRecommendations: generateVisualRecommendations({ minImpact: 0.6 }),
      pacingSuggestions: generatePacingSuggestions({ minImpact: 0.6 }),
      improvementBreakdown: generateImprovementBreakdown({ minOverall: 0.6 }),
      ...overrides,
    });
  }

  /**
   * Create low-impact insights
   */
  static createLowImpact(overrides?: Partial<AIInsights>): AIInsights {
    return this.create({
      overallImprovementPotential: faker.number.float({ min: 0.1, max: 0.3, fractionDigits: 2 }),
      scriptSuggestions: generateScriptSuggestions({ maxImpact: 0.3 }),
      visualRecommendations: generateVisualRecommendations({ maxImpact: 0.3 }),
      pacingSuggestions: generatePacingSuggestions({ maxImpact: 0.3 }),
      improvementBreakdown: generateImprovementBreakdown({ maxOverall: 0.3 }),
      ...overrides,
    });
  }
}

/**
 * Generate script suggestions
 */
function generateScriptSuggestions(options?: {
  minImpact?: number;
  maxImpact?: number;
}): import("@/types").ScriptSuggestion[] {
  const types: Array<"add" | "remove" | "modify" | "reorder"> = [
    "add",
    "remove",
    "modify",
    "reorder",
  ];
  const descriptions = [
    "Add compelling hook in first 30 seconds",
    "Remove filler words for cleaner delivery",
    "Modify structure for better flow",
    "Reorder sections for logical progression",
    "Add call-to-action at end",
  ];
  const minImpact = options?.minImpact || 0.3;
  const maxImpact = options?.maxImpact || 0.7;

  return Array.from({ length: 5 }, (_, i) => ({
    type: types[i % types.length] || "modify",
    description: descriptions[i % descriptions.length] || "Improve script",
    start: i * 30,
    end: (i + 1) * 30,
    suggestedText: faker.lorem.sentence(),
    priority: (i % 5) + 1,
    expectedImpact: faker.number.float({ min: minImpact, max: maxImpact, fractionDigits: 2 }),
  }));
}

/**
 * Generate visual recommendations
 */
function generateVisualRecommendations(options?: {
  minImpact?: number;
  maxImpact?: number;
}): import("@/types").VisualRecommendation[] {
  const types: Array<"zoom" | "crop" | "transition" | "overlay" | "effect"> = [
    "zoom",
    "crop",
    "transition",
    "overlay",
    "effect",
  ];
  const descriptions = [
    "Add dramatic zoom effect at key moments",
    "Crop to focus on important elements",
    "Include smooth transitions between sections",
    "Overlay text for key points",
    "Apply subtle visual effects",
  ];
  const minImpact = options?.minImpact || 0.3;
  const maxImpact = options?.maxImpact || 0.6;

  return Array.from({ length: 5 }, (_, i) => ({
    type: types[i % types.length] || "transition",
    description: descriptions[i % descriptions.length] || "Add visual element",
    start: i * 25 + 5,
    end: i * 25 + 15,
    parameters: {
      intensity: faker.number.float({ min: 0.3, max: 0.8, fractionDigits: 2 }),
      duration: faker.number.float({ min: 1, max: 3, fractionDigits: 1 }),
    },
    priority: (i % 5) + 1,
    expectedImpact: faker.number.float({ min: minImpact, max: maxImpact, fractionDigits: 2 }),
  }));
}

/**
 * Generate pacing suggestions
 */
function generatePacingSuggestions(options?: {
  minImpact?: number;
  maxImpact?: number;
}): import("@/types").PacingSuggestion[] {
  const types: Array<"speed-up" | "slow-down" | "keep" | "add-break"> = [
    "speed-up",
    "slow-down",
    "keep",
    "add-break",
  ];
  const descriptions = [
    "Speed up this section for better engagement",
    "Slow down to emphasize key points",
    "Keep current pacing for this section",
    "Add brief break for viewer retention",
  ];
  const minImpact = options?.minImpact || 0.3;
  const maxImpact = options?.maxImpact || 0.6;

  return Array.from({ length: 5 }, (_, i) => ({
    type: types[i % types.length] || "keep",
    description: descriptions[i % descriptions.length] || "Maintain pacing",
    start: i * 20,
    end: (i + 1) * 20,
    speedMultiplier: faker.number.float({ min: 0.8, max: 1.5, fractionDigits: 2 }),
    priority: (i % 5) + 1,
    expectedImpact: faker.number.float({ min: minImpact, max: maxImpact, fractionDigits: 2 }),
  }));
}

/**
 * Generate SEO metadata
 */
function generateSEOMetadata(): SEOMetadata {
  return {
    title: faker.lorem.sentence({ min: 5, max: 8 }).replace(/\.$/, ""),
    description: faker.lorem.paragraphs(2).substring(0, 300),
    tags: generateTags(),
    chapters: [],
    thumbnailSuggestions: generateThumbnailSuggestions(),
    seoScore: faker.number.float({ min: 0.6, max: 0.95, fractionDigits: 2 }),
    keywords: generateKeywords(),
  };
}

/**
 * Generate tags
 */
function generateTags(): string[] {
  const baseTags = [
    "tutorial",
    "guide",
    "how-to",
    "demo",
    "tips",
    "tricks",
    "best practices",
    "learning",
  ];
  const customTags = Array.from({ length: 5 }, () => faker.word.noun());

  return faker.helpers.arrayElements([...baseTags, ...customTags], { min: 10, max: 15 });
}

/**
 * Generate keywords
 */
function generateKeywords(): string[] {
  return Array.from({ length: 10 }, () => faker.word.noun());
}

/**
 * Generate thumbnail suggestions
 */
function generateThumbnailSuggestions(): import("@/types").ThumbnailSuggestion[] {
  return Array.from({ length: 3 }, (_, i) => ({
    id: faker.string.uuid(),
    timestamp: i * 30,
    imageData: `data:image/jpeg;base64,${faker.string.alphanumeric(100)}`,
    textOverlay: faker.lorem.sentence({ min: 3, max: 6 }),
    predictedCTR: faker.number.float({ min: 0.2, max: 0.5, fractionDigits: 2 }),
    description: faker.lorem.sentence(),
  }));
}

/**
 * Generate improvement breakdown
 */
function generateImprovementBreakdown(options?: {
  minOverall?: number;
  maxOverall?: number;
}): import("@/types").ImprovementBreakdown {
  const minOverall = options?.minOverall || 0.3;
  const maxOverall = options?.maxOverall || 0.6;

  const factors: import("@/types").ImprovementFactor[] = [
    {
      name: "Title Optimization",
      score: faker.number.float({ min: 0.5, max: 0.9, fractionDigits: 2 }),
      weight: 0.2,
      contribution: faker.number.float({ min: 0.1, max: 0.18, fractionDigits: 2 }),
      description: "Optimize title for better search visibility",
      actionableItems: faker.number.int({ min: 1, max: 3 }),
    },
    {
      name: "Description Enhancement",
      score: faker.number.float({ min: 0.5, max: 0.9, fractionDigits: 2 }),
      weight: 0.15,
      contribution: faker.number.float({ min: 0.08, max: 0.14, fractionDigits: 2 }),
      description: "Improve description with keywords and CTAs",
      actionableItems: faker.number.int({ min: 1, max: 3 }),
    },
    {
      name: "Tags & Keywords",
      score: faker.number.float({ min: 0.5, max: 0.9, fractionDigits: 2 }),
      weight: 0.15,
      contribution: faker.number.float({ min: 0.08, max: 0.14, fractionDigits: 2 }),
      description: "Add relevant tags and keywords",
      actionableItems: faker.number.int({ min: 1, max: 2 }),
    },
    {
      name: "Content Improvements",
      score: faker.number.float({ min: 0.5, max: 0.9, fractionDigits: 2 }),
      weight: 0.3,
      contribution: faker.number.float({ min: 0.15, max: 0.27, fractionDigits: 2 }),
      description: "Enhance content structure and delivery",
      actionableItems: faker.number.int({ min: 2, max: 5 }),
    },
    {
      name: "Visual Enhancements",
      score: faker.number.float({ min: 0.5, max: 0.9, fractionDigits: 2 }),
      weight: 0.2,
      contribution: faker.number.float({ min: 0.1, max: 0.18, fractionDigits: 2 }),
      description: "Add visual elements for engagement",
      actionableItems: faker.number.int({ min: 2, max: 4 }),
    },
  ];

  return {
    overall: faker.number.float({ min: minOverall, max: maxOverall, fractionDigits: 2 }),
    factors,
    topPriorities: factors
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3)
      .map((f) => f.name),
    estimatedBoostPercent: Math.round(faker.number.float({ min: 10, max: 30, fractionDigits: 0 })),
    confidenceLevel: faker.helpers.arrayElement(["low", "medium", "high"]),
  };
}

/**
 * Generate top insights
 */
function generateTopInsights(): string[] {
  const insights = [
    "🎯 Optimize title for 25%+ CTR improvement",
    "📝 Enhanced description with keywords and CTAs",
    "🎬 Add visual overlays at key moments",
    "⚡ Speed up slow sections for better pacing",
    "📊 Structure content with clear chapters",
    "🏷️ Add relevant tags for discoverability",
    "🖼️ Thumbnail suggestions with high predicted CTR",
  ];

  return faker.helpers.arrayElements(insights, { min: 3, max: 3 });
}
