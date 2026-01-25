/**
 * Video Copilot - Test Setup
 * Global test setup for Jest following SOLID principles
 */

import { TestLogger } from "@/test-config/test-logger";
import "@testing-library/jest-dom";

// Initialize test logger
const testLogger = TestLogger.getInstance();

// Global test timeout
jest.setTimeout(10000);

// Note: TestLogger is available for tests but we don't override console
// to avoid TypeScript issues. Tests can use testLogger directly if needed.

// Setup global error handlers
process.on("unhandledRejection", (reason, promise) => {
  testLogger.error("Unhandled Rejection", { reason, promise });
});

process.on("uncaughtException", (error) => {
  testLogger.error("Uncaught Exception", { error });
});

// Mock environment variables for tests
// Note: NODE_ENV is set by Jest, TEST_MODE is custom
if (!process.env.TEST_MODE) {
  process.env.TEST_MODE = "true";
}

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  testLogger.clearTestContext();
});

// Clean up after all tests
afterAll(async () => {
  await testLogger.flush();
  testLogger.info("Test suite completed");
});
