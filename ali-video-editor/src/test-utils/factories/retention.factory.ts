/**
 * Video Copilot - Retention Analysis Factory
 * Hybrid factory using faker for dynamic data + fixtures for edge cases
 */

import { RetentionAnalysis } from "@/types";
import { faker } from "@faker-js/faker";

/**
 * Retention Analysis Factory
 * Generates realistic test data for retention analysis results
 */
export class RetentionAnalysisFactory {
  /**
   * Create a retention analysis with overrides
   */
  static create(overrides?: Partial<RetentionAnalysis>): RetentionAnalysis {
    const suspenseCount = faker.number.int({ min: 2, max: 10 });
    const curiosityCount = faker.number.int({ min: 2, max: 10 });

    return {
      id: faker.string.uuid(),
      videoId: faker.string.uuid(),
      suspenseMoments: generateSuspenseMoments(suspenseCount),
      curiosityMoments: generateCuriosityMoments(curiosityCount),
      retentionScores: generateRetentionScores(),
      emotionalTones: generateEmotionalTones(),
      visualScenes: generateVisualScenes(),
      contentQuality: generateContentQuality(),
      overallEngagementPrediction: faker.number.float({ min: 0.6, max: 0.95, fractionDigits: 2 }),
      averageRetentionRate: faker.number.float({ min: 0.5, max: 0.9, fractionDigits: 2 }),
      keyInsights: generateKeyInsights(),
      processingDuration: faker.number.float({ min: 2, max: 15, fractionDigits: 1 }),
      createdAt: faker.date.past(),
      ...overrides,
    };
  }

  /**
   * Create a high-engagement retention analysis
   */
  static createHighEngagement(overrides?: Partial<RetentionAnalysis>): RetentionAnalysis {
    return this.create({
      overallEngagementPrediction: faker.number.float({ min: 0.85, max: 0.95, fractionDigits: 2 }),
      averageRetentionRate: faker.number.float({ min: 0.75, max: 0.9, fractionDigits: 2 }),
      contentQuality: generateContentQuality({ minScore: 0.8 }),
      ...overrides,
    });
  }

  /**
   * Create a low-engagement retention analysis
   */
  static createLowEngagement(overrides?: Partial<RetentionAnalysis>): RetentionAnalysis {
    return this.create({
      overallEngagementPrediction: faker.number.float({ min: 0.4, max: 0.6, fractionDigits: 2 }),
      averageRetentionRate: faker.number.float({ min: 0.3, max: 0.5, fractionDigits: 2 }),
      contentQuality: generateContentQuality({ maxScore: 0.6 }),
      ...overrides,
    });
  }
}

/**
 * Generate suspense moments
 */
function generateSuspenseMoments(count: number): import("@/types").SuspenseMoment[] {
  const suspenseTypes: Array<"audio" | "visual" | "content" | "combined"> = [
    "audio",
    "visual",
    "content",
    "combined",
  ];
  const descriptions = [
    "Dramatic pause creates anticipation",
    "Visual buildup creates tension",
    "Content reveals maintain interest",
    "Audio-visual combination maximizes suspense",
  ];

  return Array.from({ length: count }, (_, i) => ({
    start: parseFloat((i * 30).toFixed(1)),
    end: parseFloat(
      (i * 30 + faker.number.float({ min: 5, max: 15, fractionDigits: 1 })).toFixed(1)
    ),
    intensity: faker.number.float({ min: 0.6, max: 1.0, fractionDigits: 2 }),
    type: suspenseTypes[i % suspenseTypes.length] || "combined",
    description: descriptions[i % descriptions.length] || "Suspense moment",
    confidence: faker.number.float({ min: 0.7, max: 0.95, fractionDigits: 2 }),
  }));
}

/**
 * Generate curiosity moments
 */
function generateCuriosityMoments(count: number): import("@/types").CuriosityMoment[] {
  const triggers = [
    "Question posed to audience",
    "Teaser for upcoming content",
    "Mystery element introduced",
    "Knowledge gap created",
  ];
  const descriptions = [
    "Audience engagement through questioning",
    "Curiosity sparked by teaser",
    "Mystery maintains viewer interest",
    "Knowledge gap encourages continued watching",
  ];

  return Array.from({ length: count }, (_, i) => ({
    start: parseFloat((i * 25 + 10).toFixed(1)),
    end: parseFloat(
      (i * 25 + 10 + faker.number.float({ min: 3, max: 10, fractionDigits: 1 })).toFixed(1)
    ),
    score: faker.number.float({ min: 0.5, max: 0.95, fractionDigits: 2 }),
    trigger: triggers[i % triggers.length] || "Knowledge gap created",
    description: descriptions[i % descriptions.length] || "Curiosity moment",
    confidence: faker.number.float({ min: 0.7, max: 0.95, fractionDigits: 2 }),
  }));
}

/**
 * Generate retention scores
 */
function generateRetentionScores(): import("@/types").RetentionScore[] {
  const scores: import("@/types").RetentionScore[] = [];

  for (let i = 0; i < 60; i++) {
    // Simulate realistic retention curve
    const baseRetention = 0.9 - i * 0.005; // Gradual decline
    const variation = faker.number.float({ min: -0.05, max: 0.05, fractionDigits: 3 });
    const start = i * 10;

    scores.push({
      start,
      end: start + 10,
      retentionRate: Math.max(0.1, Math.min(1.0, baseRetention + variation)),
      engagementScore: faker.number.float({ min: 0.3, max: 0.9, fractionDigits: 2 }),
      dropOffRisk: faker.number.float({ min: 0, max: 0.5, fractionDigits: 2 }),
    });
  }

  return scores;
}

/**
 * Generate emotional tones
 */
function generateEmotionalTones(): import("@/types").EmotionalTone[] {
  const emotions = ["excitement", "curiosity", "inspiration", "enthusiasm", "urgency"];
  const secondaries = ["hope", "anticipation", "confidence", "motivation"];

  return emotions.map((primary, i) => ({
    primary,
    secondary: secondaries[i % secondaries.length],
    confidence: faker.number.float({ min: 0.7, max: 0.95, fractionDigits: 2 }),
    start: i * 30,
    end: (i + 1) * 30,
  }));
}

/**
 * Generate visual scenes
 */
function generateVisualScenes(): import("@/types").VisualScene[] {
  const sceneTypes: Array<"talking-head" | "screen-share" | "presentation" | "demo" | "other"> = [
    "talking-head",
    "screen-share",
    "presentation",
    "demo",
    "other",
  ];
  const descriptions = [
    "Presenter on camera explaining concepts",
    "Screen sharing showing examples",
    "Presentation slides with key points",
    "Demonstration of techniques",
    "Mixed visual elements",
  ];

  return sceneTypes.map((type, i) => ({
    start: i * 20,
    end: (i + 1) * 20,
    type,
    actionIntensity: faker.number.float({ min: 0.2, max: 0.8, fractionDigits: 2 }),
    visualComplexity: faker.number.float({ min: 0.3, max: 0.9, fractionDigits: 2 }),
    description: descriptions[i % descriptions.length] || "Scene description",
  }));
}

/**
 * Generate content quality
 */
function generateContentQuality(options?: {
  minScore?: number;
  maxScore?: number;
}): import("@/types").ContentQuality {
  const minScore = options?.minScore || 0.5;
  const maxScore = options?.maxScore || 0.9;

  return {
    overallScore: faker.number.float({ min: minScore, max: maxScore, fractionDigits: 2 }),
    clarity: faker.number.float({ min: minScore, max: maxScore, fractionDigits: 2 }),
    engagement: faker.number.float({ min: minScore, max: maxScore, fractionDigits: 2 }),
    structure: faker.number.float({ min: minScore, max: maxScore, fractionDigits: 2 }),
    pacing: faker.number.float({ min: minScore, max: maxScore, fractionDigits: 2 }),
    visualQuality: faker.number.float({ min: minScore, max: maxScore, fractionDigits: 2 }),
    audioQuality: faker.number.float({ min: minScore, max: maxScore, fractionDigits: 2 }),
  };
}

/**
 * Generate key insights
 */
function generateKeyInsights(): string[] {
  const insights = [
    "Strong hook in first 30 seconds maintains viewer attention",
    "Varied pacing prevents viewer fatigue",
    "Visual elements enhance information retention",
    "Clear structure improves content comprehension",
    "Emotional engagement peaks in middle section",
  ];

  return faker.helpers.arrayElements(insights, { min: 2, max: 5 });
}
