/**
 * Video Analyzers
 *
 * Category-specific analyzers for the 8 knowledge base areas.
 * Each analyzer uses the appropriate Zod schema for structured output.
 *
 * Design:
 * - SOLID: Each analyzer is a separate function with single responsibility
 * - DRY: Common analysis logic extracted to base functions
 * - Modular: Easily enable/disable specific categories
 * - Production-grade: Retry logic, rate limiting, input validation
 *
 * @module video-analyzers
 */

import { GenerativeModel, Part } from "@google/generative-ai";
import { z } from "zod";
import { AppError, AppErrorType } from "../../types";
import {
  AudioDesignAnalysisSchema,
  BaseAnalysisResponse,
  CategorySchemaType,
  ChecklistsValidationSchema,
  CoreConceptsAnalysisSchema,
  ScriptingAnalysisSchema,
  SEOMetadataAnalysisSchema,
  StyleGuidesAnalysisSchema,
  ToolsWorkflowsAnalysisSchema,
  VisualEditingAnalysisSchema,
} from "../../types/schemas";
import { logger } from "../logger";
import { ANALYSIS_CONFIG, GEMINI_CONFIG } from "./constants";
import {
  RateLimiter,
  validateAnalysisInput,
  withRetry,
} from "./error-handling";
// Knowledge base loader is dynamically imported to avoid bundling fs/promises for client
// import { formatAsPromptContext, getKnowledgeBaseLoader } from "./knowledge-base-loader";
import {
  createJsonGenerationConfig,
  parseAndValidateResponse,
} from "./schema-converter";

// ============================================================================
// Types
// ============================================================================

/**
 * Input for video analysis
 */
export interface VideoAnalysisInput {
  /** Video ID for tracking */
  videoId: string;
  /** Video duration in seconds */
  duration: number;
  /** Transcription text (plain text, backwards compatible) */
  transcription: string;
  /** Transcription formatted with timestamps and speaker labels */
  transcriptionWithTimestamps?: string;
  /** Number of unique speakers detected */
  speakerCount?: number;
  /** Speaker statistics summary */
  speakerSummary?: string;
  /** Transcription segments with time and speaker info */
  transcriptionSegments?: Array<{
    start: number;
    end: number;
    speaker?: string;
    text: string;
  }>;
  /** Optional video metadata */
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
  /** Optional keyframes as base64 images */
  keyframes?: Array<{
    timestamp: number;
    base64Data: string;
    mimeType: string;
  }>;
}


/**
 * Analysis options
 */
export interface AnalysisOptions {
  /** Include knowledge base context in prompts */
  includeKnowledgeBase?: boolean;
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** Maximum output tokens */
  maxOutputTokens?: number;
  /** Skip input validation (use with caution) */
  skipValidation?: boolean;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Callback when waiting for retry (quota/rate limit) - for UI feedback */
  onRetryMessage?: (message: string) => void;
}

// ============================================================================
// Shared Rate Limiter (prevents API rate limit errors)
// ============================================================================

const rateLimiter = new RateLimiter(GEMINI_CONFIG.RATE_LIMIT_DELAY_MS);

// ============================================================================
// Base Analysis Function (DRY + Production-grade)
// ============================================================================

/**
 * Base function for running category analysis with production-grade features:
 * - Input validation
 * - Rate limiting
 * - Retry with exponential backoff
 * - Proper error classification
 *
 * @param model - Gemini model instance
 * @param category - Knowledge base category
 * @param input - Video analysis input
 * @param schema - Zod schema for response validation
 * @param promptBuilder - Function to build the category-specific prompt
 * @param options - Analysis options
 */
async function runCategoryAnalysis<T extends z.ZodTypeAny>(
  model: GenerativeModel,
  category: CategorySchemaType,
  input: VideoAnalysisInput,
  schema: T,
  promptBuilder: (context: string, input: VideoAnalysisInput) => string,
  options: AnalysisOptions = {}
): Promise<z.infer<T>> {
  const startTime = Date.now();

  // Validate input (unless explicitly skipped)
  if (!options.skipValidation) {
    const validation = validateAnalysisInput(input);
    if (!validation.valid) {
      throw new AppError(
        AppErrorType.INVALID_VIDEO_FILE,
        `Invalid input: ${validation.errors.join("; ")}`
      );
    }
  }

  // Truncate transcription if too long
  let transcription = input.transcription;
  if (transcription.length > ANALYSIS_CONFIG.MAX_TRANSCRIPTION_LENGTH) {
    logger.warn("Truncating transcription", {
      videoId: input.videoId,
      originalLength: transcription.length,
      maxLength: ANALYSIS_CONFIG.MAX_TRANSCRIPTION_LENGTH,
    });
    transcription = transcription.slice(
      0,
      ANALYSIS_CONFIG.MAX_TRANSCRIPTION_LENGTH
    );
  }

  // Limit keyframes
  const keyframes = input.keyframes?.slice(0, ANALYSIS_CONFIG.MAX_KEYFRAMES);

  // Load knowledge base context if requested (dynamic import to avoid client-side fs bundling)
  let kbContext = "";
  if (options.includeKnowledgeBase !== false) {
    try {
      // Dynamic import - only loads on server where fs is available
      const { getKnowledgeBaseLoader, formatAsPromptContext } = await import(
        "./knowledge-base-loader"
      );
      const loader = getKnowledgeBaseLoader();
      const files = await loader.loadCategory(category);
      kbContext = formatAsPromptContext(files);
    } catch (error) {
      logger.warn("Failed to load knowledge base context", {
        category,
        error: error instanceof Error ? error.message : "Unknown",
      });
    }
  }

  // Build prompt with sanitized input
  const sanitizedInput: VideoAnalysisInput = {
    ...input,
    transcription,
    keyframes,
  };
  const prompt = promptBuilder(kbContext, sanitizedInput);

  // Prepare content parts
  const parts: Part[] = [{ text: prompt }];

  // Add keyframes if provided
  if (keyframes?.length) {
    for (const frame of keyframes) {
      parts.push({
        inlineData: {
          mimeType: frame.mimeType,
          data: frame.base64Data,
        },
      });
      parts.push({
        text: `[Keyframe at ${frame.timestamp}s]`,
      });
    }
  }

  // Generate with JSON schema
  const generationConfig = createJsonGenerationConfig(schema, {
    temperature: options.temperature ?? GEMINI_CONFIG.DEFAULT_TEMPERATURE,
    maxOutputTokens: options.maxOutputTokens ?? GEMINI_CONFIG.DEFAULT_MAX_TOKENS,
  });

  // Apply rate limiting
  await rateLimiter.acquire();

  // Log the API call details
  logger.info("Gemini API call initiated", {
    category,
    videoId: input.videoId,
    model: model.model,
    temperature: generationConfig.temperature,
    maxOutputTokens: generationConfig.maxOutputTokens,
    promptLength: prompt.length,
    keyframeCount: keyframes?.length || 0,
    hasKnowledgeBase: !!kbContext && kbContext.length > 0,
    knowledgeBaseLength: kbContext?.length || 0,
  });

  // Log a sample of the prompt (first 500 chars) for debugging
  logger.debug("Gemini prompt preview", {
    category,
    videoId: input.videoId,
    promptPreview: prompt.substring(0, 500) + (prompt.length > 500 ? "..." : ""),
  });

  // Execute with retry logic
  const parsed = await withRetry(
    async () => {
      const apiCallStart = Date.now();
      
      logger.info("Calling Gemini API", {
        category,
        videoId: input.videoId,
        attempt: "initial",
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig,
      });

      const apiCallDuration = Date.now() - apiCallStart;
      
      logger.info("Gemini API call completed", {
        category,
        videoId: input.videoId,
        apiCallDuration,
        responseLength: result.response.text().length,
      });

      const responseText = result.response.text();

      // Log the raw response for debugging
      logger.info("Gemini raw response received", {
        category,
        videoId: input.videoId,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 1000) + (responseText.length > 1000 ? "..." : ""),
      });

      // Parse and validate response
      try {
        const validated = parseAndValidateResponse(responseText, schema);
        logger.info("Response validation succeeded", {
          category,
          videoId: input.videoId,
          validationDuration: Date.now() - apiCallStart,
        });
        return validated;
      } catch (validationError) {
        logger.error("Response validation failed", {
          category,
          videoId: input.videoId,
          validationError: validationError instanceof Error ? validationError.message : "Unknown",
          rawResponseLength: responseText.length,
          rawResponsePreview: responseText.substring(0, 2000),
          schemaName: schema.constructor.name,
          apiDuration: apiCallDuration,
        });
        throw validationError;
      }
    },
    {
      maxRetries: GEMINI_CONFIG.MAX_RETRIES,
      baseDelayMs: GEMINI_CONFIG.RETRY_BASE_DELAY_MS,
      maxDelayMs: GEMINI_CONFIG.RETRY_MAX_DELAY_MS,
      signal: options.signal,
      context: { category, videoId: input.videoId },
      onRetry: options.onRetryMessage 
        ? (info) => options.onRetryMessage!(info.message)
        : undefined,
    }
  );

  // Add processing time
  const processingTimeMs = Date.now() - startTime;
  if ("processingTimeMs" in parsed) {
    parsed.processingTimeMs = processingTimeMs;
  }

  logger.info("Category analysis completed", {
    category,
    videoId: input.videoId,
    processingTimeMs,
    issueCount: parsed.issues?.length ?? 0,
  });

  return parsed;
}

// ============================================================================
// Category-Specific Analyzers
// ============================================================================

/**
 * 01 - Core Concepts Analyzer
 * Analyzes retention psychology, dopamine loops, and pattern interrupts
 */
export async function analyzeCoreConepts(
  model: GenerativeModel,
  input: VideoAnalysisInput,
  options?: AnalysisOptions
) {
  return runCategoryAnalysis(
    model,
    "core_concepts",
    input,
    CoreConceptsAnalysisSchema,
    (context, inp) => `
You are a video retention expert analyzing a video for psychological engagement patterns.

${context ? `## Knowledge Base Reference\n${context}\n` : ""}

## Video Information
- Duration: ${inp.duration} seconds
- Video ID: ${inp.videoId}
${inp.metadata?.title ? `- Title: ${inp.metadata.title}` : ""}
${inp.speakerCount ? `- Number of Speakers: ${inp.speakerCount}` : ""}

${inp.speakerSummary ? `## Speaker Analysis\n${inp.speakerSummary}\n` : ""}

## Transcription${inp.transcriptionWithTimestamps ? " (with timestamps and speaker labels)" : ""}
${inp.transcriptionWithTimestamps || inp.transcription}

## CRITICAL: Response Format Required
You MUST return a JSON response with this EXACT structure:
{
  "category": "core_concepts",
  "summary": "2-3 sentence analysis summary",
  "overallScore": 0.85,
  "issues": [
    {
      "id": "unique-id",
      "timestamp": {"start": 5, "end": 10},
      "category": "core_concepts",
      "severity": "critical",
      "title": "Brief issue title",
      "description": "What was observed",
      "issue": "What is wrong",
      "recommendation": "Specific fix",
      "confidence": 0.9
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "priorityActions": ["action 1", "action 2", "action 3"],
  "retentionMetrics": {
    "predictedRetentionRate": 0.75,
    "dopamineLoopCount": 3,
    "patternInterruptCount": 4,
    "cognitiveLoadBalance": "optimal"
  },
  "criticalDropoffPoints": [
    {
      "timestamp": 15,
      "reason": "reason",
      "suggestedFix": "fix"
    }
  ]
}

IMPORTANT RULES:
- If NO ISSUES found: return "issues": [] (empty array), NOT a string like "No issues identified"
- If NO DROPOFF POINTS: return "criticalDropoffPoints": [] or null, NOT a string
- If unable to calculate metrics: return "retentionMetrics": null
- Always use proper JSON objects, never strings in array fields
- Use the provided timestamps when identifying issues for accurate playback positioning

## Analysis Task
Analyze this video for:
1. Dopamine loop effectiveness - are there reward cycles that keep viewers engaged?
2. Pattern interrupts - visual/audio changes that reset attention
3. Cognitive load balance - is the content under/over stimulating?
4. Critical drop-off points - where might viewers leave and why?
5. First 30 seconds hook effectiveness
${inp.speakerCount && inp.speakerCount > 1 ? `6. Speaker dynamics - how do the ${inp.speakerCount} speakers interact and share screen time?` : ""}

Identify specific issues with timestamps and provide actionable recommendations.
`,
    options
  );
}


/**
 * 02 - Scripting Analyzer
 * Analyzes script structure, narrative techniques, and visual gaps
 */
export async function analyzeScripting(
  model: GenerativeModel,
  input: VideoAnalysisInput,
  options?: AnalysisOptions
) {
  return runCategoryAnalysis(
    model,
    "scripting",
    input,
    ScriptingAnalysisSchema,
    (context, inp) => `
You are a video scripting expert analyzing script structure and narrative flow.

${context ? `## Knowledge Base Reference\n${context}\n` : ""}

## Video Information
- Duration: ${inp.duration} seconds
${inp.metadata?.title ? `- Title: ${inp.metadata.title}` : ""}
${inp.speakerCount ? `- Number of Speakers: ${inp.speakerCount}` : ""}

${inp.speakerSummary ? `## Speaker Analysis\n${inp.speakerSummary}\n` : ""}

## Transcription${inp.transcriptionWithTimestamps ? " (with timestamps and speaker labels)" : ""}
${inp.transcriptionWithTimestamps || inp.transcription}

## CRITICAL: Response Format Required
You MUST return a JSON response with this EXACT structure:
{
  "category": "scripting",
  "summary": "2-3 sentence analysis summary",
  "overallScore": 0.85,
  "issues": [
    {
      "id": "unique-id",
      "timestamp": {"start": 5, "end": 10},
      "category": "scripting",
      "severity": "critical",
      "title": "Brief issue title",
      "description": "What was observed",
      "issue": "What is wrong",
      "recommendation": "Specific fix",
      "confidence": 0.9
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "priorityActions": ["action 1", "action 2", "action 3"],
  "scriptMetrics": {
    "hookStrength": 0.9,
    "narrativeClarity": 0.85,
    "visualCueIntegration": 0.8,
    "openLoopCount": 2
  },
  "visualGaps": [
    {
      "timestamp": {"start": 15, "end": 20},
      "duration": 5,
      "suggestedBRoll": "B-roll suggestion"
    }
  ]
}

IMPORTANT RULES:
- If NO ISSUES found: return "issues": [] (empty array), NOT a string like "No issues identified"
- If NO VISUAL GAPS: return "visualGaps": [] or null, NOT a string
- If unable to calculate metrics: return "scriptMetrics": null
- Always use proper JSON objects, never strings in array fields
- Use the provided timestamps when identifying issues for accurate playback positioning

## Analysis Task
Analyze this script/transcription for:
1. Hook strength - does it grab attention in first 5-8 seconds?
2. Narrative clarity - is the story/information flow logical?
3. Visual cue integration - are there natural B-roll/graphics opportunities?
4. Open loops - questions raised that keep viewers watching
5. Visual gaps - sections that need more visual support
${inp.speakerCount && inp.speakerCount > 1 ? `6. Dialogue flow - evaluate the conversation/interview dynamics between the ${inp.speakerCount} speakers` : ""}

Provide specific timestamps for issues and recommendations.
`,
    options
  );
}


/**
 * 03 - Visual Editing Analyzer
 * Analyzes pacing, transitions, and visual dynamics
 */
export async function analyzeVisualEditing(
  model: GenerativeModel,
  input: VideoAnalysisInput,
  options?: AnalysisOptions
) {
  return runCategoryAnalysis(
    model,
    "visual_editing",
    input,
    VisualEditingAnalysisSchema,
    (context, inp) => `
You are a video editing expert analyzing visual pacing and dynamics.

${context ? `## Knowledge Base Reference\n${context}\n` : ""}

## Video Information
- Duration: ${inp.duration} seconds
${inp.metadata?.title ? `- Title: ${inp.metadata.title}` : ""}

## Transcription
${inp.transcription}

${inp.keyframes?.length ? `## Visual Keyframes Analysis (${inp.keyframes.length} frames provided)
CRITICAL: Analyze the ${inp.keyframes.length} keyframes provided at the following timestamps:
${inp.keyframes.map(kf => `- Frame at ${kf.timestamp.toFixed(1)}s`).join('\n')}

For each keyframe, evaluate:
- Visual composition and framing
- Color palette and contrast
- Typography/text overlays present
- Visual energy level (static vs dynamic)
- Shot type (close-up, wide, B-roll, etc.)
` : `## Note: No keyframes provided
Analysis is based on transcription only. For better visual analysis, provide keyframes.`}

## CRITICAL: Response Format Required
You MUST return a JSON response with this EXACT structure:
{
  "category": "visual_editing",
  "summary": "2-3 sentence analysis summary",
  "overallScore": 0.85,
  "issues": [
    {
      "id": "unique-id",
      "timestamp": {"start": 5, "end": 10},
      "category": "visual_editing",
      "severity": "critical",
      "title": "Brief issue title",
      "description": "What was observed",
      "issue": "What is wrong",
      "recommendation": "Specific fix",
      "confidence": 0.9
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "priorityActions": ["action 1", "action 2", "action 3"],
  "pacingMetrics": {
    "averageCutLength": 3.5,
    "visualChangeFrequency": 0.28,
    "dynamicZoomUsage": true,
    "transitionVariety": 0.7
  },
  "pacingViolations": [
    {
      "timestamp": {"start": 10, "end": 15},
      "type": "too_static",
      "suggestion": "Add cut or zoom"
    }
  ]
}

IMPORTANT RULES:
- If NO ISSUES found: return "issues": [] (empty array), NOT a string like "No issues identified"
- If NO PACING VIOLATIONS: return "pacingViolations": [] or null, NOT a string
- If unable to calculate metrics: return "pacingMetrics": null
- Always use proper JSON objects, never strings in array fields

## Analysis Task
Analyze visual editing for:
1. 3-second rule compliance - do visuals change frequently enough? Estimate based on keyframes.
2. Pacing rhythm - does the edit speed match content energy?
3. Dynamic zoom/movement - are static shots avoided?
4. Transition variety - are cuts, zooms, overlays varied?
5. Visual consistency - do the keyframes show consistent visual style?
6. Cognitive load oscillation - are there breathing room moments?

Identify pacing violations with specific timestamps and suggest fixes.
`,
    options
  );
}

/**
 * 04 - Audio Design Analyzer
 * Analyzes sound layers, music, and audio mixing
 */
export async function analyzeAudioDesign(
  model: GenerativeModel,
  input: VideoAnalysisInput,
  options?: AnalysisOptions
) {
  return runCategoryAnalysis(
    model,
    "audio_design",
    input,
    AudioDesignAnalysisSchema,
    (context, inp) => `
You are an audio design expert analyzing video sound architecture.

${context ? `## Knowledge Base Reference\n${context}\n` : ""}

## Video Information
- Duration: ${inp.duration} seconds
${inp.metadata?.title ? `- Title: ${inp.metadata.title}` : ""}

## Transcription (indicates speech patterns)
${inp.transcription}

## CRITICAL: Response Format Required
You MUST return a JSON response with this EXACT structure:
{
  "category": "audio_design",
  "summary": "2-3 sentence analysis summary",
  "overallScore": 0.85,
  "issues": [
    {
      "id": "unique-id",
      "timestamp": {"start": 5, "end": 10},
      "category": "audio_design",
      "severity": "critical",
      "title": "Brief issue title",
      "description": "What was observed",
      "issue": "What is wrong",
      "recommendation": "Specific fix",
      "confidence": 0.9
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "priorityActions": ["action 1", "action 2", "action 3"],
  "audioMetrics": {
    "layerCount": 3,
    "musicTiming": 0.8,
    "mixBalance": 0.85,
    "silenceGaps": 2
  },
  "audioIssues": [
    {
      "timestamp": {"start": 10, "end": 12},
      "type": "silence",
      "suggestion": "Add SFX"
    }
  ]
}

IMPORTANT RULES:
- If NO ISSUES found: return "issues": [] (empty array), NOT a string like "No issues identified"
- If NO AUDIO ISSUES: return "audioIssues": [] or null, NOT a string
- If unable to calculate metrics: return "audioMetrics": null
- Always use proper JSON objects, never strings in array fields

## Analysis Task
Analyze audio design based on the script/transcription for:
1. Sound layer opportunities - where could SFX, ambience enhance?
2. Music timing - are there natural music entry/exit points?
3. Mix balance indicators - dialogue vs background audio
4. Silence gaps - unintentional dead air vs dramatic pause
5. Audio ducking opportunities - where should music lower for speech?

Provide specific timestamps for audio issues and improvements.
`,
    options
  );
}

/**
 * 05 - SEO Metadata Analyzer
 * Analyzes title, description, and tag optimization
 */
export async function analyzeSEOMetadata(
  model: GenerativeModel,
  input: VideoAnalysisInput,
  options?: AnalysisOptions
) {
  return runCategoryAnalysis(
    model,
    "seo_metadata",
    input,
    SEOMetadataAnalysisSchema,
    (context, inp) => `
You are a YouTube SEO expert analyzing video metadata optimization.

${context ? `## Knowledge Base Reference\n${context}\n` : ""}

## Video Information
- Duration: ${inp.duration} seconds
${inp.metadata?.title ? `- Current Title: ${inp.metadata.title}` : "- No title provided"}
${inp.metadata?.description ? `- Current Description: ${inp.metadata.description}` : "- No description provided"}
${inp.metadata?.tags?.length ? `- Current Tags: ${inp.metadata.tags.join(", ")}` : "- No tags provided"}

## Transcription (for content analysis)
${inp.transcription}

## CRITICAL: Response Format Required
You MUST return a JSON response with this EXACT structure:
{
  "category": "seo_metadata",
  "summary": "2-3 sentence analysis summary",
  "overallScore": 0.85,
  "issues": [
    {
      "id": "unique-id",
      "timestamp": {"start": 0, "end": 0},
      "category": "seo_metadata",
      "severity": "critical",
      "title": "Brief issue title",
      "description": "What was observed",
      "issue": "What is wrong",
      "recommendation": "Specific fix",
      "confidence": 0.9
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "priorityActions": ["action 1", "action 2", "action 3"],
  "seoMetrics": {
    "titleScore": 0.75,
    "descriptionScore": 0.8,
    "tagRelevance": 0.85,
    "complianceStatus": "compliant"
  },
  "suggestions": {
    "titles": ["Optimized title 1", "Optimized title 2", "Optimized title 3"],
    "description": "Optimized description text",
    "tags": ["tag1", "tag2", "tag3"]
  }
}

IMPORTANT RULES:
- If NO ISSUES found: return "issues": [] (empty array), NOT a string like "No issues identified"
- Always use proper JSON objects, never strings in array fields
- Always provide seoMetrics and suggestions objects

## Analysis Task
Analyze SEO metadata for:
1. Title optimization - curiosity triggers, power words, length
2. Description engineering - mini-blog structure, timestamps, CTR
3. Tag relevance - keyword targeting, tag variety
4. Compliance check - no spam, deceptive practices
5. Searchability - how well does metadata match content?

Generate optimized title alternatives and improved description/tags.
`,
    options
  );
}

/**
 * 06 - Style Guides Analyzer
 * Analyzes style consistency and recommends creator styles
 */
export async function analyzeStyleGuides(
  model: GenerativeModel,
  input: VideoAnalysisInput,
  options?: AnalysisOptions
) {
  return runCategoryAnalysis(
    model,
    "style_guides",
    input,
    StyleGuidesAnalysisSchema,
    (context, inp) => `
You are a video style expert analyzing creator style patterns and visual identity.

${context ? `## Knowledge Base Reference\n${context}\n` : ""}

## Video Information
- Duration: ${inp.duration} seconds
${inp.metadata?.title ? `- Title: ${inp.metadata.title}` : ""}

## Transcription
${inp.transcription}

${inp.keyframes?.length ? `## Visual Style Analysis (${inp.keyframes.length} keyframes provided)
CRITICAL: Analyze the visual style across ${inp.keyframes.length} keyframes:
${inp.keyframes.map(kf => `- Frame at ${kf.timestamp.toFixed(1)}s`).join('\n')}

For style detection, examine:
- Color grading and palette consistency
- Typography style (fonts, sizes, positioning)
- Graphics/motion elements style
- Camera work patterns (zooms, static, movement)
- Overall visual energy level
- Use of B-roll vs talking head ratio
` : `## Note: No keyframes provided
Style analysis is limited without visual reference. Provide keyframes for accurate style detection.`}

## CRITICAL: Response Format Required
You MUST return a JSON response with this EXACT structure:
{
  "category": "style_guides",
  "summary": "2-3 sentence analysis summary",
  "overallScore": 0.85,
  "issues": [
    {
      "id": "unique-id",
      "timestamp": {"start": 5, "end": 10},
      "category": "style_guides",
      "severity": "critical",
      "title": "Brief issue title",
      "description": "What was observed",
      "issue": "What is wrong",
      "recommendation": "Specific fix",
      "confidence": 0.9
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "priorityActions": ["action 1", "action 2", "action 3"],
  "styleMetrics": {
    "detectedStyle": "mrbeast",
    "styleConsistency": 0.8,
    "recommendedStyle": "lemmino"
  },
  "styleRecommendations": [
    {
      "aspect": "Aspect name",
      "currentApproach": "Current approach",
      "suggestedApproach": "Suggested approach",
      "styleReference": "Reference style"
    }
  ]
}

IMPORTANT RULES:
- If NO ISSUES found: return "issues": [] (empty array), NOT a string like "No issues identified"
- If NO STYLE RECOMMENDATIONS: return "styleRecommendations": [] or null, NOT a string
- If unable to detect style: return "styleMetrics": null
- Always use proper JSON objects, never strings in array fields

## Analysis Task
Analyze style for:
1. Style detection - which creator style does this most resemble?
   Reference styles:
   - MrBeast: hyper-retention, fast cuts, big reactions, bold text overlays
   - Vox: explainer, clean graphics, data visualization, calm delivery
   - Lemmino: documentary, cinematic, long takes, minimal text
   - Hormozi: high-energy, quick cuts, in-your-face graphics, motivational
2. Style consistency score - is the detected style maintained throughout?
3. Style recommendations - what style would suit this content best?
4. Specific techniques to borrow from reference styles
5. Areas where style can be elevated with concrete examples

Provide actionable style recommendations with specific visual references.
`,
    options
  );
}

/**
 * 07 - Tools & Workflows Analyzer
 * Analyzes workflow efficiency and tool recommendations
 */
export async function analyzeToolsWorkflows(
  model: GenerativeModel,
  input: VideoAnalysisInput,
  options?: AnalysisOptions
) {
  return runCategoryAnalysis(
    model,
    "tools_workflows",
    input,
    ToolsWorkflowsAnalysisSchema,
    (context, inp) => `
You are a video production workflow expert.

${context ? `## Knowledge Base Reference\n${context}\n` : ""}

## Video Information
- Duration: ${inp.duration} seconds
${inp.metadata?.title ? `- Title: ${inp.metadata.title}` : ""}

## Transcription
${inp.transcription}

## CRITICAL: Response Format Required
You MUST return a JSON response with this EXACT structure:
{
  "category": "tools_workflows",
  "summary": "2-3 sentence analysis summary",
  "overallScore": 0.85,
  "issues": [
    {
      "id": "unique-id",
      "timestamp": {"start": 0, "end": 0},
      "category": "tools_workflows",
      "severity": "critical",
      "title": "Brief issue title",
      "description": "What was observed",
      "issue": "What is wrong",
      "recommendation": "Specific fix",
      "confidence": 0.9
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "priorityActions": ["action 1", "action 2", "action 3"],
  "workflowMetrics": {
    "efficiencyScore": 0.8,
    "automationPotential": 0.75
  },
  "toolRecommendations": [
    {
      "task": "Task description",
      "currentTool": "Current tool",
      "recommendedTool": "Recommended tool",
      "benefit": "Benefit description"
    }
  ]
}

IMPORTANT RULES:
- If NO ISSUES found: return "issues": [] (empty array), NOT a string like "No issues identified"
- If NO TOOL RECOMMENDATIONS: return "toolRecommendations": [] or null, NOT a string
- If unable to calculate metrics: return "workflowMetrics": null
- Always use proper JSON objects, never strings in array fields

## Analysis Task
Based on the video content, analyze:
1. Production workflow efficiency opportunities
2. Tools that could improve this type of content
3. Automation potential for repetitive editing tasks
4. Template opportunities for similar future videos
5. Integration recommendations between tools

Provide specific tool recommendations with benefits.
`,
    options
  );
}

/**
 * 08 - Checklists Validator
 * Validates against retention and SEO checklists
 */
export async function validateChecklists(
  model: GenerativeModel,
  input: VideoAnalysisInput,
  options?: AnalysisOptions
) {
  return runCategoryAnalysis(
    model,
    "checklists",
    input,
    ChecklistsValidationSchema,
    (context, inp) => `
You are a video production quality assurance expert.

${context ? `## Knowledge Base Reference (includes checklists)\n${context}\n` : ""}

## Video Information
- Duration: ${inp.duration} seconds
${inp.metadata?.title ? `- Title: ${inp.metadata.title}` : ""}
${inp.metadata?.description ? `- Description: ${inp.metadata.description}` : ""}
${inp.metadata?.tags?.length ? `- Tags: ${inp.metadata.tags.join(", ")}` : ""}

## Transcription
${inp.transcription}

## CRITICAL: Response Format Required
You MUST return a JSON response with this EXACT structure:
{
  "category": "checklists",
  "summary": "2-3 sentence analysis summary",
  "overallScore": 0.85,
  "issues": [
    {
      "id": "unique-id",
      "timestamp": {"start": 0, "end": 0},
      "category": "checklists",
      "severity": "critical",
      "title": "Brief issue title",
      "description": "What was observed",
      "issue": "What is wrong",
      "recommendation": "Specific fix",
      "confidence": 0.9
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "priorityActions": ["action 1", "action 2", "action 3"],
  "checklistResults": {
    "retentionChecklist": {
      "passed": 6,
      "failed": 2,
      "total": 8
    },
    "seoChecklist": {
      "passed": 4,
      "failed": 2,
      "total": 6
    }
  },
  "failedItems": [
    {
      "checklist": "retention",
      "item": "Strong hook in first 8 seconds",
      "status": "failed",
      "remediation": "Remediation steps"
    }
  ]
}

IMPORTANT RULES:
- If NO ISSUES found: return "issues": [] (empty array), NOT a string like "No issues identified"
- If NO FAILED ITEMS: return "failedItems": [] or null, NOT a string
- Always provide checklistResults object
- Always use proper JSON objects, never strings in array fields

## Analysis Task
Validate against checklists:

### Retention Checklist
- [ ] Strong hook in first 8 seconds
- [ ] Visual changes every 3-5 seconds
- [ ] Pattern interrupts throughout
- [ ] Dopamine loops/reward cycles
- [ ] No excessive dead air/silence
- [ ] Breathing room after high-intensity
- [ ] Clear structure/chapters
- [ ] Strong call-to-action

### SEO Checklist
- [ ] Title under 60 characters
- [ ] Curiosity gap in title
- [ ] Description has front-loaded keywords
- [ ] Timestamps/chapters included
- [ ] Relevant tags (5-15)
- [ ] No spam/deceptive practices

Report passed/failed items with remediation for failures.
`,
    options
  );
}

// ============================================================================
// Analyzer Registry (Factory Pattern)
// ============================================================================

/**
 * Map of category to analyzer function
 */
export const AnalyzerRegistry = {
  core_concepts: analyzeCoreConepts,
  scripting: analyzeScripting,
  visual_editing: analyzeVisualEditing,
  audio_design: analyzeAudioDesign,
  seo_metadata: analyzeSEOMetadata,
  style_guides: analyzeStyleGuides,
  tools_workflows: analyzeToolsWorkflows,
  checklists: validateChecklists,
} as const;

/**
 * Run a specific category analyzer by name
 */
export async function runAnalyzer(
  category: CategorySchemaType,
  model: GenerativeModel,
  input: VideoAnalysisInput,
  options?: AnalysisOptions
): Promise<BaseAnalysisResponse> {
  const analyzer = AnalyzerRegistry[category];
  if (!analyzer) {
    throw new Error(`Unknown analyzer category: ${category}`);
  }
  return analyzer(model, input, options);
}

/**
 * Run all category analyzers and combine results
 */
export async function runAllAnalyzers(
  model: GenerativeModel,
  input: VideoAnalysisInput,
  options?: AnalysisOptions & {
    categories?: CategorySchemaType[];
  }
): Promise<Record<CategorySchemaType, BaseAnalysisResponse | null>> {
  const categories = options?.categories || (Object.keys(AnalyzerRegistry) as CategorySchemaType[]);
  
  const results: Record<CategorySchemaType, BaseAnalysisResponse | null> = {
    core_concepts: null,
    scripting: null,
    visual_editing: null,
    audio_design: null,
    seo_metadata: null,
    style_guides: null,
    tools_workflows: null,
    checklists: null,
  };

  // Run analyzers sequentially to avoid rate limits
  for (const category of categories) {
    try {
      results[category] = await runAnalyzer(category, model, input, options);
    } catch (error) {
      logger.error("Analyzer failed", {
        category,
        videoId: input.videoId,
        error: error instanceof Error ? error.message : "Unknown",
      });
      results[category] = null;
    }
  }

  return results;
}
