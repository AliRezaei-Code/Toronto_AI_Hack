/**
 * Video Copilot - Retention Analysis Service
 * Analyzes video retention patterns based on transcription and content
 */

import {
  ContentQuality,
  CuriosityMoment,
  EmotionalTone,
  RetentionAnalysis,
  RetentionScore,
  SuspenseMoment,
  TranscriptionResult,
  VisualScene,
} from "../../types";
import { clientLogger } from "../client-logger";

/**
 * Retention Analysis Service
 * Analyzes video engagement and retention patterns
 */
export class RetentionService {
  private static instance: RetentionService;

  private constructor() {
    clientLogger.info("RetentionService initialized");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RetentionService {
    if (!RetentionService.instance) {
      RetentionService.instance = new RetentionService();
    }
    return RetentionService.instance;
  }

  /**
   * Analyze retention based on transcription
   */
  public async analyze(transcription: TranscriptionResult): Promise<RetentionAnalysis> {
    const startTime = Date.now();
    clientLogger.info("Starting retention analysis", { videoId: transcription.videoId });

    try {
      const duration = this.getVideoDuration(transcription);

      // Generate suspense moments
      const suspenseMoments = this.generateSuspenseMoments(transcription);

      // Generate curiosity moments
      const curiosityMoments = this.generateCuriosityMoments(transcription);

      // Generate retention scores
      const retentionScores = this.generateRetentionScores(transcription, duration);

      // Generate emotional tones
      const emotionalTones = this.generateEmotionalTones(transcription);

      // Generate visual scenes (placeholder for now)
      const visualScenes = this.generateVisualScenes(transcription);

      // Analyze content quality
      const contentQuality = this.analyzeContentQuality(transcription);

      // Calculate overall metrics
      const overallEngagementPrediction = this.calculateOverallEngagement(retentionScores);
      const averageRetentionRate = this.calculateAverageRetention(retentionScores);

      // Generate key insights
      const keyInsights = this.generateKeyInsights(
        suspenseMoments,
        curiosityMoments,
        retentionScores,
        contentQuality
      );

      const processingDuration = (Date.now() - startTime) / 1000;
      clientLogger.info("Retention analysis completed", {
        videoId: transcription.videoId,
        duration: processingDuration,
        suspenseMoments: suspenseMoments.length,
        curiosityMoments: curiosityMoments.length,
      });

      return {
        id: `retention-${transcription.videoId}`,
        videoId: transcription.videoId,
        suspenseMoments,
        curiosityMoments,
        retentionScores,
        emotionalTones,
        visualScenes,
        contentQuality,
        overallEngagementPrediction,
        averageRetentionRate,
        keyInsights,
        processingDuration,
        createdAt: new Date(),
      };
    } catch (error) {
      clientLogger.error("Retention analysis failed", {
        videoId: transcription.videoId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }

  /**
   * Get video duration from transcription
   */
  private getVideoDuration(transcription: TranscriptionResult): number {
    const lastSegment = transcription.segments[transcription.segments.length - 1];
    if (!lastSegment) {
      return 0;
    }
    return lastSegment.end;
  }

  /**
   * Generate suspense moments from transcription
   */
  private generateSuspenseMoments(transcription: TranscriptionResult): SuspenseMoment[] {
    const suspenseMoments: SuspenseMoment[] = [];
    const suspenseKeywords = [
      "wait",
      "hold on",
      "stay tuned",
      "don't go anywhere",
      "coming up",
      "in a moment",
      "here's the thing",
      "you won't believe",
      "surprise",
      "unexpected",
      "suddenly",
      "revealed",
      "secret",
      "mystery",
      "discover",
      "unexpectedly",
      "finally",
    ];

    for (const segment of transcription.segments) {
      const text = segment.text.toLowerCase();

      for (const keyword of suspenseKeywords) {
        if (text.includes(keyword)) {
          suspenseMoments.push({
            start: segment.start,
            end: segment.end,
            intensity: 0.7 + Math.random() * 0.3, // 0.7-1.0
            type: "content",
            description: `Suspense created by "${keyword}"`,
            confidence: segment.confidence,
          });
          break;
        }
      }
    }

    return suspenseMoments;
  }

  /**
   * Generate curiosity moments from transcription
   */
  private generateCuriosityMoments(transcription: TranscriptionResult): CuriosityMoment[] {
    const curiosityMoments: CuriosityMoment[] = [];
    const curiosityKeywords = [
      "why",
      "how",
      "what if",
      "have you ever",
      "did you know",
      "imagine",
      "what would happen",
      "here's a question",
      "you might wonder",
      "the secret is",
      "the truth about",
      "here's what",
      "did you realize",
      "you may not know",
    ];

    for (const segment of transcription.segments) {
      const text = segment.text.toLowerCase();

      for (const keyword of curiosityKeywords) {
        if (text.includes(keyword)) {
          curiosityMoments.push({
            start: segment.start,
            end: segment.end,
            score: 0.6 + Math.random() * 0.4, // 0.6-1.0
            trigger: keyword,
            description: `Curiosity triggered by "${keyword}"`,
            confidence: segment.confidence,
          });
          break;
        }
      }
    }

    return curiosityMoments;
  }

  /**
   * Generate retention scores across timeline
   */
  private generateRetentionScores(
    transcription: TranscriptionResult,
    duration: number
  ): RetentionScore[] {
    const retentionScores: RetentionScore[] = [];
    const interval = Math.min(duration / 10, 30); // 10 segments max, 30 seconds min

    for (let time = 0; time < duration; time += interval) {
      const end = Math.min(time + interval, duration);

      // Calculate retention based on speech activity
      const hasSpeech = transcription.segments.some((seg) => seg.start < end && seg.end > time);

      const retentionRate = hasSpeech ? 0.7 + Math.random() * 0.2 : 0.4 + Math.random() * 0.2;
      const engagementScore = retentionRate * (0.9 + Math.random() * 0.1);
      const dropOffRisk = 1 - retentionRate * 0.8;

      retentionScores.push({
        start: time,
        end,
        retentionRate,
        engagementScore,
        dropOffRisk,
      });
    }

    return retentionScores;
  }

  /**
   * Generate emotional tones from transcription
   */
  private generateEmotionalTones(transcription: TranscriptionResult): EmotionalTone[] {
    const emotionalTones: EmotionalTone[] = [];
    const emotionKeywords = {
      exciting: ["exciting", "amazing", "incredible", "awesome", "fantastic"],
      informative: ["learn", "understand", "know", "information", "important"],
      entertaining: ["fun", "interesting", "cool", "enjoy", "love"],
      serious: ["serious", "important", "critical", "essential", "must"],
    };

    for (const segment of transcription.segments) {
      const text = segment.text.toLowerCase();
      let primaryEmotion = "neutral";
      let secondaryEmotion: string | undefined;
      let maxMatches = 0;

      for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        const matches = keywords.filter((keyword) => text.includes(keyword)).length;
        if (matches > maxMatches) {
          secondaryEmotion = primaryEmotion;
          primaryEmotion = emotion;
          maxMatches = matches;
        } else if (matches > 0 && matches === maxMatches) {
          secondaryEmotion = emotion;
        }
      }

      emotionalTones.push({
        primary: primaryEmotion,
        secondary: secondaryEmotion,
        confidence: segment.confidence,
        start: segment.start,
        end: segment.end,
      });
    }

    return emotionalTones;
  }

  /**
   * Generate visual scenes (placeholder implementation)
   */
  private generateVisualScenes(transcription: TranscriptionResult): VisualScene[] {
    // Since we don't have visual analysis yet, create placeholder scenes based on duration
    const duration = this.getVideoDuration(transcription);
    const sceneDuration = Math.max(duration / 5, 30); // 5 scenes max, 30 seconds min
    const visualScenes: VisualScene[] = [];

    for (let i = 0; i < Math.floor(duration / sceneDuration); i++) {
      visualScenes.push({
        start: i * sceneDuration,
        end: Math.min((i + 1) * sceneDuration, duration),
        type: "talking-head", // Default type
        actionIntensity: 0.5 + Math.random() * 0.3,
        visualComplexity: 0.4 + Math.random() * 0.4,
        description: "Visual scene analysis requires video frames",
      });
    }

    return visualScenes;
  }

  /**
   * Analyze content quality
   */
  private analyzeContentQuality(transcription: TranscriptionResult): ContentQuality {
    const avgConfidence =
      transcription.segments.reduce((sum, seg) => sum + seg.confidence, 0) /
      Math.max(transcription.segments.length, 1);

    return {
      overallScore: avgConfidence,
      clarity: Math.min(avgConfidence * 1.1, 1),
      engagement: Math.min(avgConfidence * 0.9, 1),
      structure: 0.7 + Math.random() * 0.2,
      pacing: 0.6 + Math.random() * 0.3,
      visualQuality: 0.7 + Math.random() * 0.2,
      audioQuality: avgConfidence,
    };
  }

  /**
   * Calculate overall engagement prediction
   */
  private calculateOverallEngagement(retentionScores: RetentionScore[]): number {
    if (retentionScores.length === 0) {
      return 0;
    }
    const avgEngagement =
      retentionScores.reduce((sum, score) => sum + score.engagementScore, 0) /
      retentionScores.length;
    return avgEngagement;
  }

  /**
   * Calculate average retention rate
   */
  private calculateAverageRetention(retentionScores: RetentionScore[]): number {
    if (retentionScores.length === 0) {
      return 0;
    }
    const avgRetention =
      retentionScores.reduce((sum, score) => sum + score.retentionRate, 0) / retentionScores.length;
    return avgRetention;
  }

  /**
   * Generate key insights
   */
  private generateKeyInsights(
    suspenseMoments: SuspenseMoment[],
    curiosityMoments: CuriosityMoment[],
    retentionScores: RetentionScore[],
    contentQuality: ContentQuality
  ): string[] {
    const insights: string[] = [];

    // Add suspense insight
    if (suspenseMoments.length > 0) {
      insights.push(
        `Video contains ${suspenseMoments.length} suspense moments that help maintain viewer attention`
      );
    }

    // Add curiosity insight
    if (curiosityMoments.length > 0) {
      insights.push(`${curiosityMoments.length} curiosity triggers identified to engage viewers`);
    }

    // Add retention insight
    const avgRetention = this.calculateAverageRetention(retentionScores);
    insights.push(`Average predicted retention rate: ${(avgRetention * 100).toFixed(0)}%`);

    // Add quality insight
    insights.push(
      `Overall content quality score: ${(contentQuality.overallScore * 100).toFixed(0)}%`
    );

    return insights.slice(0, 5); // Max 5 insights
  }
}

// Export singleton instance
export const retentionService = RetentionService.getInstance();
