/**
 * Video Analysis Zod Schemas
 *
 * Production-grade schemas for Gemini API structured output.
 * Uses Gemini's native JSON mode with responseSchema for guaranteed valid responses.
 *
 * Design Principles:
 * - SOLID: Single responsibility per schema, open for extension
 * - DRY: Base schemas composed into category-specific schemas
 * - Type-safe: Full TypeScript inference from Zod schemas
 */

import { z } from "zod";

// ============================================================================
// Base Schemas (DRY - reused across all categories)
// ============================================================================

/**
 * Time range for video segments
 */
export const TimeRangeSchema = z.object({
  start: z.number().describe("Start time in seconds"),
  end: z.number().describe("End time in seconds"),
});

export type TimeRange = z.infer<typeof TimeRangeSchema>;

/**
 * Issue categories matching the 8 knowledge base directories
 */
export const IssueCategorySchema = z.enum([
  "core_concepts", // 01
  "scripting", // 02
  "visual_editing", // 03
  "audio_design", // 04
  "seo_metadata", // 05
  "style_guides", // 06
  "tools_workflows", // 07
  "checklists", // 08
]);

export type IssueCategory = z.infer<typeof IssueCategorySchema>;

/**
 * Issue severity levels
 */
export const SeveritySchema = z.enum([
  "critical", // Must fix - significantly hurts retention/engagement
  "major", // Should fix - noticeable negative impact
  "minor", // Nice to fix - small improvement opportunity
  "suggestion", // Optional - optimization idea
]);

export type Severity = z.infer<typeof SeveritySchema>;

// ============================================================================
// Core Issue Schema (Single Responsibility)
// ============================================================================

/**
 * Standardized video analysis issue - the core output structure
 * Every analyzer returns an array of these issues.
 */
export const VideoAnalysisIssueSchema = z.object({
  id: z.string().describe("Unique identifier for this issue"),
  timestamp: TimeRangeSchema.describe("Time range where issue occurs"),
  category: IssueCategorySchema.describe("Knowledge base category"),
  severity: SeveritySchema.describe("How critical this issue is"),
  title: z.string().describe("Brief issue title (5-10 words)"),
  description: z.string().describe("What was observed in the video"),
  issue: z.string().describe("What is wrong and why it matters"),
  recommendation: z.string().describe("Specific actionable fix"),
  confidence: z.number().min(0).max(1).describe("Model confidence 0-1"),
  relatedTechnique: z
    .string()
    .optional()
    .describe("Technique from knowledge base that addresses this"),
});

export type VideoAnalysisIssue = z.infer<typeof VideoAnalysisIssueSchema>;

// ============================================================================
// Category Analysis Response (Open/Closed Principle - extendable per category)
// ============================================================================

/**
 * Base response schema shared by all category analyzers
 */
export const BaseAnalysisResponseSchema = z.object({
  category: IssueCategorySchema.describe("Which category was analyzed"),
  summary: z.string().describe("2-3 sentence analysis summary"),
  overallScore: z.number().min(0).max(1).describe("Overall quality score 0-1"),
  issues: z.array(VideoAnalysisIssueSchema).describe("Issues found"),
  strengths: z.array(z.string()).describe("What the video does well"),
  priorityActions: z.array(z.string()).max(3).describe("Top 3 actions to take first"),
  processingTimeMs: z.number().optional().describe("Analysis duration in ms"),
});

export type BaseAnalysisResponse = z.infer<typeof BaseAnalysisResponseSchema>;

// ============================================================================
// Category-Specific Extended Schemas
// ============================================================================

/**
 * 01 - Core Concepts Analysis (retention psychology, pattern interrupts)
 */
export const CoreConceptsAnalysisSchema = BaseAnalysisResponseSchema.extend({
  category: z.literal("core_concepts"),
  retentionMetrics: z
    .object({
      predictedRetentionRate: z.number().min(0).max(1),
      dopamineLoopCount: z.number(),
      patternInterruptCount: z.number(),
      cognitiveLoadBalance: z.enum(["under", "optimal", "over"]),
    })
    .nullish(),
  criticalDropoffPoints: z
    .array(
      z.object({
        timestamp: z.number(),
        reason: z.string(),
        suggestedFix: z.string(),
      })
    )
    .nullish(),
});

export type CoreConceptsAnalysis = z.infer<typeof CoreConceptsAnalysisSchema>;

/**
 * 02 - Scripting Analysis (AV format, narrative techniques)
 */
export const ScriptingAnalysisSchema = BaseAnalysisResponseSchema.extend({
  category: z.literal("scripting"),
  scriptMetrics: z
    .object({
      hookStrength: z.number().min(0).max(1),
      narrativeClarity: z.number().min(0).max(1),
      visualCueIntegration: z.number().min(0).max(1),
      openLoopCount: z.number(),
    })
    .nullish(),
  visualGaps: z
    .array(
      z.object({
        timestamp: TimeRangeSchema,
        duration: z.number(),
        suggestedBRoll: z.string(),
      })
    )
    .nullish(),
});

export type ScriptingAnalysis = z.infer<typeof ScriptingAnalysisSchema>;

/**
 * 03 - Visual Editing Analysis (pacing, transitions, typography)
 */
export const VisualEditingAnalysisSchema = BaseAnalysisResponseSchema.extend({
  category: z.literal("visual_editing"),
  pacingMetrics: z
    .object({
      averageCutLength: z.number(),
      visualChangeFrequency: z.number(),
      dynamicZoomUsage: z.boolean(),
      transitionVariety: z.number().min(0).max(1),
    })
    .nullish(),
  pacingViolations: z
    .array(
      z.object({
        timestamp: TimeRangeSchema,
        type: z.enum(["too_static", "too_fast", "monotonous"]),
        suggestion: z.string(),
      })
    )
    .nullish(),
});

export type VisualEditingAnalysis = z.infer<typeof VisualEditingAnalysisSchema>;

/**
 * 04 - Audio Design Analysis (layers, mixing, music)
 */
export const AudioDesignAnalysisSchema = BaseAnalysisResponseSchema.extend({
  category: z.literal("audio_design"),
  audioMetrics: z
    .object({
      layerCount: z.number(),
      musicTiming: z.number().min(0).max(1),
      mixBalance: z.number().min(0).max(1),
      silenceGaps: z.number(),
    })
    .nullish(),
  audioIssues: z
    .array(
      z.object({
        timestamp: TimeRangeSchema,
        type: z.enum(["silence", "imbalance", "missing_sfx", "music_timing"]),
        suggestion: z.string(),
      })
    )
    .nullish(),
});

export type AudioDesignAnalysis = z.infer<typeof AudioDesignAnalysisSchema>;

/**
 * 05 - SEO Metadata Analysis (titles, descriptions, tags)
 */
export const SEOMetadataAnalysisSchema = BaseAnalysisResponseSchema.extend({
  category: z.literal("seo_metadata"),
  seoMetrics: z.object({
    titleScore: z.number().min(0).max(1),
    descriptionScore: z.number().min(0).max(1),
    tagRelevance: z.number().min(0).max(1),
    complianceStatus: z.enum(["compliant", "warning", "violation"]),
  }),
  suggestions: z.object({
    titles: z.array(z.string()).max(3),
    description: z.string().optional(),
    tags: z.array(z.string()).max(10),
  }),
});

export type SEOMetadataAnalysis = z.infer<typeof SEOMetadataAnalysisSchema>;

/**
 * 06 - Style Guides Analysis (creator style matching)
 */
export const StyleGuidesAnalysisSchema = BaseAnalysisResponseSchema.extend({
  category: z.literal("style_guides"),
  styleMetrics: z
    .object({
      detectedStyle: z.enum(["high_energy", "vox", "lemmino", "hormozi", "mixed", "custom"]),
      styleConsistency: z.number().min(0).max(1),
      recommendedStyle: z.string(),
    })
    .nullish(),
  styleRecommendations: z
    .array(
      z.object({
        aspect: z.string(),
        currentApproach: z.string(),
        suggestedApproach: z.string(),
        styleReference: z.string(),
      })
    )
    .nullish(),
});

export type StyleGuidesAnalysis = z.infer<typeof StyleGuidesAnalysisSchema>;

/**
 * 07 - Tools & Workflows Analysis
 */
export const ToolsWorkflowsAnalysisSchema = BaseAnalysisResponseSchema.extend({
  category: z.literal("tools_workflows"),
  workflowMetrics: z
    .object({
      efficiencyScore: z.number().min(0).max(1),
      automationPotential: z.number().min(0).max(1),
    })
    .nullish(),
  toolRecommendations: z
    .array(
      z.object({
        task: z.string(),
        currentTool: z.string().optional(),
        recommendedTool: z.string(),
        benefit: z.string(),
      })
    )
    .nullish(),
});

export type ToolsWorkflowsAnalysis = z.infer<typeof ToolsWorkflowsAnalysisSchema>;

/**
 * 08 - Checklists Validation
 */
export const ChecklistsValidationSchema = BaseAnalysisResponseSchema.extend({
  category: z.literal("checklists"),
  checklistResults: z
    .object({
      retentionChecklist: z.object({
        passed: z.number(),
        failed: z.number(),
        total: z.number(),
      }),
      seoChecklist: z.object({
        passed: z.number(),
        failed: z.number(),
        total: z.number(),
      }),
    })
    .nullish(),
  failedItems: z
    .array(
      z.object({
        checklist: z.enum(["retention", "seo"]),
        item: z.string(),
        status: z.enum(["failed", "partial"]),
        remediation: z.string(),
      })
    )
    .nullish(),
});

export type ChecklistsValidation = z.infer<typeof ChecklistsValidationSchema>;

// ============================================================================
// Unified Analysis Response (combines all categories)
// ============================================================================

/**
 * Complete video analysis combining all category results
 */
export const ComprehensiveAnalysisSchema = z.object({
  videoId: z.string(),
  analyzedAt: z.string().describe("ISO 8601 timestamp"),
  totalDuration: z.number().describe("Video duration in seconds"),
  overallScore: z.number().min(0).max(1).describe("Combined quality score"),
  categoryResults: z.object({
    coreConepts: CoreConceptsAnalysisSchema.optional(),
    scripting: ScriptingAnalysisSchema.optional(),
    visualEditing: VisualEditingAnalysisSchema.optional(),
    audioDesign: AudioDesignAnalysisSchema.optional(),
    seoMetadata: SEOMetadataAnalysisSchema.optional(),
    styleGuides: StyleGuidesAnalysisSchema.optional(),
    toolsWorkflows: ToolsWorkflowsAnalysisSchema.optional(),
    checklists: ChecklistsValidationSchema.optional(),
  }),
  allIssues: z.array(VideoAnalysisIssueSchema),
  topPriorityActions: z.array(z.string()).max(5),
});

export type ComprehensiveAnalysis = z.infer<typeof ComprehensiveAnalysisSchema>;

// ============================================================================
// Schema Registry (Factory Pattern for schema lookup)
// ============================================================================

/**
 * Registry mapping category names to their schemas
 * Follows Open/Closed Principle - add new categories without modifying existing code
 */
export const CategorySchemaRegistry = {
  core_concepts: CoreConceptsAnalysisSchema,
  scripting: ScriptingAnalysisSchema,
  visual_editing: VisualEditingAnalysisSchema,
  audio_design: AudioDesignAnalysisSchema,
  seo_metadata: SEOMetadataAnalysisSchema,
  style_guides: StyleGuidesAnalysisSchema,
  tools_workflows: ToolsWorkflowsAnalysisSchema,
  checklists: ChecklistsValidationSchema,
} as const;

export type CategorySchemaType = keyof typeof CategorySchemaRegistry;

/**
 * Get schema for a specific category
 */
export function getCategorySchema<T extends CategorySchemaType>(
  category: T
): (typeof CategorySchemaRegistry)[T] {
  return CategorySchemaRegistry[category];
}
