/**
 * JSON Schema Converter for Gemini API
 *
 * Converts Zod schemas to JSON Schema format compatible with Gemini's responseSchema.
 * Uses zod-to-json-schema for reliable conversion.
 *
 * @module schema-converter
 */

import { ResponseSchema } from "@google/generative-ai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { logger } from "../logger";

// ============================================================================
// Schema Conversion
// ============================================================================

// ============================================================================
// Schema Conversion
// ============================================================================

/**
 * Fields that Gemini API doesn't support in response_schema
 * These must be stripped or API returns 400 Bad Request
 */
const UNSUPPORTED_SCHEMA_FIELDS = [
  "$ref",
  "$defs", 
  "$schema",
  "definitions",
  "$id",
  "additionalProperties", // Gemini doesn't support this either
] as const;

/**
 * Remove all unsupported fields from schema recursively (Gemini doesn't support them)
 */
function removeUnsupportedFields(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUnsupportedFields);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Skip unsupported fields
    if (UNSUPPORTED_SCHEMA_FIELDS.includes(key as typeof UNSUPPORTED_SCHEMA_FIELDS[number])) {
      continue;
    }
    result[key] = removeUnsupportedFields(value);
  }

  return result;
}

/**
 * Convert a Zod schema to Gemini-compatible JSON Schema
 *
 * @param schema - Zod schema to convert
 * @param name - Optional name for the schema (used as $ref)
 * @returns JSON Schema object compatible with Gemini API
 */
export function zodToGeminiSchema<T extends z.ZodTypeAny>(
  schema: T,
  name?: string
): ResponseSchema {
  const jsonSchema = zodToJsonSchema(schema, {
    name: name || "response",
    $refStrategy: "none", // Inline all refs for Gemini compatibility
    target: "jsonSchema7", // Use JSON Schema draft-07
  });

  // Remove unwanted fields
  const { ...cleanSchema } = jsonSchema as Record<string, unknown>;

  // Remove all unsupported fields recursively ($ref, $defs, $schema, definitions, etc.)
  return removeUnsupportedFields(cleanSchema) as unknown as ResponseSchema;
}

/**
 * Create generation config with JSON schema for structured output
 */
export function createJsonGenerationConfig<T extends z.ZodTypeAny>(
  schema: T,
  options?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  }
): {
  responseMimeType: string;
  responseSchema: ResponseSchema;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
} {
  return {
    responseMimeType: "application/json",
    responseSchema: zodToGeminiSchema(schema),
    ...options,
  };
}

// ============================================================================
// Response Parsing with Validation
// ============================================================================

/**
 * Normalize Gemini response by fixing common schema violations
 * This handles cases where Gemini returns:
 * - JSON strings in object arrays: ["{\"id\": \"...\"}"] -> [{"id": "..."}]
 * - Primitive values in object arrays: [-1, -1] -> []
 * - Null values in object arrays: [null] -> []
 * - Strings instead of empty objects: ["No issues"] -> []
 * - Invalid enum values: "high" -> "critical"
 * - Arrays as strings: "strength1, strength2" -> ["strength1", "strength2"]
 */
function normalizeGeminiResponse(parsed: unknown): unknown {
  if (parsed === null || typeof parsed !== "object") {
    return parsed;
  }

  if (Array.isArray(parsed)) {
    // Try to parse JSON strings in arrays
    const normalized = parsed.map((item) => {
      if (typeof item === "string") {
        try {
          return JSON.parse(item);
        } catch {
          // If it's not JSON, keep as is if it's a valid primitive, otherwise filter out
          return item;
        }
      }
      return item;
    });

    // Filter out nulls, -1, and non-object values from object arrays
    return normalized.filter(
      (item) =>
        item !== null &&
        item !== -1 &&
        (typeof item === "object" || typeof item === "string" || typeof item === "number")
    );
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      // Special handling for known object arrays
      const objectArrayFields = [
        "issues",
        "criticalDropoffPoints",
        "visualGaps",
        "pacingViolations",
        "audioIssues",
        "styleRecommendations",
        "toolRecommendations",
        "failedItems",
      ];

      if (objectArrayFields.includes(key)) {
        // Parse JSON strings and filter invalid values
        result[key] = value
          .map((item) => {
            if (typeof item === "string") {
              try {
                return JSON.parse(item);
              } catch {
                // If parsing fails, return null to be filtered
                return null;
              }
            }
            return item;
          })
          .filter((item) => item !== null && item !== -1 && typeof item === "object");
      } else {
        result[key] = normalizeGeminiResponse(value);
      }
    } else if (typeof value === "object" && value !== null) {
      result[key] = normalizeGeminiResponse(value);
    } else if (key === "severity" && typeof value === "string") {
      // Normalize severity enum values
      result[key] = normalizeEnumValue("severity", value);
    } else if (key === "category" && typeof value === "string") {
      // Normalize category enum values
      result[key] = normalizeEnumValue("category", value);
    } else if (key === "type" && typeof value === "string") {
      // Normalize type enum values (for audio issues)
      result[key] = normalizeEnumValue("type", value);
    } else if ((key === "strengths" || key === "priorityActions") && typeof value === "string") {
      // Convert string to array for strengths and priorityActions
      result[key] = value
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Comprehensive enum normalization for all enum types
 * Maps common variations to valid enum values
 */
function normalizeEnumValue(field: string, value: string | number): string {
  if (typeof value !== "string") {
    return String(value);
  }

  const lowerValue = value.toLowerCase().trim();

  // Category enum normalization (8 valid values)
  const categoryMap: Record<string, string> = {
    // Map descriptive sub-categories to parent categories
    pattern_interrupts: "core_concepts",
    dopamine_engagement: "core_concepts",
    retention_psychology: "core_concepts",
    narrative_techniques: "scripting",
    visual_cues: "scripting",
    av_format: "scripting",
    kinetic_typography: "visual_editing",
    pacing_rhythm: "visual_editing",
    spatial_dynamics: "visual_editing",
    transitions: "visual_editing",
    mixing_techniques: "audio_design",
    music_stems: "audio_design",
    sound_layers: "audio_design",
    title_optimization: "seo_metadata",
    description_engineering: "seo_metadata",
    technical_metadata: "seo_metadata",
    compliance_guidelines: "seo_metadata",
    hormozi_style: "style_guides",
    lemmino_style: "style_guides",
    high_energy_style: "style_guides",
    vox_style: "style_guides",
    workflow_templates: "tools_workflows",
    software_comparison: "tools_workflows",
    retention_checklist: "checklists",
    seo_checklist: "checklists",
    // Normalize spacing/casing variations
    "core concepts": "core_concepts",
    "core-concepts": "core_concepts",
    "visual editing": "visual_editing",
    "visual-editing": "visual_editing",
    "audio design": "audio_design",
    "audio-design": "audio_design",
    "seo metadata": "seo_metadata",
    "seo-metadata": "seo_metadata",
    "style guides": "style_guides",
    "style-guides": "style_guides",
    "tools workflows": "tools_workflows",
    "tools-workflows": "tools_workflows",
  };

  // Severity enum normalization (4 valid values)
  const severityMap: Record<string, string> = {
    high: "critical",
    urgent: "critical",
    severe: "critical",
    critical: "critical",
    medium: "major",
    moderate: "major",
    important: "major",
    major: "major",
    low: "minor",
    minor: "minor",
    info: "suggestion",
    informational: "suggestion",
    optional: "suggestion",
    suggestion: "suggestion",
  };

  // Audio issue type enum normalization (4 valid values)
  const audioIssueTypeMap: Record<string, string> = {
    sfx: "missing_sfx",
    "sound effects": "missing_sfx",
    "missing sfx": "missing_sfx",
    missing_sfx: "missing_sfx",
    silence: "silence",
    "dead air": "silence",
    pause: "silence",
    imbalance: "imbalance",
    "mix balance": "imbalance",
    "audio balance": "imbalance",
    "music timing": "music_timing",
    music_timing: "music_timing",
    music: "music_timing",
    "background music": "music_timing",
  };

  // Select appropriate mapping based on field name
  if (field === "category") {
    return categoryMap[lowerValue] || value;
  } else if (field === "severity") {
    return severityMap[lowerValue] || value;
  } else if (field === "type" || field === "audioIssueType") {
    return audioIssueTypeMap[lowerValue] || value;
  }

  return value;
}

// normalizeSeverity kept for backward compatibility but now uses normalizeEnumValue internally

/**
 * Enforce array size limits based on known constraints
 */
function enforceArraySizes(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(enforceArraySizes);
  }

  const result: Record<string, unknown> = {};
  const arrayLimits: Record<string, number> = {
    priorityActions: 3,
    strengths: 5,
    topInsights: 3,
  };

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (Array.isArray(value) && arrayLimits[key]) {
      const limit = arrayLimits[key];
      if (value.length > limit) {
        logger.debug(`Truncating array '${key}' from ${value.length} to ${limit}`);
        result[key] = value.slice(0, limit).map(enforceArraySizes);
      } else {
        result[key] = value.map(enforceArraySizes);
      }
    } else if (typeof value === "object" && value !== null) {
      result[key] = enforceArraySizes(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Add default values for missing required fields
 */
function addRequiredDefaults(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(addRequiredDefaults);
  }

  const result: Record<string, unknown> = { ...(obj as Record<string, unknown>) };

  // Required fields with defaults
  const requiredArrays = ["strengths", "priorityActions", "issues", "topInsights"];
  const requiredNumbers = ["overallScore"];

  for (const field of requiredArrays) {
    if (result[field] === undefined || result[field] === null) {
      result[field] = [];
      logger.debug(`Added empty array default for '${field}'`);
    }
  }

  for (const field of requiredNumbers) {
    if (result[field] === undefined || result[field] === null) {
      result[field] = 0.5; // Default middle score
      logger.debug(`Added default number for '${field}'`);
    }
  }

  // Recursively process nested objects
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = addRequiredDefaults(value);
    }
  }

  return result;
}

/**
 * Parse and validate Gemini JSON response against a Zod schema
 *
 * @param responseText - Raw response text from Gemini
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated response
 * @throws Error if parsing or validation fails
 */
export function parseAndValidateResponse<T extends z.ZodTypeAny>(
  responseText: string,
  schema: T
): z.infer<T> {
  logger.debug("Starting response parsing", {
    responseLength: responseText.length,
    schemaName: schema.constructor.name,
  });

  // Step 1: Parse JSON with error recovery
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
    logger.debug("JSON parsing successful", {
      parsedType: typeof parsed,
      hasKeys:
        typeof parsed === "object" && parsed !== null ? Object.keys(parsed).join(", ") : "N/A",
    });
  } catch (parseError) {
    logger.error("JSON parsing failed, attempting recovery", {
      error: parseError instanceof Error ? parseError.message : "Unknown",
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 500),
    });

    // Try to fix common JSON issues
    const fixedText = fixMalformedJSON(responseText);
    try {
      parsed = JSON.parse(fixedText);
      logger.warn("JSON parsing succeeded after recovery", {
        originalError: parseError instanceof Error ? parseError.message : "Unknown",
      });
    } catch (recoveryError) {
      logger.error("JSON recovery failed", {
        error: recoveryError instanceof Error ? recoveryError.message : "Unknown",
        fixedPreview: fixedText.substring(0, 500),
      });
      throw new Error(
        `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
      );
    }
  }

  // Step 2: Normalize response to fix common Gemini mistakes
  logger.debug("Normalizing Gemini response");
  let normalized = normalizeGeminiResponse(parsed);

  if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
    logger.debug("Response was normalized for enum/structure issues");
  }

  // Step 2.5: Enforce array size limits
  logger.debug("Enforcing array size limits");
  normalized = enforceArraySizes(normalized);

  // Step 2.6: Add defaults for missing required fields
  logger.debug("Adding defaults for missing required fields");
  normalized = addRequiredDefaults(normalized);

  // Step 3: Validate against schema
  logger.debug("Starting schema validation", {
    schemaName: schema.constructor.name,
    parsedType: typeof normalized,
  });

  const result = schema.safeParse(normalized);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
      code: e.code,
    }));

    logger.error("Schema validation failed", {
      errorCount: errors.length,
      errors: errors,
      parsedStructure:
        typeof normalized === "object" && normalized !== null ? Object.keys(normalized) : "N/A",
      parsedSample: JSON.stringify(normalized).substring(0, 500),
      schemaName: schema.constructor.name,
    });

    const errorMessages = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    throw new Error(`Response validation failed: ${errorMessages}`);
  }

  logger.info("Response validation successful", {
    schemaName: schema.constructor.name,
    validatedFields:
      typeof result.data === "object" && result.data !== null
        ? Object.keys(result.data).join(", ")
        : "N/A",
  });

  return result.data;
}

/**
 * Fix common JSON formatting issues in Gemini responses
 */
function fixMalformedJSON(text: string): string {
  // Remove trailing commas before closing brackets/braces
  let fixed = text.replace(/,(\s*[}\]])/g, "$1");

  // Fix unquoted keys (common in some AI responses)
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Fix single quotes to double quotes
  fixed = fixed.replace(/'/g, '"');

  // Fix missing commas between array items
  fixed = fixed.replace(/("]"\s*|[a-zA-Z0-9_]+\s*})\s*([a-zA-Z_][a-zA-Z0-9_]*)/g, "$1,\n$2");

  return fixed;
}
