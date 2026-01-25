/**
 * Video Copilot - AI Insights Service
 * Combines transcription, retention analysis, and content analysis
 * to generate comprehensive AI insights
 */

import { v4 as uuidv4 } from "uuid";
import {
  AIInsights,
  AppError,
  AppErrorType,
  ImprovementBreakdown,
  PacingSuggestion,
  ProgressCallback,
  RetentionAnalysis,
  ScriptSuggestion,
  SEOMetadata,
  ThumbnailSuggestion,
  TranscriptionResult,
  VisualRecommendation,
} from "../../types";
import { geminiService } from "../ai/gemini-service";
import { logger } from "../logger";
import { seoPromptBuilder } from "../seo/seo-prompt-builder";
import { 
  ImprovementCalculator, 
  ImprovementCalculatorInput 
} from "./improvement-calculator";

/**
 * AI Insights Service
 * Singleton service for generating comprehensive insights
 */
export class InsightsService {
  private static instance: InsightsService;

  private constructor() {
    logger.info("InsightsService initialized");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): InsightsService {
    if (!InsightsService.instance) {
      InsightsService.instance = new InsightsService();
    }
    return InsightsService.instance;
  }

  /**
   * Generate comprehensive AI insights
   * @param transcription - Video transcription result
   * @param retentionAnalysis - Retention analysis data
   * @param videoId - Unique video identifier
   * @param onProgress - Optional progress callback
   * @param keyframes - Optional keyframes for visual analysis
   * @param originalMetadata - Optional original video metadata for delta calculation
   */
  public async generateInsights(
    transcription: TranscriptionResult,
    retentionAnalysis: RetentionAnalysis,
    videoId: string,
    onProgress?: ProgressCallback,
    keyframes?: Array<{ timestamp: number; base64Data: string; mimeType: string }>,
    originalMetadata?: { title?: string; description?: string; tags?: string[] }
  ): Promise<AIInsights> {
    const startTime = Date.now();
    logger.info("Generating AI insights", { videoId });

    try {
      if (onProgress) {
        onProgress(0, "Analyzing content for insights...");
      }

      // Generate script suggestions
      if (onProgress) {
        onProgress(20, "Generating script suggestions...");
      }
      const scriptSuggestions = await this.generateScriptSuggestions(
        transcription,
        retentionAnalysis,
        keyframes
      );

      // Generate visual recommendations
      if (onProgress) {
        onProgress(40, "Generating visual recommendations...");
      }
      const visualRecommendations = await this.generateVisualRecommendations(
        transcription,
        retentionAnalysis,
        keyframes
      );

      // Generate pacing suggestions
      if (onProgress) {
        onProgress(60, "Generating pacing suggestions...");
      }
      const pacingSuggestions = await this.generatePacingSuggestions(
        transcription,
        retentionAnalysis,
        keyframes
      );

      // Generate SEO metadata
      if (onProgress) {
        onProgress(80, "Generating SEO metadata...");
      }
      const seoMetadata = await this.generateSEOMetadata(transcription, retentionAnalysis);

      // Calculate overall improvement potential using the new comprehensive calculator
      const improvementBreakdown = this.calculateComprehensiveImprovement(
        scriptSuggestions,
        visualRecommendations,
        pacingSuggestions,
        retentionAnalysis,
        seoMetadata,
        originalMetadata
      );
      const overallImprovementPotential = improvementBreakdown.overall;

      // Generate top 3 insights (combine AI insights with improvement priorities)
      const topInsights = this.generateTopInsights(
        scriptSuggestions,
        visualRecommendations,
        pacingSuggestions,
        retentionAnalysis,
        seoMetadata,
        improvementBreakdown
      );

      if (onProgress) {
        onProgress(100, "AI insights generated");
      }

      const processingDuration = (Date.now() - startTime) / 1000;
      logger.info("AI insights generated", {
        videoId,
        duration: processingDuration,
        scriptSuggestions: scriptSuggestions.length,
        visualRecommendations: visualRecommendations.length,
        pacingSuggestions: pacingSuggestions.length,
      });

      return {
        id: `insights-${videoId}`,
        videoId,
        scriptSuggestions,
        visualRecommendations,
        pacingSuggestions,
        seoMetadata,
        overallImprovementPotential,
        improvementBreakdown,
        topInsights,
        processingDuration,
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error("AI insights generation failed", {
        videoId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        AppErrorType.AI_INSIGHTS_FAILED,
        "Failed to generate AI insights",
        error as Error
      );
    }
  }

  /**
   * Generate script suggestions
   */
  private async generateScriptSuggestions(
    transcription: TranscriptionResult,
    _retentionAnalysis: RetentionAnalysis,
    keyframes?: Array<{ timestamp: number; base64Data: string; mimeType: string }>
  ): Promise<ScriptSuggestion[]> {
    try {
      // Use new category-based analyzer
      const result = await geminiService.analyzeCategory("scripting", {
        videoId: transcription.videoId,
        duration: transcription.segments[transcription.segments.length - 1]?.end || 0,
        transcription: transcription.text,
        keyframes, // Pass keyframes for visual context
      });

      // Convert issues to ScriptSuggestion format
      return result.issues
        .filter((issue) => issue.category === "scripting")
        .slice(0, 5)
        .map((issue, index: number) => ({
          type: "modify" as const,
          description: `${issue.title}: ${issue.recommendation}`,
          start: issue.timestamp.start,
          end: issue.timestamp.end,
          priority: Math.min(index + 1, 5),
          expectedImpact: issue.confidence * 0.6,
        }));
    } catch (error) {
      logger.error("Failed to generate script suggestions", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }

  /**
   * Generate visual recommendations
   */
  private async generateVisualRecommendations(
    transcription: TranscriptionResult,
    _retentionAnalysis: RetentionAnalysis,
    keyframes?: Array<{ timestamp: number; base64Data: string; mimeType: string }>
  ): Promise<VisualRecommendation[]> {
    try {
      // Use new category-based analyzer for visual editing
      const result = await geminiService.analyzeCategory("visual_editing", {
        videoId: transcription.videoId,
        duration: transcription.segments[transcription.segments.length - 1]?.end || 0,
        transcription: transcription.text,
        keyframes, // Pass keyframes for visual analysis - critical for this category
      });

      // Convert issues to VisualRecommendation format
      return result.issues
        .filter((issue) => issue.category === "visual_editing")
        .slice(0, 5)
        .map((issue, index: number) => ({
          type: "overlay" as const,
          description: `${issue.title}: ${issue.recommendation}`,
          start: issue.timestamp.start,
          end: issue.timestamp.end,
          priority: Math.min(index + 1, 5),
          expectedImpact: issue.confidence * 0.5,
        }));
    } catch (error) {
      logger.error("Failed to generate visual recommendations", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }

  /**
   * Generate pacing suggestions
   */
  private async generatePacingSuggestions(
    transcription: TranscriptionResult,
    _retentionAnalysis: RetentionAnalysis,
    keyframes?: Array<{ timestamp: number; base64Data: string; mimeType: string }>
  ): Promise<PacingSuggestion[]> {
    try {
      // Use new category-based analyzer for core concepts (pacing)
      const result = await geminiService.analyzeCategory("core_concepts", {
        videoId: transcription.videoId,
        duration: transcription.segments[transcription.segments.length - 1]?.end || 0,
        transcription: transcription.text,
        keyframes, // Pass keyframes for visual pacing analysis
      });

      // Convert issues to PacingSuggestion format
      return result.issues
        .filter((issue) => issue.category === "core_concepts")
        .slice(0, 5)
        .map((issue, index: number) => ({
          type: "keep" as const,
          description: `${issue.title}: ${issue.recommendation}`,
          start: issue.timestamp.start,
          end: issue.timestamp.end,
          priority: Math.min(index + 1, 5),
          expectedImpact: issue.confidence * 0.5,
        }));
    } catch (error) {
      logger.error("Failed to generate pacing suggestions", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }

  /**
   * Generate SEO metadata
   */
  private async generateSEOMetadata(
    transcription: TranscriptionResult,
    retentionAnalysis: RetentionAnalysis
  ): Promise<SEOMetadata> {
    try {
      // Extract key topics from transcription
      const topics = this.extractTopics(transcription.text);

      // Generate title using AI
      const title = await this.generateTitle(transcription, topics);

      // Generate description using AI
      const description = await this.generateAIDescription(
        transcription,
        retentionAnalysis,
        topics
      );

      // Generate tags
      const tags = this.generateTags(topics, transcription);

      // Generate thumbnail suggestions
      const thumbnailSuggestions = this.generateThumbnailSuggestions(
        transcription,
        retentionAnalysis
      );

      // Calculate SEO score
      const seoScore = this.calculateSEOScore(title, description, tags);

      return {
        title,
        description,
        tags,
        chapters: [], // Will be populated from timeline
        thumbnailSuggestions,
        seoScore,
        keywords: topics,
      };
    } catch (error) {
      logger.error("Failed to generate SEO metadata", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        title: "Video Title",
        description: "Video description",
        tags: [],
        chapters: [],
        thumbnailSuggestions: [],
        seoScore: 0.5,
        keywords: [],
      };
    }
  }

  /**
   * Extract key topics from text
   */
  private extractTopics(text: string): string[] {
    // Simple topic extraction based on word frequency
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 4);

    const frequency: Record<string, number> = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Generate SEO-optimized title using AI and Knowledge Base
   */
  private async generateTitle(
    transcription: TranscriptionResult,
    topics: string[]
  ): Promise<string> {
    try {
      const model = await geminiService.getModel();
      const duration = transcription.segments[transcription.segments.length - 1]?.end || 0;

      // Build prompt from knowledge base (single source of truth)
      const prompt = await seoPromptBuilder.buildTitlePrompt({
        topics,
        duration,
        contentPreview: transcription.text,
      });

      const result = await model.generateContent(prompt);
      let title = result.response?.text()?.trim() || "";

      // Get length constraints from knowledge base
      const constraints = await seoPromptBuilder.getTitleLengthConstraints();

      // Validate and adjust length based on KB constraints
      if (title.length > constraints.maximum) {
        title = title.substring(0, constraints.maximum - 3) + "...";
      } else if (title.length < 30) {
        const topic = topics[0] || "Tutorial";
        title = `${title} - ${topic}`;
      }

      logger.info("Generated AI title from knowledge base", {
        length: title.length,
        optimalRange: `${constraints.optimal.min}-${constraints.optimal.max}`,
      });

      return title || "Video Tutorial";
    } catch (error) {
      logger.error("Failed to generate AI title", {
        error: error instanceof Error ? error.message : "Unknown",
      });

      // Fallback to basic generation
      const firstSegment = transcription.segments[0];
      const firstWords = firstSegment?.text.split(" ").slice(0, 6).join(" ") || "";
      const topic = topics[0] || "Tutorial";
      const fallback = `${firstWords} - ${topic}`;

      return fallback.length > 70 ? fallback.substring(0, 67) + "..." : fallback;
    }
  }

  /**
   * Generate SEO-optimized description using AI and Knowledge Base
   */
  private async generateAIDescription(
    transcription: TranscriptionResult,
    retentionAnalysis: RetentionAnalysis,
    topics: string[]
  ): Promise<string> {
    try {
      const model = await geminiService.getModel();
      const duration = transcription.segments[transcription.segments.length - 1]?.end || 0;

      // Build prompt from knowledge base (single source of truth)
      const prompt = await seoPromptBuilder.buildDescriptionPrompt({
        topics,
        duration,
        engagementScore: retentionAnalysis.overallEngagementPrediction,
        contentPreview: transcription.text,
      });

      const result = await model.generateContent(prompt);
      let description = result.response?.text()?.trim() || "";

      // Get length constraints from knowledge base
      const constraints = await seoPromptBuilder.getDescriptionLengthConstraints();

      // Validate and adjust length based on KB constraints
      if (description.length > 300) {
        description = description.substring(0, 297) + "...";
      } else if (description.length < 100) {
        const engagement = Math.round(retentionAnalysis.overallEngagementPrediction * 100);
        description = `${description} This comprehensive guide covers everything you need to know. Expected engagement: ${engagement}%`;
      }

      logger.info("Generated AI description from knowledge base", {
        length: description.length,
        aboveFoldLimit: constraints.aboveFold,
      });

      return description || "Learn key concepts and best practices in this comprehensive guide.";
    } catch (error) {
      logger.error("Failed to generate AI description", {
        error: error instanceof Error ? error.message : "Unknown",
      });

      // Fallback to basic generation
      const summary = transcription.text.substring(0, 200);
      const engagement = Math.round(retentionAnalysis.overallEngagementPrediction * 100);
      return `In this video, ${summary}. Learn key concepts and best practices. Expected engagement: ${engagement}%`;
    }
  }

  /**
   * Generate SEO tags
   */
  private generateTags(topics: string[], transcription: TranscriptionResult): string[] {
    const tags = [...topics];
    tags.push("tutorial", "guide", "how-to", "demo");

    // Add language-specific tags
    if (transcription.language.startsWith("en")) {
      tags.push("english");
    }

    return [...new Set(tags)].slice(0, 15);
  }

  /**
   * Generate thumbnail suggestions
   */
  private generateThumbnailSuggestions(
    _transcription: TranscriptionResult,
    retentionAnalysis: RetentionAnalysis
  ): ThumbnailSuggestion[] {
    const suggestions: ThumbnailSuggestion[] = [];

    // Generate suggestions at key moments
    const keyMoments = retentionAnalysis.suspenseMoments.slice(0, 3);

    keyMoments.forEach((moment, index) => {
      suggestions.push({
        id: uuidv4(),
        timestamp: moment.start,
        imageData: "", // Would be generated from video frames
        textOverlay: `Key Moment ${index + 1}`,
        predictedCTR: 0.3 + Math.random() * 0.4,
        description: moment.description,
      });
    });

    return suggestions;
  }

  /**
   * Calculate SEO score
   */
  private calculateSEOScore(title: string, description: string, tags: string[]): number {
    let score = 0;

    // Title length (optimal: 50-60 characters)
    if (title.length >= 50 && title.length <= 60) {
      score += 0.3;
    } else if (title.length >= 40 && title.length <= 70) {
      score += 0.2;
    }

    // Description length (optimal: 150-300 characters)
    if (description.length >= 150 && description.length <= 300) {
      score += 0.3;
    } else if (description.length >= 100 && description.length <= 400) {
      score += 0.2;
    }

    // Tags count (optimal: 10-15)
    if (tags.length >= 10 && tags.length <= 15) {
      score += 0.2;
    } else if (tags.length >= 5 && tags.length <= 20) {
      score += 0.1;
    }

    // Keywords in title and description
    const keywords = tags.slice(0, 5);
    const titleHasKeywords = keywords.some((keyword) =>
      title.toLowerCase().includes(keyword.toLowerCase())
    );
    const descriptionHasKeywords = keywords.some((keyword) =>
      description.toLowerCase().includes(keyword.toLowerCase())
    );

    if (titleHasKeywords) {
      score += 0.1;
    }
    if (descriptionHasKeywords) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate comprehensive improvement potential using modular calculator
   * Factors in: SEO (title, description, tags), content suggestions, 
   * thumbnails, retention gaps, metadata completeness
   */
  private calculateComprehensiveImprovement(
    scriptSuggestions: ScriptSuggestion[],
    visualRecommendations: VisualRecommendation[],
    pacingSuggestions: PacingSuggestion[],
    retentionAnalysis: RetentionAnalysis,
    seoMetadata: SEOMetadata,
    originalMetadata?: { title?: string; description?: string; tags?: string[] }
  ): ImprovementBreakdown {
    const calculator = new ImprovementCalculator();

    // Build input for the calculator with original metadata for delta calculation
    const input: ImprovementCalculatorInput = {
      scriptSuggestions,
      visualRecommendations,
      pacingSuggestions,
      retentionAnalysis,
      seoMetadata,
      // Include original metadata for accurate delta calculation
      originalTitle: originalMetadata?.title,
      originalDescription: originalMetadata?.description,
      originalTags: originalMetadata?.tags,
    };

    const breakdown = calculator.calculate(input);

    logger.debug("Comprehensive improvement potential calculated", {
      overall: breakdown.overall,
      estimatedBoost: breakdown.estimatedBoostPercent,
      confidence: breakdown.confidenceLevel,
      factorCount: breakdown.factors.length,
      topPriorities: breakdown.topPriorities,
      hasOriginalMetadata: !!originalMetadata,
    });

    return breakdown;
  }

  /**
   * Generate top 3 insights prioritizing high-impact actionable items
   * Uses improvement breakdown for more accurate prioritization
   */
  private generateTopInsights(
    scriptSuggestions: ScriptSuggestion[],
    visualRecommendations: VisualRecommendation[],
    _pacingSuggestions: PacingSuggestion[],
    retentionAnalysis: RetentionAnalysis,
    seoMetadata: SEOMetadata,
    improvementBreakdown?: ImprovementBreakdown
  ): string[] {
    const insights: string[] = [];

    // First, add top priorities from the improvement breakdown (most accurate)
    if (improvementBreakdown && improvementBreakdown.topPriorities.length > 0) {
      // Add the top priority as the first insight
      const topPriority = improvementBreakdown.topPriorities[0];
      if (topPriority) {
        insights.push(`🎯 ${topPriority}`);
      }
    }

    // Add SEO improvement insight if we're providing new title/description
    const titleImprovement = improvementBreakdown?.factors.find(f => f.name === "Title Optimization");
    const descImprovement = improvementBreakdown?.factors.find(f => f.name === "Description Optimization");
    
    if (titleImprovement && titleImprovement.actionableItems > 0) {
      insights.push(
        `📝 New optimized title ready: "${seoMetadata.title.substring(0, 50)}${seoMetadata.title.length > 50 ? "..." : ""}"`
      );
    }

    if (descImprovement && descImprovement.actionableItems > 0 && insights.length < 3) {
      insights.push(
        `✍️ Enhanced description with keywords and CTAs (+${Math.round(descImprovement.contribution * 100)}% boost)`
      );
    }

    // Add content suggestions if available
    if (scriptSuggestions.length > 0 && scriptSuggestions[0] && insights.length < 3) {
      const topScript = scriptSuggestions[0];
      insights.push(`📖 ${topScript.description} (+${Math.round(topScript.expectedImpact * 100)}% impact)`);
    }

    if (visualRecommendations.length > 0 && visualRecommendations[0] && insights.length < 3) {
      const topVisual = visualRecommendations[0];
      insights.push(`🎬 ${topVisual.description}`);
    }

    // Add tag improvement insight
    const tagsImprovement = improvementBreakdown?.factors.find(f => f.name === "Tags & Keywords");
    if (tagsImprovement && tagsImprovement.actionableItems > 0 && insights.length < 3) {
      insights.push(
        `🏷️ ${seoMetadata.tags.length} optimized tags for better discoverability`
      );
    }

    // Add thumbnail insight if available
    if (seoMetadata.thumbnailSuggestions.length > 0 && insights.length < 3) {
      const avgCTR = seoMetadata.thumbnailSuggestions.reduce((sum, t) => sum + t.predictedCTR, 0) 
        / seoMetadata.thumbnailSuggestions.length;
      insights.push(
        `🖼️ Thumbnail suggestions with ${Math.round(avgCTR * 100)}% predicted CTR`
      );
    }

    // Add retention insight as fallback
    if (insights.length < 3 && retentionAnalysis.keyInsights.length > 0 && retentionAnalysis.keyInsights[0]) {
      insights.push(`📊 ${retentionAnalysis.keyInsights[0]}`);
    }

    // Ensure we have at least one insight
    if (insights.length === 0) {
      const overall = improvementBreakdown?.estimatedBoostPercent || 15;
      insights.push(
        `🚀 Potential ${overall}% improvement with our SEO and content recommendations`
      );
    }

    return insights.slice(0, 3);
  }
}

// Export singleton instance
export const insightsService = InsightsService.getInstance();
