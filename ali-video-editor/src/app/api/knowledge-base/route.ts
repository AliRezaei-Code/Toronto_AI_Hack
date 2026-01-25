/**
 * API route for loading knowledge base files
 * Handles server-side file system access
 */

import { NextRequest, NextResponse } from "next/server";
import {
  KnowledgeBaseLoader,
  formatAsJsonContext,
  formatAsPromptContext,
} from "../../../lib/ai/knowledge-base-loader";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as keyof typeof CATEGORY_DIRS | null;
    const format = searchParams.get("format") || "prompt";

    const loader = new KnowledgeBaseLoader();

    let files;
    if (category) {
      files = await loader.loadCategory(category);
    } else {
      // Load all categories
      const allFiles = [];
      const categories = Object.keys(CATEGORY_DIRS) as Array<keyof typeof CATEGORY_DIRS>;
      for (const cat of categories) {
        const catFiles = await loader.loadCategory(cat);
        allFiles.push(...catFiles);
      }
      files = allFiles;
    }

    let result;
    if (format === "json") {
      result = formatAsJsonContext(files);
    } else {
      result = formatAsPromptContext(files);
    }

    return NextResponse.json({ data: result, count: files.length });
  } catch (error) {
    console.error("Knowledge base loading error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
