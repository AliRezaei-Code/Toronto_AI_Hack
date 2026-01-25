/**
 * Video Copilot - Description Generation Types
 * YouTube-optimized video description generation
 */

/**
 * Description length options
 */
export type DescriptionLength = "short" | "medium" | "long";

/**
 * Description tone options
 * - "professional": authoritative, credible language
 * - "casual": friendly, conversational language
 * - "engaging": energetic, CTA-focused language
 * - "custom": user-defined tone using customTone field
 */
export type DescriptionTone = "professional" | "casual" | "engaging" | "custom";

/**
 * Description generation options
 */
export interface DescriptionOptions {
  /** Length of the description */
  length: DescriptionLength;
  /** Tone of the description */
  tone: DescriptionTone;
  /** Custom tone description (used when tone is "custom") */
  customTone?: string;
  /** Whether to include hashtags */
  includeHashtags: boolean;
  /** Custom keywords to emphasize */
  customKeywords?: string[];
  /** Whether to include timestamps/chapters */
  includeChapters: boolean;
  /** Channel name for CTA */
  channelName?: string;
  /** Social media links */
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    website?: string;
  };
}

/**
 * Generated YouTube-optimized description
 */
export interface GeneratedDescription {
  /** Unique identifier */
  id: string;
  /** Video ID this description belongs to */
  videoId: string;
  /** Above-the-fold snippet (first 150 chars) */
  aboveFoldSnippet: string;
  /** Mini-blog content (200-300 words) */
  miniBlogContent: string;
  /** Timestamps/chapters section */
  timestampsSection?: string;
  /** Resources section */
  resourcesSection?: string;
  /** Recirculation section */
  recirculationSection?: string;
  /** Disclosure section */
  disclosureSection?: string;
  /** Social media section */
  socialSection?: string;
  /** Hashtags section */
  hashtagsSection?: string;
  /** Complete description (all sections combined) */
  fullDescription: string;
  /** Generated hashtags */
  hashtags: string[];
  /** SEO score (0-1) */
  seoScore: number;
  /** Word count */
  wordCount: number;
  /** Character count */
  characterCount: number;
  /** Timestamp when description was generated */
  createdAt: Date;
}

/**
 * Description generation request
 */
export interface DescriptionGenerationRequest {
  /** Video ID */
  videoId: string;
  /** Transcription text */
  transcription: string;
  /** Video title */
  title?: string;
  /** Video chapters */
  chapters?: Array<{
    title: string;
    start: number;
    end: number;
  }>;
  /** Description generation options */
  options: DescriptionOptions;
}

/**
 * Description generation result
 */
export interface DescriptionGenerationResult {
  /** Generated description */
  description: GeneratedDescription;
  /** Processing time in seconds */
  processingTime: number;
  /** Whether generation was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}
