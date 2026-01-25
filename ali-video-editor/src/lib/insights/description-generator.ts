/**
 * Video Copilot - YouTube Description Generator
 * Generates SEO-optimized YouTube descriptions using AI
 */

import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { AppError, AppErrorType } from "../../types";
import {
  DescriptionGenerationRequest,
  DescriptionGenerationResult,
  DescriptionLength,
  DescriptionTone,
  GeneratedDescription,
} from "../../types/description";
import { geminiService } from "../ai/gemini-service";
import { logger } from "../logger";
import { seoPromptBuilder } from "../seo/seo-prompt-builder";

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

/**
 * Zod schema for description generation options
 */
export const DescriptionOptionsSchema = z.object({
  length: z.enum(["short", "medium", "long"]),
  tone: z.enum(["professional", "casual", "engaging", "custom"]),
  customTone: z.string().optional(),
  includeHashtags: z.boolean(),
  customKeywords: z.array(z.string()).optional(),
  includeChapters: z.boolean(),
  channelName: z.string().optional(),
  socialLinks: z
    .object({
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      tiktok: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
});

/**
 * Zod schema for description generation request
 */
export const DescriptionGenerationRequestSchema = z.object({
  videoId: z.string().min(1),
  transcription: z.string().min(10),
  title: z.string().optional(),
  chapters: z
    .array(
      z.object({
        title: z.string(),
        start: z.number(),
        end: z.number(),
      })
    )
    .optional(),
  options: DescriptionOptionsSchema,
});

// ============================================================================
// Description Generator Service
// ============================================================================

/**
 * YouTube Description Generator Service
 * Handles generation of SEO-optimized YouTube descriptions
 */
export class DescriptionGeneratorService {
  private static instance: DescriptionGeneratorService;

  private constructor() {
    logger.info("DescriptionGeneratorService initialized");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DescriptionGeneratorService {
    if (!DescriptionGeneratorService.instance) {
      DescriptionGeneratorService.instance = new DescriptionGeneratorService();
    }
    return DescriptionGeneratorService.instance;
  }

  /**
   * Generate YouTube-optimized description
   */
  public async generateDescription(
    request: DescriptionGenerationRequest
  ): Promise<DescriptionGenerationResult> {
    const startTime = Date.now();
    logger.info("Generating YouTube description", { videoId: request.videoId });

    try {
      // Validate request
      const validatedRequest = DescriptionGenerationRequestSchema.parse(request);

      // Generate description
      const description = await this.createDescription(validatedRequest);

      const processingTime = (Date.now() - startTime) / 1000;
      logger.info("YouTube description generated successfully", {
        videoId: request.videoId,
        wordCount: description.wordCount,
        seoScore: description.seoScore,
        processingTime,
      });

      return {
        description,
        processingTime,
        success: true,
      };
    } catch (error) {
      const processingTime = (Date.now() - startTime) / 1000;
      logger.error("YouTube description generation failed", {
        videoId: request.videoId,
        error: error instanceof Error ? error.message : "Unknown error",
        processingTime,
      });

      if (error instanceof z.ZodError) {
        throw new AppError(AppErrorType.API_KEY_INVALID, "Invalid request parameters", error);
      }

      throw new AppError(
        AppErrorType.AI_INSIGHTS_FAILED,
        "Failed to generate YouTube description",
        error as Error
      );
    }
  }

  /**
   * Create complete YouTube-optimized description
   */
  private async createDescription(
    request: z.infer<typeof DescriptionGenerationRequestSchema>
  ): Promise<GeneratedDescription> {
    const { videoId, transcription, title, chapters, options } = request;

    // Generate above-the-fold snippet
    const aboveFoldSnippet = await this.generateAboveFoldSnippet(
      transcription,
      title,
      options.tone,
      options.customTone
    );

    // Generate mini-blog content
    const miniBlogContent = await this.generateMiniBlogContent(
      transcription,
      title,
      options.length,
      options.tone,
      options.customKeywords,
      options.customTone
    );

    // Build sections based on options
    let timestampsSection: string | undefined;
    if (options.includeChapters && chapters && chapters.length > 0) {
      timestampsSection = this.generateTimestampsSection(chapters);
    }

    // Generate hashtags based on content
    const hashtags = this.generateHashtags(transcription, title, options.customKeywords);
    const hashtagsSection = options.includeHashtags
      ? this.generateHashtagsSection(hashtags)
      : undefined;

    // Generate social section
    const socialSection = options.socialLinks
      ? this.generateSocialSection(options.channelName, options.socialLinks)
      : undefined;

    // Combine all sections
    const fullDescription = this.combineSections({
      aboveFoldSnippet,
      miniBlogContent,
      timestampsSection,
      socialSection,
      hashtagsSection,
    });

    // Calculate SEO score
    const seoScore = this.calculateSEOScore(aboveFoldSnippet, miniBlogContent, hashtags);

    // Count words and characters
    const wordCount = this.countWords(fullDescription);
    const characterCount = fullDescription.length;

    return {
      id: uuidv4(),
      videoId,
      aboveFoldSnippet,
      miniBlogContent,
      timestampsSection,
      socialSection,
      hashtagsSection,
      fullDescription,
      hashtags,
      seoScore,
      wordCount,
      characterCount,
      createdAt: new Date(),
    };
  }

  /**
   * Generate above-the-fold snippet (first 150 characters) using KB
   */
  private async generateAboveFoldSnippet(
    transcription: string,
    title: string | undefined,
    tone: DescriptionTone,
    customTone?: string
  ): Promise<string> {
    try {
      // Get KB data for SEO principles
      const kbData = await seoPromptBuilder.getKBData();
      const constraints = await seoPromptBuilder.getDescriptionLengthConstraints();
      
      // Extract key topics from transcription
      const topics = this.extractKeywords(transcription, 3);

      // Build tone instruction
      const toneInstruction = this.buildToneInstruction(tone, customTone);

      // Build KB-driven prompt
      const prompt = `
Generate a compelling YouTube description snippet for a video.

Video title: ${title || "Untitled"}
Key topics: ${topics.join(", ")}

## Requirements (from Knowledge Base)
${kbData.corePrinciples.description.map(p => `- ${p}`).join("\n")}

## Character Limit
- Maximum: ${constraints.aboveFold} characters (CRITICAL - this is visible in search results)
- This is the "above-the-fold" snippet that appears before "Show More"

## Tone Guidelines
${toneInstruction}

## Guidelines
- Immediately state the video's value proposition
- Include main keyword naturally in opening
- Avoid generic phrases like "Welcome to my channel" or "In this video"
- Focus on what the viewer will learn or achieve
- Write as a preview/hook, not an introduction

Return ONLY the snippet text, no quotes or extra formatting.
      `.trim();

      // Use Gemini to generate snippet
      const model = await geminiService.getModel();
      const result = await model.generateContent(prompt);
      const response = result.response?.text() || "";

      // Clean and validate snippet using KB constraints
      let snippet = response.trim();
      if (snippet.length > constraints.aboveFold) {
        snippet = snippet.substring(0, constraints.aboveFold - 3) + "...";
      }

      logger.info("Generated above-fold snippet from KB", {
        length: snippet.length,
        limit: constraints.aboveFold,
      });

      return snippet || "Learn key concepts and best practices in this comprehensive guide.";
    } catch (error) {
      logger.error("Failed to generate above-fold snippet", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Fallback to simple extraction
      const firstSentence = transcription.split(/[.!?]/)[0]?.substring(0, 140).trim() || "";
      return `${firstSentence}...`;
    }
  }

  /**
   * Generate mini-blog content (200-300 words) using KB
   */
  private async generateMiniBlogContent(
    transcription: string,
    title: string | undefined,
    length: DescriptionLength,
    tone: DescriptionTone,
    customKeywords: string[] = [],
    customTone?: string
  ): Promise<string> {
    try {
      // Get KB data for SEO principles
      const kbData = await seoPromptBuilder.getKBData();
      const constraints = await seoPromptBuilder.getDescriptionLengthConstraints();
      
      // Determine target word count based on length preference
      const wordCountMap: Record<DescriptionLength, number> = {
        short: constraints.miniBlog.min,  // Use KB minimum
        medium: Math.round((constraints.miniBlog.min + constraints.miniBlog.max) / 2),
        long: constraints.miniBlog.max,   // Use KB maximum
      };
      const targetWordCount: number = wordCountMap[length as DescriptionLength];

      // Extract key topics
      const topics = this.extractKeywords(transcription, 5);
      const allKeywords = [...new Set([...topics, ...customKeywords])];

      // Build KB-driven prompt
      const prompt = `
Generate a comprehensive YouTube description mini-blog (${targetWordCount} words).

Video title: ${title || "Untitled"}
Key topics: ${allKeywords.join(", ")}
Tone: ${tone}

## Requirements (from Knowledge Base)
${kbData.corePrinciples.description.map(p => `- ${p}`).join("\n")}

## Content Goals
- Target length: ${targetWordCount} words (within 10%)
- Optimal range: ${constraints.miniBlog.min}-${constraints.miniBlog.max} words for SEO
- Write as standalone descriptive content piece for indexing
- Include main keywords naturally throughout text
- Include keyword variations not in the title
- Write for both human readers and search crawlers
- Expand on value proposition and outcomes

## Tone Guidelines
${this.buildToneInstruction(tone, customTone)}

Return ONLY the mini-blog content, no quotes or extra formatting.
      `.trim();

      // Use Gemini to generate content
      const model = await geminiService.getModel();
      const result = await model.generateContent(prompt);
      const response = result.response?.text() || "";

      // Validate and adjust word count
      let content = response.trim();
      const actualWordCount = this.countWords(content);

      if (actualWordCount < targetWordCount * 0.9) {
        logger.warn("Generated content is shorter than target", {
          target: targetWordCount,
          actual: actualWordCount,
        });
      } else if (actualWordCount > targetWordCount * 1.1) {
        // Truncate if too long
        const words = content.split(/\s+/).slice(0, targetWordCount);
        content = words.join(" ");
      }

      logger.info("Generated mini-blog content from KB", {
        wordCount: this.countWords(content),
        targetWordCount,
        kbRange: `${constraints.miniBlog.min}-${constraints.miniBlog.max}`,
      });

      return (
        content ||
        "This video covers essential concepts and practical techniques you can apply immediately."
      );
    } catch (error) {
      logger.error("Failed to generate mini-blog content", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Fallback to transcription summary
      return transcription.substring(0, 1500).trim();
    }
  }

  /**
   * Generate timestamps/chapters section
   */
  private generateTimestampsSection(
    chapters: Array<{ title: string; start: number; end: number }>
  ): string {
    const lines = chapters.map((chapter) => {
      const timestamp = this.formatTimestamp(chapter.start);
      return `${timestamp} ${chapter.title}`;
    });

    return `⏰ TIMESTAMPS:
${lines.join("\n")}`;
  }

  /**
   * Build tone instruction string based on selected tone
   * Supports preset tones and custom user-defined tones
   */
  private buildToneInstruction(tone: DescriptionTone, customTone?: string): string {
    const lines: string[] = [`- Selected tone: ${tone}`];

    switch (tone) {
      case "professional":
        lines.push("- Use professional, authoritative language with credibility signals");
        lines.push("- Emphasize expertise and trustworthiness");
        break;
      case "casual":
        lines.push("- Use friendly, approachable language that feels conversational");
        lines.push("- Write as if talking to a friend");
        break;
      case "engaging":
        lines.push("- Use energetic, compelling language with call-to-action elements");
        lines.push("- Create excitement and urgency");
        break;
      case "custom":
        if (customTone && customTone.trim()) {
          lines.push(`- Custom tone guidance: ${customTone.trim()}`);
          lines.push("- Apply this tone consistently throughout the content");
        } else {
          lines.push("- Use a balanced, neutral tone");
        }
        break;
    }

    return lines.join("\n");
  }

  /**
   * Generate hashtags section
   */
  private generateHashtagsSection(hashtags: string[]): string {
    return `

# ${hashtags.join(" #")}`;
  }

  /**
   * Generate social media section
   */
  private generateSocialSection(
    channelName: string | undefined,
    socialLinks: {
      twitter?: string;
      instagram?: string;
      tiktok?: string;
      website?: string;
    }
  ): string {
    const lines: string[] = [];

    if (channelName) {
      lines.push(`📺 Subscribe to ${channelName}`);
    }

    if (socialLinks.website) {
      lines.push(`🌐 ${socialLinks.website}`);
    }

    if (socialLinks.twitter || socialLinks.instagram || socialLinks.tiktok) {
      const socials: string[] = [];
      if (socialLinks.twitter) {
        socials.push(`Twitter: ${socialLinks.twitter}`);
      }
      if (socialLinks.instagram) {
        socials.push(`Instagram: ${socialLinks.instagram}`);
      }
      if (socialLinks.tiktok) {
        socials.push(`TikTok: ${socialLinks.tiktok}`);
      }
      lines.push(socials.join(" | "));
    }

    if (lines.length > 0) {
      return `\n\n${lines.join("\n")}`;
    }

    return "";
  }

  /**
   * Combine all sections into full description
   */
  private combineSections(sections: {
    aboveFoldSnippet: string;
    miniBlogContent: string;
    timestampsSection?: string;
    socialSection?: string;
    hashtagsSection?: string;
  }): string {
    const parts = [sections.aboveFoldSnippet, "", sections.miniBlogContent];

    if (sections.timestampsSection) {
      parts.push("", sections.timestampsSection);
    }

    if (sections.socialSection) {
      parts.push(sections.socialSection);
    }

    if (sections.hashtagsSection) {
      parts.push(sections.hashtagsSection);
    }

    return parts.join("\n");
  }

  /**
   * Generate hashtags from content
   */
  private generateHashtags(
    transcription: string,
    _title: string | undefined,
    customKeywords: string[] = []
  ): string[] {
    const keywords = this.extractKeywords(transcription, 5);
    const allKeywords = [...new Set([...keywords, ...customKeywords])];

    // Convert to hashtags (capitalize first letter)
    const hashtags = allKeywords.slice(0, 5).map((keyword) =>
      keyword
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("")
    );

    return hashtags;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string, count: number): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 4);

    // Filter out common words
    const stopWords = new Set([
      "this",
      "that",
      "with",
      "from",
      "have",
      "been",
      "were",
      "when",
      "what",
      "just",
      "like",
      "more",
      "will",
      "your",
      "they",
      "their",
      "there",
      "would",
      "could",
      "should",
      "about",
      "which",
      "these",
      "those",
      "being",
      "doing",
      "going",
      "getting",
      "really",
      "something",
    ]);

    const filteredWords = words.filter((word) => !stopWords.has(word));

    // Count frequency
    const frequency: Record<string, number> = {};
    filteredWords.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Sort by frequency and return top N
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word]) => word);
  }

  /**
   * Format timestamp as MM:SS or HH:MM:SS
   */
  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Calculate SEO score for the description
   */
  private calculateSEOScore(
    aboveFoldSnippet: string,
    miniBlogContent: string,
    hashtags: string[]
  ): number {
    let score = 0;

    // Above-the-fold snippet length (should be close to 150)
    const snippetLength = aboveFoldSnippet.length;
    if (snippetLength >= 140 && snippetLength <= 150) {
      score += 0.3;
    } else if (snippetLength >= 120 && snippetLength <= 160) {
      score += 0.2;
    }

    // Mini-blog word count (optimal: 200-300 words)
    const wordCount = this.countWords(miniBlogContent);
    if (wordCount >= 200 && wordCount <= 300) {
      score += 0.3;
    } else if (wordCount >= 150 && wordCount <= 350) {
      score += 0.2;
    }

    // Hashtag count (optimal: 3-5)
    if (hashtags.length >= 3 && hashtags.length <= 5) {
      score += 0.2;
    } else if (hashtags.length >= 2 && hashtags.length <= 6) {
      score += 0.1;
    }

    // Check for keyword density
    const keywords = this.extractKeywords(miniBlogContent, 10);
    const keywordDensity = keywords.length / wordCount;
    if (keywordDensity >= 0.05 && keywordDensity <= 0.15) {
      score += 0.2;
    } else if (keywordDensity >= 0.03 && keywordDensity <= 0.2) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
}

// Export singleton instance
export const descriptionGeneratorService = DescriptionGeneratorService.getInstance();
