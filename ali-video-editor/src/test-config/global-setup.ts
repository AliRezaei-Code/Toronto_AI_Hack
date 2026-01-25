/**
 * Video Copilot - Global Test Setup
 * Runs once before all test suites
 */

export default async function globalSetup() {
  // Set test environment variables
  process.env.TEST_MODE = "true";
}
