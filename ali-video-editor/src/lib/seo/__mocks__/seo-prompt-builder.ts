/**
 * Mock for SEO Prompt Builder
 */

import { createMockSEOPromptBuilder } from "@/test-utils/mocks";

// Create mock instance
const mockInstance = createMockSEOPromptBuilder();

// Export the mock as the singleton
export const seoPromptBuilder = mockInstance;

// Also export types for testing
export type * from "../seo-prompt-builder";
