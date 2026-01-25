/**
 * Knowledge Base Loader
 *
 * Utility for loading LLM knowledge base JSON files as context for Gemini prompts.
 * Follows single responsibility principle - only handles loading and formatting.
 *
 * NOTE: This module uses Node.js fs APIs and should only be used server-side.
 * Webpack is configured to provide false fallback for client-side bundling.
 *
 * @module knowledge-base-loader
 */

import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../logger";

// ============================================================================
// Types
// ============================================================================

/**
 * Knowledge base file metadata structure
 */
interface KnowledgeBaseMeta {
  title: string;
  category: string;
  version: string;
  lastUpdated: string;
  dependencies?: string[];
}

/**
 * Knowledge base file structure
 */
interface KnowledgeBaseFile {
  meta: KnowledgeBaseMeta;
  summary: string;
  core_principles?: Array<{
    principle: string;
    description: string;
    importance: string;
  }>;
  techniques?: Array<{
    name: string;
    description: string;
    implementation?: string[];
    timing?: string;
    examples?: string[];
  }>;
  data_structures?: Record<string, unknown>;
  references?: Array<{
    source: string;
    url: string;
    relevance: string;
  }>;
}

/**
 * Category directory mapping
 */
const CATEGORY_DIRS: Record<string, string> = {
  core_concepts: "01_core_concepts",
  scripting: "02_scripting",
  visual_editing: "03_visual_editing",
  audio_design: "04_audio_design",
  seo_metadata: "05_seo_metadata",
  style_guides: "06_style_guides",
  tools_workflows: "07_tools_workflows",
  checklists: "08_checklists",
};

// ============================================================================
// Knowledge Base Loader Class
// ============================================================================

/**
 * Loader for LLM knowledge base files
 * Implements caching for performance and dependency resolution for completeness
 */
export class KnowledgeBaseLoader {
  private readonly basePath: string;
  private readonly cache: Map<string, KnowledgeBaseFile> = new Map();

  constructor(basePath?: string) {
    // Default to project's LLM_knowledge_Base directory
    this.basePath =
      basePath || path.join(process.cwd(), "LLM_knowledge_Base");
  }

  /**
   * Load all files from a category directory
   */
  async loadCategory(
    category: keyof typeof CATEGORY_DIRS
  ): Promise<KnowledgeBaseFile[]> {
    const dirName = CATEGORY_DIRS[category];
    if (!dirName) {
      logger.warn("Unknown category requested", { category });
      return [];
    }

    const categoryPath = path.join(this.basePath, dirName);

    try {
      const files = await fs.readdir(categoryPath);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      const results: KnowledgeBaseFile[] = [];
      for (const file of jsonFiles) {
        const loaded = await this.loadFile(path.join(categoryPath, file));
        if (loaded) {
          results.push(loaded);
        }
      }

      logger.info("Loaded category files", {
        category,
        fileCount: results.length,
      });
      return results;
    } catch (error) {
      logger.error("Failed to load category", {
        category,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }

  /**
   * Load a specific file with its dependencies
   */
  async loadWithDependencies(filePath: string): Promise<KnowledgeBaseFile[]> {
    const results: KnowledgeBaseFile[] = [];
    const visited = new Set<string>();

    const loadRecursive = async (currentPath: string): Promise<void> => {
      if (visited.has(currentPath)) {
        return;
      }
      visited.add(currentPath);

      const file = await this.loadFile(currentPath);
      if (!file) {
        return;
      }

      results.push(file);

      // Load dependencies
      if (file.meta.dependencies) {
        for (const dep of file.meta.dependencies) {
          const depPath = await this.resolveDependencyPath(currentPath, dep);
          if (depPath) {
            await loadRecursive(depPath);
          }
        }
      }
    };

    await loadRecursive(filePath);
    return results;
  }

  /**
   * Load a single JSON file with caching
   */
  private async loadFile(filePath: string): Promise<KnowledgeBaseFile | null> {
    // Check cache first
    const cached = this.cache.get(filePath);
    if (cached) {
      return cached;
    }

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(content) as KnowledgeBaseFile;
      this.cache.set(filePath, parsed);
      return parsed;
    } catch (error) {
      logger.error("Failed to load knowledge base file", {
        filePath,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Resolve a dependency filename to its full path
   */
  private async resolveDependencyPath(
    currentPath: string,
    dependencyName: string
  ): Promise<string | null> {
    // First try same directory
    const sameDir = path.join(path.dirname(currentPath), dependencyName);
    if (await this.fileExists(sameDir)) {
      return sameDir;
    }

    // Search in all category directories
    for (const dirName of Object.values(CATEGORY_DIRS)) {
      const searchPath = path.join(this.basePath, dirName, dependencyName);
      if (await this.fileExists(searchPath)) {
        return searchPath;
      }
    }

    logger.warn("Could not resolve dependency", {
      dependency: dependencyName,
      fromFile: currentPath,
    });
    return null;
  }

  /**
   * Check if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear the cache (useful for testing or hot-reloading)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Context Formatting Functions
// ============================================================================

/**
 * Format knowledge base files as context string for LLM prompts
 * Optimized for token efficiency while maintaining information density
 */
export function formatAsPromptContext(files: KnowledgeBaseFile[]): string {
  if (files.length === 0) {
    return "";
  }

  const sections: string[] = [];

  for (const file of files) {
    const lines: string[] = [];

    // Title and summary
    lines.push(`### ${file.meta.title}`);
    lines.push(file.summary);

    // Core principles (high priority)
    if (file.core_principles?.length) {
      lines.push("\n**Core Principles:**");
      for (const p of file.core_principles) {
        if (p.importance === "high") {
          lines.push(`- ${p.principle}: ${p.description}`);
        }
      }
    }

    // Key techniques (condensed)
    if (file.techniques?.length) {
      lines.push("\n**Key Techniques:**");
      for (const t of file.techniques.slice(0, 5)) {
        lines.push(`- ${t.name}: ${t.description}`);
      }
    }

    sections.push(lines.join("\n"));
  }

  return sections.join("\n\n---\n\n");
}

/**
 * Format as structured JSON context (for precise reference)
 */
export function formatAsJsonContext(
  files: KnowledgeBaseFile[]
): Record<string, unknown>[] {
  return files.map((file) => ({
    title: file.meta.title,
    category: file.meta.category,
    summary: file.summary,
    principles: file.core_principles?.filter((p) => p.importance === "high"),
    techniques: file.techniques?.map((t) => ({
      name: t.name,
      description: t.description,
      timing: t.timing,
    })),
  }));
}

// ============================================================================
// Singleton Instance
// ============================================================================

let loaderInstance: KnowledgeBaseLoader | null = null;

/**
 * Get singleton loader instance
 */
export function getKnowledgeBaseLoader(): KnowledgeBaseLoader {
  if (!loaderInstance) {
    loaderInstance = new KnowledgeBaseLoader();
  }
  return loaderInstance;
}

/**
 * Reset singleton (for testing)
 */
export function resetKnowledgeBaseLoader(): void {
  loaderInstance?.clearCache();
  loaderInstance = null;
}
