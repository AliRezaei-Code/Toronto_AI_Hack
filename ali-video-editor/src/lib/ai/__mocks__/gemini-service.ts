/**
 * Mock for Gemini Service
 */

import { createMockGeminiService } from "@/test-utils/mocks";

// Create mock instance
const mockInstance = createMockGeminiService();

// Export the mock as the singleton
export const geminiService = mockInstance;

// Also export the class for testing
export type * from "../gemini-service";
export { GeminiService } from "../gemini-service";
