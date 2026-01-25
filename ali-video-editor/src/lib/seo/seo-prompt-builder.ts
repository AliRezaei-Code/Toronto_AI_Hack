/**
 * SEO Prompt Builder Service
 *
 * Production-grade service for building AI prompts from LLM Knowledge Base.
 * Single source of truth for SEO optimization guidelines.
 *
 * Design Principles:
 * - SOLID: Single responsibility - prompt building only
 * - DRY: Loads from KB, no hardcoded values
 * - Modular: Easy to extend with new prompt types
 * - Fast: Caches KB data after first load
 *
 * @module seo-prompt-builder
 */

import path from "path";
import { getKnowledgeBaseLoader, KnowledgeBaseLoader } from "../ai/knowledge-base-loader";
import { logger } from "../logger";

// ============================================================================
// Types
// ============================================================================

/**
 * Title constraints from knowledge base
 */
interface TitleConstraints {
  optimalLength: string;
  maxLength: string;
  keywordPlacement: string;
  components: {
    primaryKeyword: string;
    psychologicalTrigger: string;
    structuralFormula: string;
    accuracy: string;
  };
}

/**
 * Description constraints from knowledge base
 */
interface DescriptionConstraints {
  aboveFoldLimit: string;
  miniBlogLength: string;
  timestampFormat: string;
  minimumChapters: number;
}

/**
 * Power word categories from knowledge base
 */
interface PowerWordCategories {
  urgencyFreshness: string[];
  authorityProof: string[];
  exclusivity: string[];
  negativityWarning: string[];
  simplicity: string[];
}

/**
 * Title formula templates from knowledge base
 */
interface TitleFormulas {
  seoHookHybrid: string;
  multiTrigger: string;
  curiosityGap: string;
  negativeFraming: string;
  listicle: string;
}

/**
 * Loaded SEO knowledge base data
 */
interface SEOKnowledgeBase {
  titleConstraints: TitleConstraints;
  descriptionConstraints: DescriptionConstraints;
  powerWords: PowerWordCategories;
  titleFormulas: TitleFormulas;
  corePrinciples: {
    title: string[];
    description: string[];
  };
}

// ============================================================================
// SEO Prompt Builder Class
// ============================================================================

/**
 * SEO Prompt Builder
 * Builds production-grade prompts from knowledge base
 */
export class SEOPromptBuilder {
  private static instance: SEOPromptBuilder;
  private kbLoader: KnowledgeBaseLoader;
  private kbData: SEOKnowledgeBase | null = null;
  private loadPromise: Promise<void> | null = null;

  private constructor() {
    this.kbLoader = getKnowledgeBaseLoader();
    logger.info("SEOPromptBuilder initialized");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SEOPromptBuilder {
    if (!SEOPromptBuilder.instance) {
      SEOPromptBuilder.instance = new SEOPromptBuilder();
    }
    return SEOPromptBuilder.instance;
  }

  /**
   * Ensure knowledge base is loaded (lazy loading with caching)
   */
  private async ensureLoaded(): Promise<void> {
    if (this.kbData) {
      return;
    }

    // Prevent multiple simultaneous loads
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadKnowledgeBase();
    await this.loadPromise;
    this.loadPromise = null;
  }

  /**
   * Load and parse knowledge base files
   */
  private async loadKnowledgeBase(): Promise<void> {
    const basePath = path.join(process.cwd(), "LLM_knowledge_Base", "05_seo_metadata");

    try {
      // Load title optimization
      const titleFile = await this.kbLoader.loadWithDependencies(
        path.join(basePath, "title_optimization.json")
      );

      // Load description engineering
      const descFile = await this.kbLoader.loadWithDependencies(
        path.join(basePath, "description_engineering.json")
      );

      // Extract and structure data
      const titleData = titleFile[0];
      const descData = descFile[0];

      if (!titleData || !descData) {
        throw new Error("Failed to load SEO knowledge base files");
      }

      // Extract data structures
      const titleDS = titleData.data_structures as Record<string, unknown>;
      const descDS = descData.data_structures as Record<string, unknown>;

      // Parse title checklist
      const titleChecklist = titleDS?.title_checklist as Record<string, unknown> | undefined;
      const charCount = titleChecklist?.character_count as Record<string, string> | undefined;
      const keywordPlace = titleChecklist?.keyword_placement as Record<string, string> | undefined;
      const components = titleChecklist?.components as Record<string, string> | undefined;

      // Parse power words
      const powerWordCats = titleDS?.power_word_categories as Record<string, string[]> | undefined;

      // Parse formulas
      const formulas = titleDS?.title_formula_templates as Record<string, string> | undefined;

      // Parse description hierarchy
      const descHierarchy = descDS?.description_template_hierarchy as
        | Record<string, unknown>
        | undefined;
      const aboveFold = descHierarchy?.above_fold_snippet as Record<string, string> | undefined;
      const miniBlog = descHierarchy?.mini_blog_content as Record<string, string> | undefined;
      const timestamps = descDS?.timestamp_requirements as Record<string, unknown> | undefined;

      // Extract core principles
      const titlePrinciples =
        titleData.core_principles
          ?.filter((p) => p.importance === "high")
          .map((p) => `${p.principle}: ${p.description}`) || [];

      const descPrinciples =
        descData.core_principles
          ?.filter((p) => p.importance === "high")
          .map((p) => `${p.principle}: ${p.description}`) || [];

      this.kbData = {
        titleConstraints: {
          optimalLength: charCount?.optimal || "60-70 characters",
          maxLength: charCount?.maximum || "100 characters",
          keywordPlacement: keywordPlace?.ideal || "first 1-5 words",
          components: {
            primaryKeyword: components?.primary_keyword || "required",
            psychologicalTrigger: components?.psychological_trigger || "required",
            structuralFormula: components?.structural_formula || "recommended",
            accuracy: components?.accuracy || "mandatory",
          },
        },
        descriptionConstraints: {
          aboveFoldLimit: aboveFold?.limit || "150 characters",
          miniBlogLength: miniBlog?.length || "200-300 words",
          timestampFormat: (timestamps?.format as string) || "00:00 ChapterName",
          minimumChapters: (timestamps?.minimum_chapters as number) || 3,
        },
        powerWords: {
          urgencyFreshness: powerWordCats?.urgency_freshness || ["2025", "New", "Update"],
          authorityProof: powerWordCats?.authority_proof || ["Proven", "Guide", "Expert"],
          exclusivity: powerWordCats?.exclusivity || ["Secret", "Hidden", "Exclusive"],
          negativityWarning: powerWordCats?.negativity_warning || ["Stop", "Avoid", "Warning"],
          simplicity: powerWordCats?.simplicity || ["Easy", "Fast", "Simple"],
        },
        titleFormulas: {
          seoHookHybrid: formulas?.seo_hook_hybrid || "[Keyword] | [Hook/Promise]",
          multiTrigger: formulas?.multi_trigger || "[Number] [Power Word] [Keyword]",
          curiosityGap: formulas?.curiosity_gap || "[Question?] [Promise]",
          negativeFraming: formulas?.negative_framing || "[Negative] [Keyword] [Benefit]",
          listicle: formulas?.listicle || "[Number] [Ways/Tips] to [Benefit]",
        },
        corePrinciples: {
          title: titlePrinciples,
          description: descPrinciples,
        },
      };

      logger.info("SEO knowledge base loaded successfully", {
        powerWordCategories: Object.keys(this.kbData.powerWords).length,
        titleFormulas: Object.keys(this.kbData.titleFormulas).length,
      });
    } catch (error) {
      logger.error("Failed to load SEO knowledge base", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Set defaults so we don't break
      this.kbData = this.getDefaultKBData();
    }
  }

  /**
   * Default KB data (fallback if loading fails)
   */
  private getDefaultKBData(): SEOKnowledgeBase {
    return {
      titleConstraints: {
        optimalLength: "60-70 characters",
        maxLength: "100 characters",
        keywordPlacement: "first 1-5 words",
        components: {
          primaryKeyword: "required",
          psychologicalTrigger: "required",
          structuralFormula: "recommended",
          accuracy: "mandatory",
        },
      },
      descriptionConstraints: {
        aboveFoldLimit: "150 characters",
        miniBlogLength: "200-300 words",
        timestampFormat: "00:00 ChapterName",
        minimumChapters: 3,
      },
      powerWords: {
        urgencyFreshness: ["2025", "New", "Update", "Latest"],
        authorityProof: ["Proven", "Official", "Guide", "Expert"],
        exclusivity: ["Secret", "Hidden", "Exclusive"],
        negativityWarning: ["Stop", "Avoid", "Warning", "Never"],
        simplicity: ["Easy", "Fast", "Simple", "Quick"],
      },
      titleFormulas: {
        seoHookHybrid: "[Search Keyword] | [Hook/Promise]",
        multiTrigger: "[Number] [Power Word] [Keyword]",
        curiosityGap: "[Question?] [Promise/Hint]",
        negativeFraming: "[Negative Word] [Keyword] [Benefit]",
        listicle: "[Number] [Ways/Tips] to [Benefit]",
      },
      corePrinciples: {
        title: [
          "Keyword Front-Loading: Primary keyword within first 5 words",
          "Psychological Triggers: Power words boost CTR",
          "Content Promise Alignment: Title promise delivered in first 30 seconds",
        ],
        description: [
          "Mini-Blog Format: 200-300 words for long-tail keywords",
          "Above the Fold: First 150 chars visible in search",
          "Timestamp Integration: Chapters enable Google Key Moments",
        ],
      },
    };
  }

  // ============================================================================
  // Prompt Building Methods
  // ============================================================================

  /**
   * Build title generation prompt from knowledge base
   */
  public async buildTitlePrompt(context: {
    topics: string[];
    duration: number;
    contentPreview: string;
  }): Promise<string> {
    await this.ensureLoaded();
    const kb = this.kbData;
    if (!kb) {
      throw new Error("Knowledge base not loaded");
    }

    // Select random power words for variety
    const urgencyWord = this.randomFrom(kb.powerWords.urgencyFreshness);
    const authorityWord = this.randomFrom(kb.powerWords.authorityProof);

    const prompt = `
Generate a compelling YouTube-optimized title for this video.

## Content Context
- Key topics: ${context.topics.slice(0, 5).join(", ")}
- Video duration: ${context.duration} seconds
- Content preview: ${context.contentPreview.substring(0, 200)}

## Title Requirements (from Knowledge Base)
${kb.corePrinciples.title.map((p) => `- ${p}`).join("\n")}

## Constraints
- Length: ${kb.titleConstraints.optimalLength} (max ${kb.titleConstraints.maxLength})
- Keyword placement: ${kb.titleConstraints.keywordPlacement}
- Must include: primary keyword + psychological trigger

## Recommended Formulas (pick one)
- SEO-Hook Hybrid: ${kb.titleFormulas.seoHookHybrid}
- Multi-Trigger: ${kb.titleFormulas.multiTrigger}
- Curiosity Gap: ${kb.titleFormulas.curiosityGap}

## Power Words to Consider
- Urgency: ${kb.powerWords.urgencyFreshness.slice(0, 4).join(", ")}
- Authority: ${kb.powerWords.authorityProof.slice(0, 4).join(", ")}
- Consider: "${urgencyWord}" or "${authorityWord}"

## Output
Return ONLY the title text (no quotes, no explanation).
`.trim();

    return prompt;
  }

  /**
   * Build description generation prompt from knowledge base
   */
  public async buildDescriptionPrompt(context: {
    topics: string[];
    duration: number;
    engagementScore: number;
    contentPreview: string;
  }): Promise<string> {
    await this.ensureLoaded();
    const kb = this.kbData;
    if (!kb) {
      throw new Error("Knowledge base not loaded");
    }

    const prompt = `
Generate a compelling YouTube description for this video.

## Content Context
- Key topics: ${context.topics.slice(0, 5).join(", ")}
- Video duration: ${context.duration} seconds  
- Predicted engagement: ${Math.round(context.engagementScore * 100)}%
- Content preview: ${context.contentPreview.substring(0, 300)}

## Description Requirements (from Knowledge Base)
${kb.corePrinciples.description.map((p) => `- ${p}`).join("\n")}

## Above-the-Fold Optimization (CRITICAL)
- First ${kb.descriptionConstraints.aboveFoldLimit} visible in search results
- Start with value proposition + primary keyword
- NO generic intros like "Welcome to my channel"

## Content Goals
- Full description: ${kb.descriptionConstraints.miniBlogLength} for SEO
- This response: 150-300 characters (above-fold snippet only)
- Focus on viewer benefit and engagement

## Output
Return ONLY the description snippet (150-300 chars, no quotes).
`.trim();

    return prompt;
  }

  /**
   * Get loaded KB data for direct access
   */
  public async getKBData(): Promise<SEOKnowledgeBase> {
    await this.ensureLoaded();
    const kb = this.kbData;
    if (!kb) {
      throw new Error("Knowledge base not loaded");
    }
    return kb;
  }

  /**
   * Get title length constraints
   */
  public async getTitleLengthConstraints(): Promise<{
    optimal: { min: number; max: number };
    maximum: number;
  }> {
    await this.ensureLoaded();
    const kb = this.kbData;
    if (!kb) {
      throw new Error("Knowledge base not loaded");
    }

    // Parse "60-70 characters" format
    const optMatch = kb.titleConstraints.optimalLength.match(/(\d+)-(\d+)/);
    const maxMatch = kb.titleConstraints.maxLength.match(/(\d+)/);

    return {
      optimal: {
        min: optMatch && optMatch[1] ? parseInt(optMatch[1], 10) : 60,
        max: optMatch && optMatch[2] ? parseInt(optMatch[2], 10) : 70,
      },
      maximum: maxMatch && maxMatch[1] ? parseInt(maxMatch[1], 10) : 100,
    };
  }

  /**
   * Get description length constraints
   */
  public async getDescriptionLengthConstraints(): Promise<{
    aboveFold: number;
    miniBlog: { min: number; max: number };
  }> {
    await this.ensureLoaded();
    const kb = this.kbData;
    if (!kb?.descriptionConstraints) {
      throw new Error("Description constraints not available");
    }

    const foldMatch = kb.descriptionConstraints.aboveFoldLimit.match(/(\d+)/);
    const blogMatch = kb.descriptionConstraints.miniBlogLength.match(/(\d+)-(\d+)/);

    return {
      aboveFold: foldMatch && foldMatch[1] ? parseInt(foldMatch[1], 10) : 150,
      miniBlog: {
        min: blogMatch && blogMatch[1] ? parseInt(blogMatch[1], 10) : 200,
        max: blogMatch && blogMatch[2] ? parseInt(blogMatch[2], 10) : 300,
      },
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Get random element from array
   */
  private randomFrom<T>(arr: T[]): T {
    if (arr.length === 0) {
      throw new Error("Cannot select from empty array");
    }
    const index = Math.floor(Math.random() * arr.length);
    return arr[index] as T;
  }

  /**
   * Clear cache (for testing/hot-reload)
   */
  public clearCache(): void {
    this.kbData = null;
    this.loadPromise = null;
  }
}

// ============================================================================
// Exports
// ============================================================================

// Export singleton instance
export const seoPromptBuilder = SEOPromptBuilder.getInstance();
