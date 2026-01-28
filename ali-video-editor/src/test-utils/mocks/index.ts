/**
 * Video Copilot - Test Mocks Index
 * Centralized exports for all mock services
 */

export {
  createMockGeminiService,
  MockGeminiService,
  mockGeminiService,
  type IGeminiService,
} from "./gemini-service.mock";
export { createMockLogger, MockLogger, mockLogger, type ILogger } from "./logger.mock";
export {
  createMockSEOPromptBuilder,
  MockSEOPromptBuilder,
  mockSEOPromptBuilder,
  type ISEOPromptBuilder,
} from "./seo-prompt-builder.mock";
