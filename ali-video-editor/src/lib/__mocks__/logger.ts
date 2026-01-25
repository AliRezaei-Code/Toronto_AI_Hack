/**
 * Mock for Logger
 */

import { createMockLogger } from "@/test-utils/mocks";

// Create mock instance
const mockInstance = createMockLogger();

// Export the mock as the singleton
export const logger = mockInstance;

// Also export types for testing
export type * from "../logger";
