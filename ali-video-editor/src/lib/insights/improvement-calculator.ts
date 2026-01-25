/**
 * Video Copilot - Improvement Potential Calculator
 * Production-grade, SOLID, DRY modular calculator for AI insights
 * 
 * Calculates improvement potential based on:
 * - SEO improvements (title, description, tags optimization)
 * - Content suggestions impact (script, visual, pacing)
 * - Metadata completeness and quality
 * - Thumbnail optimization potential
 * - Retention gap analysis
 */

import {
  PacingSuggestion,
  RetentionAnalysis,
  ScriptSuggestion,
  SEOMetadata,
  VisualRecommendation,
} from "../../types";
import { logger } from "../logger";

// ============================================================================
// Interfaces - Single Responsibility Principle
// ============================================================================

/**
 * Individual factor contribution to improvement potential
 */
export interface ImprovementFactor {
  /** Factor name for display/logging */
  name: string;
  /** Raw score (0-1) */
  score: number;
  /** Weight applied (0-1) */
  weight: number;
  /** Weighted contribution */
  contribution: number;
  /** Human-readable description */
  description: string;
  /** Actionable items count */
  actionableItems: number;
}

/**
 * Complete improvement breakdown for transparency
 */
export interface ImprovementBreakdown {
  /** Overall potential (0-1) */
  overall: number;
  /** Individual factor contributions */
  factors: ImprovementFactor[];
  /** Top 3 priorities for improvement */
  topPriorities: string[];
  /** Estimated boost percentage for display */
  estimatedBoostPercent: number;
  /** Confidence level of the estimation */
  confidenceLevel: "low" | "medium" | "high";
}

/**
 * Input data for improvement calculation
 */
export interface ImprovementCalculatorInput {
  scriptSuggestions: ScriptSuggestion[];
  visualRecommendations: VisualRecommendation[];
  pacingSuggestions: PacingSuggestion[];
  retentionAnalysis: RetentionAnalysis;
  seoMetadata: SEOMetadata;
  /** Original title from video metadata (if available) */
  originalTitle?: string;
  /** Original description (if available) */
  originalDescription?: string;
  /** Original tags (if available) */
  originalTags?: string[];
}

// ============================================================================
// Weight Configuration - Open/Closed Principle
// ============================================================================

/**
 * Configurable weights for improvement factors
 * Can be extended without modifying calculator core
 */
interface WeightConfig {
  seoTitle: number;
  seoDescription: number;
  seoTags: number;
  contentSuggestions: number;
  thumbnailOptimization: number;
  retentionGap: number;
  metadataCompleteness: number;
}

const DEFAULT_WEIGHTS: WeightConfig = {
  seoTitle: 0.15,           // 15% - Title optimization is high impact
  seoDescription: 0.12,     // 12% - Description optimization
  seoTags: 0.08,            // 8% - Tags/keywords optimization
  contentSuggestions: 0.25, // 25% - Script, visual, pacing suggestions
  thumbnailOptimization: 0.15, // 15% - Thumbnail can significantly boost CTR
  retentionGap: 0.15,       // 15% - Room for retention improvement
  metadataCompleteness: 0.10, // 10% - Overall metadata quality
};

// ============================================================================
// Calculator Strategies - Strategy Pattern / Dependency Inversion
// ============================================================================

/**
 * Interface for individual scoring strategies
 */
interface IScoringStrategy {
  calculate(input: ImprovementCalculatorInput): ImprovementFactor;
}

/**
 * SEO Title Improvement Strategy
 * Calculates improvement potential from title optimization
 */
class TitleImprovementStrategy implements IScoringStrategy {
  private weight: number;

  constructor(weight: number = DEFAULT_WEIGHTS.seoTitle) {
    this.weight = weight;
  }

  calculate(input: ImprovementCalculatorInput): ImprovementFactor {
    const { seoMetadata, originalTitle } = input;
    const suggestedTitle = seoMetadata.title;

    let score = 0;
    let actionableItems = 0;
    const reasons: string[] = [];

    // 1. Title length optimization (YouTube optimal: 50-60 chars)
    const titleLength = suggestedTitle.length;
    if (titleLength >= 45 && titleLength <= 65) {
      score += 0.25;
      reasons.push("optimal length");
    } else if (titleLength < 30) {
      score += 0.15;
      actionableItems++;
      reasons.push("short title enhanced");
    } else if (titleLength > 70) {
      score += 0.1;
      actionableItems++;
      reasons.push("long title trimmed");
    } else {
      score += 0.2;
    }

    // 2. Title contains power words / hooks
    const powerWords = [
      "secret", "proven", "ultimate", "free", "new", "now",
      "best", "complete", "guide", "how", "why", "master",
      "unlock", "boost", "essential", "powerful", "simple"
    ];
    const hasPowerWord = powerWords.some(word => 
      suggestedTitle.toLowerCase().includes(word.toLowerCase())
    );
    if (hasPowerWord) {
      score += 0.2;
      reasons.push("power word included");
    } else {
      actionableItems++;
    }

    // 3. Title has numbers or specific values
    const hasNumbers = /\d+/.test(suggestedTitle);
    if (hasNumbers) {
      score += 0.15;
      reasons.push("includes specificity");
    }

    // 4. Title improvement from original
    if (originalTitle && originalTitle.trim()) {
      const isImprovement = this.isSignificantImprovement(originalTitle, suggestedTitle);
      if (isImprovement) {
        score += 0.25;
        actionableItems++;
        reasons.push("improved from original");
      }
    } else {
      // No original title - we're providing new value
      score += 0.3;
      actionableItems++;
      reasons.push("new optimized title");
    }

    // 5. Title has emotional/curiosity trigger
    const emotionalWords = ["amazing", "incredible", "shocking", "finally", "discover"];
    const hasEmotional = emotionalWords.some(word =>
      suggestedTitle.toLowerCase().includes(word.toLowerCase())
    );
    if (hasEmotional) {
      score += 0.1;
      reasons.push("emotional trigger");
    }

    // Cap score at 1.0
    score = Math.min(score, 1.0);

    return {
      name: "Title Optimization",
      score,
      weight: this.weight,
      contribution: score * this.weight,
      description: reasons.length > 0 
        ? `Title improvements: ${reasons.join(", ")}`
        : "Title analysis complete",
      actionableItems,
    };
  }

  private isSignificantImprovement(original: string, suggested: string): boolean {
    if (original === suggested) {
      return false;
    }
    
    // Check if suggested is significantly different (not just minor tweaks)
    const originalLower = original.toLowerCase().trim();
    const suggestedLower = suggested.toLowerCase().trim();
    
    // Calculate simple similarity
    const similarity = this.calculateSimilarity(originalLower, suggestedLower);
    
    // If significantly different (less than 70% similar), it's an improvement
    return similarity < 0.7;
  }

  private calculateSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    
    let matches = 0;
    wordsA.forEach(word => {
      if (wordsB.has(word)) {
        matches++;
      }
    });
    
    return matches / Math.max(wordsA.size, wordsB.size);
  }
}

/**
 * SEO Description Improvement Strategy
 */
class DescriptionImprovementStrategy implements IScoringStrategy {
  private weight: number;

  constructor(weight: number = DEFAULT_WEIGHTS.seoDescription) {
    this.weight = weight;
  }

  calculate(input: ImprovementCalculatorInput): ImprovementFactor {
    const { seoMetadata, originalDescription } = input;
    const description = seoMetadata.description;

    let score = 0;
    let actionableItems = 0;
    const reasons: string[] = [];

    // 1. Description length (optimal: 150-300 chars for above-fold, up to 5000 total)
    const length = description.length;
    if (length >= 150 && length <= 300) {
      score += 0.3;
      reasons.push("optimal length");
    } else if (length >= 100 && length <= 400) {
      score += 0.2;
      reasons.push("good length");
    } else if (length < 100) {
      score += 0.1;
      actionableItems++;
    }

    // 2. Contains call-to-action
    const ctaWords = ["subscribe", "like", "comment", "share", "click", "watch", "learn", "discover"];
    const hasCTA = ctaWords.some(word => 
      description.toLowerCase().includes(word.toLowerCase())
    );
    if (hasCTA) {
      score += 0.2;
      reasons.push("has CTA");
    } else {
      actionableItems++;
    }

    // 3. Contains keywords from tags
    const keywordsInDesc = seoMetadata.tags.filter(tag =>
      description.toLowerCase().includes(tag.toLowerCase())
    ).length;
    const keywordRatio = keywordsInDesc / Math.max(seoMetadata.tags.length, 1);
    score += keywordRatio * 0.2;
    if (keywordRatio > 0.3) {
      reasons.push("keyword-rich");
    }

    // 4. Improvement from original
    if (originalDescription && originalDescription.trim()) {
      if (description.length > originalDescription.length * 0.5) {
        score += 0.2;
        actionableItems++;
        reasons.push("enhanced from original");
      }
    } else {
      score += 0.25;
      actionableItems++;
      reasons.push("new optimized description");
    }

    // 5. Has value proposition
    const valueWords = ["you'll", "you will", "learn", "master", "understand", "discover"];
    const hasValue = valueWords.some(word =>
      description.toLowerCase().includes(word.toLowerCase())
    );
    if (hasValue) {
      score += 0.1;
      reasons.push("value proposition");
    }

    score = Math.min(score, 1.0);

    return {
      name: "Description Optimization",
      score,
      weight: this.weight,
      contribution: score * this.weight,
      description: reasons.length > 0
        ? `Description improvements: ${reasons.join(", ")}`
        : "Description analysis complete",
      actionableItems,
    };
  }
}

/**
 * SEO Tags/Keywords Improvement Strategy
 */
class TagsImprovementStrategy implements IScoringStrategy {
  private weight: number;

  constructor(weight: number = DEFAULT_WEIGHTS.seoTags) {
    this.weight = weight;
  }

  calculate(input: ImprovementCalculatorInput): ImprovementFactor {
    const { seoMetadata, originalTags } = input;
    const tags = seoMetadata.tags;

    let score = 0;
    let actionableItems = 0;
    const reasons: string[] = [];

    // 1. Tag count (optimal: 8-15 tags)
    const tagCount = tags.length;
    if (tagCount >= 8 && tagCount <= 15) {
      score += 0.35;
      reasons.push("optimal tag count");
    } else if (tagCount >= 5 && tagCount <= 20) {
      score += 0.25;
      reasons.push("good tag count");
    } else if (tagCount > 0) {
      score += 0.15;
      actionableItems++;
    }

    // 2. Tag variety (mix of short and long-tail)
    const hasVariety = tags.some(t => t.split(" ").length > 1); // Has multi-word tags
    if (hasVariety) {
      score += 0.2;
      reasons.push("includes long-tail keywords");
    } else {
      actionableItems++;
    }

    // 3. Tags in title/description
    const tagsInTitle = tags.filter(tag =>
      seoMetadata.title.toLowerCase().includes(tag.toLowerCase())
    ).length;
    if (tagsInTitle > 0) {
      score += 0.15;
      reasons.push("tags align with title");
    }

    // 4. Improvement from original
    if (originalTags && originalTags.length > 0) {
      const newTags = tags.filter(t => !originalTags.includes(t)).length;
      if (newTags > 0) {
        score += 0.2;
        actionableItems += newTags;
        reasons.push(`${newTags} new tags added`);
      }
    } else {
      score += 0.25;
      actionableItems = tags.length;
      reasons.push("new keyword strategy");
    }

    // 5. Relevance to content (based on keywords presence)
    if (seoMetadata.keywords && seoMetadata.keywords.length > 0) {
      const keywordCoverage = tags.filter(tag =>
        seoMetadata.keywords.includes(tag.toLowerCase())
      ).length / Math.max(tags.length, 1);
      score += keywordCoverage * 0.15;
    }

    score = Math.min(score, 1.0);

    return {
      name: "Tags & Keywords",
      score,
      weight: this.weight,
      contribution: score * this.weight,
      description: reasons.length > 0
        ? `Tag optimization: ${reasons.join(", ")}`
        : "Tag analysis complete",
      actionableItems,
    };
  }
}

/**
 * Content Suggestions Impact Strategy
 * Aggregates script, visual, and pacing suggestions
 */
class ContentSuggestionsStrategy implements IScoringStrategy {
  private weight: number;

  constructor(weight: number = DEFAULT_WEIGHTS.contentSuggestions) {
    this.weight = weight;
  }

  calculate(input: ImprovementCalculatorInput): ImprovementFactor {
    const { scriptSuggestions, visualRecommendations, pacingSuggestions } = input;

    let score = 0;
    let actionableItems = 0;
    const reasons: string[] = [];

    // Calculate weighted impact from each suggestion type
    const scriptImpact = this.calculateSuggestionImpact(scriptSuggestions, "script");
    const visualImpact = this.calculateSuggestionImpact(visualRecommendations, "visual");
    const pacingImpact = this.calculateSuggestionImpact(pacingSuggestions, "pacing");

    // Weight sub-categories: script 40%, visual 35%, pacing 25%
    const combinedImpact = 
      scriptImpact.score * 0.40 +
      visualImpact.score * 0.35 +
      pacingImpact.score * 0.25;

    score = combinedImpact;
    actionableItems = scriptImpact.count + visualImpact.count + pacingImpact.count;

    if (scriptSuggestions.length > 0) {
      reasons.push(`${scriptSuggestions.length} script improvements`);
    }
    if (visualRecommendations.length > 0) {
      reasons.push(`${visualRecommendations.length} visual enhancements`);
    }
    if (pacingSuggestions.length > 0) {
      reasons.push(`${pacingSuggestions.length} pacing adjustments`);
    }

    // Bonus for having suggestions across multiple categories
    const categoriesWithSuggestions = [
      scriptSuggestions.length > 0,
      visualRecommendations.length > 0,
      pacingSuggestions.length > 0,
    ].filter(Boolean).length;

    if (categoriesWithSuggestions >= 2) {
      score += 0.1;
      reasons.push("multi-category improvements");
    }

    // Minimum score if we have any suggestions
    if (actionableItems > 0 && score < 0.3) {
      score = 0.3;
    }

    score = Math.min(score, 1.0);

    return {
      name: "Content Suggestions",
      score,
      weight: this.weight,
      contribution: score * this.weight,
      description: reasons.length > 0
        ? reasons.join(", ")
        : "Content analysis complete",
      actionableItems,
    };
  }

  private calculateSuggestionImpact(
    suggestions: Array<{ expectedImpact: number; priority: number }>,
    _type: string
  ): { score: number; count: number } {
    if (suggestions.length === 0) {
      // Even with no suggestions, there might be room for improvement
      return { score: 0.2, count: 0 }; // Base potential
    }

    // Calculate weighted average impact (prioritize high-priority items)
    let totalWeight = 0;
    let weightedSum = 0;

    suggestions.forEach(s => {
      // Priority 1 = highest weight, Priority 5 = lowest
      const priorityWeight = (6 - s.priority) / 5;
      const impact = s.expectedImpact > 0 ? s.expectedImpact : 0.3; // Default if not set
      weightedSum += impact * priorityWeight;
      totalWeight += priorityWeight;
    });

    const avgImpact = totalWeight > 0 ? weightedSum / totalWeight : 0.3;

    // Scale based on number of suggestions (more suggestions = more potential)
    const countBonus = Math.min(suggestions.length * 0.05, 0.25);

    return {
      score: Math.min(avgImpact + countBonus, 1.0),
      count: suggestions.length,
    };
  }
}

/**
 * Thumbnail Optimization Strategy
 */
class ThumbnailOptimizationStrategy implements IScoringStrategy {
  private weight: number;

  constructor(weight: number = DEFAULT_WEIGHTS.thumbnailOptimization) {
    this.weight = weight;
  }

  calculate(input: ImprovementCalculatorInput): ImprovementFactor {
    const thumbnails = input.seoMetadata.thumbnailSuggestions;

    let score = 0;
    let actionableItems = 0;
    const reasons: string[] = [];

    if (!thumbnails || thumbnails.length === 0) {
      // Even without suggestions, thumbnail optimization is valuable
      score = 0.4;
      actionableItems = 1;
      reasons.push("thumbnail optimization available");
    } else {
      // We have thumbnail suggestions
      actionableItems = thumbnails.length;

      // Calculate based on predicted CTR
      const avgCTR = thumbnails.reduce((sum, t) => sum + t.predictedCTR, 0) / thumbnails.length;
      score = avgCTR;

      if (avgCTR > 0.5) {
        reasons.push(`high CTR potential (${Math.round(avgCTR * 100)}%)`);
      } else if (avgCTR > 0.3) {
        reasons.push(`moderate CTR potential (${Math.round(avgCTR * 100)}%)`);
      }

      // Bonus for multiple options
      if (thumbnails.length >= 3) {
        score += 0.15;
        reasons.push("multiple options provided");
      }

      // Check for text overlays
      const hasTextOverlay = thumbnails.some(t => t.textOverlay && t.textOverlay.length > 0);
      if (hasTextOverlay) {
        score += 0.1;
        reasons.push("text overlay suggestions");
      }
    }

    score = Math.min(score, 1.0);

    return {
      name: "Thumbnail Optimization",
      score,
      weight: this.weight,
      contribution: score * this.weight,
      description: reasons.length > 0
        ? reasons.join(", ")
        : "Thumbnail optimization potential",
      actionableItems,
    };
  }
}

/**
 * Retention Gap Strategy
 * Identifies room for retention improvement
 */
class RetentionGapStrategy implements IScoringStrategy {
  private weight: number;

  constructor(weight: number = DEFAULT_WEIGHTS.retentionGap) {
    this.weight = weight;
  }

  calculate(input: ImprovementCalculatorInput): ImprovementFactor {
    const { retentionAnalysis } = input;

    let score = 0;
    let actionableItems = 0;
    const reasons: string[] = [];

    // 1. Engagement gap (room for improvement)
    const engagementGap = 1 - retentionAnalysis.overallEngagementPrediction;
    score += engagementGap * 0.4;
    if (engagementGap > 0.3) {
      actionableItems++;
      reasons.push("engagement optimization opportunity");
    }

    // 2. Retention rate gap
    const retentionGap = 1 - retentionAnalysis.averageRetentionRate;
    score += retentionGap * 0.3;
    if (retentionGap > 0.3) {
      actionableItems++;
      reasons.push("retention improvement potential");
    }

    // 3. Content quality gaps
    const contentQuality = retentionAnalysis.contentQuality;
    const qualityGaps = [
      1 - contentQuality.pacing,
      1 - contentQuality.engagement,
      1 - contentQuality.structure,
    ];
    const avgQualityGap = qualityGaps.reduce((a, b) => a + b, 0) / qualityGaps.length;
    score += avgQualityGap * 0.2;
    if (avgQualityGap > 0.3) {
      actionableItems++;
      reasons.push("content quality enhancement");
    }

    // 4. Suspense/curiosity opportunities
    const hasSuspense = retentionAnalysis.suspenseMoments.length > 0;
    const hasCuriosity = retentionAnalysis.curiosityMoments.length > 0;
    
    if (!hasSuspense && !hasCuriosity) {
      score += 0.1;
      actionableItems++;
      reasons.push("add engagement hooks");
    } else if (retentionAnalysis.suspenseMoments.length < 3) {
      actionableItems++;
      reasons.push("increase suspense moments");
    }

    // Ensure minimum score if there's any gap
    if (engagementGap > 0.1 || retentionGap > 0.1) {
      score = Math.max(score, 0.25);
    }

    score = Math.min(score, 1.0);

    return {
      name: "Retention Potential",
      score,
      weight: this.weight,
      contribution: score * this.weight,
      description: reasons.length > 0
        ? reasons.join(", ")
        : "Retention analysis complete",
      actionableItems,
    };
  }
}

/**
 * Metadata Completeness Strategy
 */
class MetadataCompletenessStrategy implements IScoringStrategy {
  private weight: number;

  constructor(weight: number = DEFAULT_WEIGHTS.metadataCompleteness) {
    this.weight = weight;
  }

  calculate(input: ImprovementCalculatorInput): ImprovementFactor {
    const { seoMetadata, originalTitle, originalDescription, originalTags } = input;

    let score = 0;
    let actionableItems = 0;
    const reasons: string[] = [];

    // Check what we're adding/improving
    const improvements = {
      hasTitle: seoMetadata.title && seoMetadata.title.length > 10,
      hasDescription: seoMetadata.description && seoMetadata.description.length > 50,
      hasTags: seoMetadata.tags && seoMetadata.tags.length >= 5,
      hasKeywords: seoMetadata.keywords && seoMetadata.keywords.length > 0,
      hasChapters: seoMetadata.chapters && seoMetadata.chapters.length > 0,
      hasThumbnails: seoMetadata.thumbnailSuggestions && seoMetadata.thumbnailSuggestions.length > 0,
    };

    // Calculate completeness score
    const completenessScore = Object.values(improvements).filter(Boolean).length / 6;
    score = completenessScore * 0.5;

    // Calculate improvement delta from original
    const originalMissing = {
      title: !originalTitle || originalTitle.length < 10,
      description: !originalDescription || originalDescription.length < 50,
      tags: !originalTags || originalTags.length < 3,
    };

    const newlyProvided = Object.values(originalMissing).filter(Boolean).length;
    if (newlyProvided > 0) {
      score += (newlyProvided / 3) * 0.5;
      actionableItems += newlyProvided;
      reasons.push(`${newlyProvided} metadata elements optimized`);
    }

    // SEO score contribution
    if (seoMetadata.seoScore) {
      // If SEO score is low, there's room for improvement
      const seoGap = 1 - seoMetadata.seoScore;
      if (seoGap > 0.2) {
        score = Math.max(score, seoGap);
        reasons.push(`SEO optimization (${Math.round(seoGap * 100)}% potential)`);
      }
    }

    score = Math.min(score, 1.0);

    return {
      name: "Metadata Completeness",
      score,
      weight: this.weight,
      contribution: score * this.weight,
      description: reasons.length > 0
        ? reasons.join(", ")
        : "Metadata analysis complete",
      actionableItems,
    };
  }
}

// ============================================================================
// Main Calculator - Facade Pattern
// ============================================================================

/**
 * Improvement Potential Calculator
 * Orchestrates all scoring strategies and produces final improvement potential
 */
export class ImprovementCalculator {
  private strategies: IScoringStrategy[];

  constructor(weights?: Partial<WeightConfig>) {
    const finalWeights = { ...DEFAULT_WEIGHTS, ...weights };

    // Initialize all strategies
    this.strategies = [
      new TitleImprovementStrategy(finalWeights.seoTitle),
      new DescriptionImprovementStrategy(finalWeights.seoDescription),
      new TagsImprovementStrategy(finalWeights.seoTags),
      new ContentSuggestionsStrategy(finalWeights.contentSuggestions),
      new ThumbnailOptimizationStrategy(finalWeights.thumbnailOptimization),
      new RetentionGapStrategy(finalWeights.retentionGap),
      new MetadataCompletenessStrategy(finalWeights.metadataCompleteness),
    ];
  }

  /**
   * Calculate comprehensive improvement potential
   */
  public calculate(input: ImprovementCalculatorInput): ImprovementBreakdown {
    const startTime = Date.now();
    const factors: ImprovementFactor[] = [];

    // Execute all strategies
    for (const strategy of this.strategies) {
      try {
        const factor = strategy.calculate(input);
        factors.push(factor);
      } catch (error) {
        logger.warn("Strategy calculation failed", {
          error: error instanceof Error ? error.message : "Unknown",
        });
      }
    }

    // Calculate overall score
    const totalContribution = factors.reduce((sum, f) => sum + f.contribution, 0);
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const overall = totalWeight > 0 ? totalContribution / totalWeight : 0;

    // Apply scaling to make the score more actionable
    // Videos always have room for improvement, so ensure minimum potential
    const scaledOverall = this.applyScaling(overall, factors);

    // Generate top priorities
    const topPriorities = this.generateTopPriorities(factors);

    // Determine confidence level
    const confidenceLevel = this.determineConfidence(factors);

    // Calculate estimated boost (realistic range 5-35%)
    const estimatedBoostPercent = Math.round(scaledOverall * 35);

    const breakdown: ImprovementBreakdown = {
      overall: scaledOverall,
      factors,
      topPriorities,
      estimatedBoostPercent,
      confidenceLevel,
    };

    logger.debug("Improvement potential calculated", {
      overall: scaledOverall,
      estimatedBoost: estimatedBoostPercent,
      confidence: confidenceLevel,
      durationMs: Date.now() - startTime,
    });

    return breakdown;
  }

  /**
   * Apply scaling to ensure meaningful improvement potential
   */
  private applyScaling(raw: number, factors: ImprovementFactor[]): number {
    // Count actionable items across all factors
    const totalActionable = factors.reduce((sum, f) => sum + f.actionableItems, 0);

    // Base potential: if we have any suggestions, there's improvement potential
    let scaled = raw;

    // Minimum floor based on actionable items
    if (totalActionable > 0) {
      const floor = Math.min(0.15 + totalActionable * 0.03, 0.4);
      scaled = Math.max(scaled, floor);
    }

    // Apply sigmoid-like curve for more realistic distribution
    // This prevents clustering at extremes
    scaled = this.sigmoid(scaled);

    // Ensure we stay in 0-1 range
    return Math.max(0.05, Math.min(scaled, 0.95));
  }

  /**
   * Sigmoid-like transformation for better distribution
   */
  private sigmoid(x: number): number {
    // Modified sigmoid: maps 0-1 to roughly 0.1-0.9
    const k = 4; // Steepness
    const x0 = 0.5; // Midpoint
    return 0.1 + 0.8 / (1 + Math.exp(-k * (x - x0)));
  }

  /**
   * Generate top 3 priority actions
   */
  private generateTopPriorities(factors: ImprovementFactor[]): string[] {
    return factors
      .filter(f => f.actionableItems > 0)
      .sort((a, b) => {
        // Sort by contribution * actionable items for impact
        const impactA = a.contribution * (1 + a.actionableItems * 0.1);
        const impactB = b.contribution * (1 + b.actionableItems * 0.1);
        return impactB - impactA;
      })
      .slice(0, 3)
      .map(f => f.description);
  }

  /**
   * Determine confidence level based on data quality
   */
  private determineConfidence(factors: ImprovementFactor[]): "low" | "medium" | "high" {
    const avgScore = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;
    const hasAllFactors = factors.length >= 5;
    const totalActionable = factors.reduce((sum, f) => sum + f.actionableItems, 0);

    if (hasAllFactors && totalActionable > 5 && avgScore > 0.3) {
      return "high";
    } else if (totalActionable > 2 || avgScore > 0.2) {
      return "medium";
    }
    return "low";
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick calculation function for simple use cases
 */
export function calculateImprovementPotential(
  input: ImprovementCalculatorInput
): number {
  const calculator = new ImprovementCalculator();
  const breakdown = calculator.calculate(input);
  return breakdown.overall;
}

/**
 * Full breakdown calculation
 */
export function calculateImprovementBreakdown(
  input: ImprovementCalculatorInput
): ImprovementBreakdown {
  const calculator = new ImprovementCalculator();
  return calculator.calculate(input);
}

// Export singleton for common use
export const improvementCalculator = new ImprovementCalculator();
