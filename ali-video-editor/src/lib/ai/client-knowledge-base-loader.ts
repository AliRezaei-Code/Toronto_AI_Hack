/**
 * Client-side knowledge base loader
 * Calls API endpoints instead of using Node.js modules directly
 */

// Types copied from server-side for client use
interface KnowledgeBaseMeta {
  title: string;
  category: string;
  version: string;
  lastUpdated: string;
  dependencies?: string[];
}

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

const CATEGORY_DIRS = {
  core_concepts: "01_core_concepts",
  scripting: "02_scripting",
  visual_editing: "03_visual_editing",
  audio_design: "04_audio_design",
  seo_metadata: "05_seo_metadata",
  style_guides: "06_style_guides",
  tools_workflows: "07_tools_workflows",
  checklists: "08_checklists",
} as const;

/**
 * Client-side knowledge base loader that calls API
 */
export class ClientKnowledgeBaseLoader {
  /**
   * Load all files from a category directory via API
   */
  async loadCategory(category: keyof typeof CATEGORY_DIRS): Promise<KnowledgeBaseFile[]> {
    const response = await fetch(`/api/knowledge-base?category=${category}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to load knowledge base");
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Load all knowledge base files via API
   */
  async loadAll(): Promise<KnowledgeBaseFile[]> {
    const response = await fetch("/api/knowledge-base");

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to load knowledge base");
    }

    const result = await response.json();
    return result.data || [];
  }
}

/**
 * Format knowledge base files as context string for LLM prompts
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
export function formatAsJsonContext(files: KnowledgeBaseFile[]): Record<string, unknown>[] {
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

let clientLoaderInstance: ClientKnowledgeBaseLoader | null = null;

/**
 * Get singleton client loader instance
 */
export function getClientKnowledgeBaseLoader(): ClientKnowledgeBaseLoader {
  if (!clientLoaderInstance) {
    clientLoaderInstance = new ClientKnowledgeBaseLoader();
  }
  return clientLoaderInstance;
}
