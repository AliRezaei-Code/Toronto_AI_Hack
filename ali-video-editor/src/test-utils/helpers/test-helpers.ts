/**
 * Video Copilot - Test Helpers
 * Reusable helper functions for testing following DRY principles
 */

import { TestLogger } from "@/test-config/test-logger";
import { MockGeminiService, createMockGeminiService } from "@/test-utils/mocks/gemini-service.mock";
import { MockLogger, createMockLogger } from "@/test-utils/mocks/logger.mock";

/**
 * Performance tracking helper
 */
export class PerformanceTracker {
  private startTime: number = 0;
  private endTime: number = 0;

  /**
   * Start tracking performance
   */
  public start(): void {
    this.startTime = Date.now();
  }

  /**
   * Stop tracking and return duration
   */
  public stop(): number {
    this.endTime = Date.now();
    return this.getDuration();
  }

  /**
   * Get elapsed time in milliseconds
   */
  public getDuration(): number {
    return this.endTime - this.startTime || Date.now() - this.startTime;
  }

  /**
   * Assert duration is within threshold
   */
  public assertDurationBelow(thresholdMs: number): void {
    const duration = this.getDuration();
    if (duration > thresholdMs) {
      throw new Error(`Performance threshold exceeded: ${duration}ms > ${thresholdMs}ms`);
    }
  }
}

/**
 * Async helper utilities
 */
export class AsyncHelper {
  /**
   * Wait for specified milliseconds
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry async operation with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 100
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await this.wait(delayMs * Math.pow(2, i));
        }
      }
    }

    throw lastError || new Error("Retry failed");
  }

  /**
   * Poll until condition is met
   */
  static async poll(
    condition: () => boolean,
    timeoutMs: number = 5000,
    intervalMs: number = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (condition()) {
        return;
      }
      await this.wait(intervalMs);
    }

    throw new Error(`Polling timeout after ${timeoutMs}ms`);
  }
}

/**
 * Assertion helpers
 */
export class AssertionHelper {
  /**
   * Assert object has required properties
   */
  static hasRequiredProperties<T extends object>(obj: T, requiredProps: (keyof T)[]): void {
    requiredProps.forEach((prop) => {
      if (!(prop in obj)) {
        throw new Error(`Missing required property: ${String(prop)}`);
      }
    });
  }

  /**
   * Assert array length is within range
   */
  static arrayLengthInRange<T>(arr: T[], min: number, max: number): void {
    if (arr.length < min || arr.length > max) {
      throw new Error(`Array length ${arr.length} not in range [${min}, ${max}]`);
    }
  }

  /**
   * Assert number is within range
   */
  static numberInRange(value: number, min: number, max: number): void {
    if (value < min || value > max) {
      throw new Error(`Value ${value} not in range [${min}, ${max}]`);
    }
  }

  /**
   * Assert array contains unique items
   */
  static arrayContainsUnique<T>(arr: T[]): void {
    const unique = new Set(arr);
    if (unique.size !== arr.length) {
      throw new Error("Array contains duplicate items");
    }
  }

  /**
   * Assert string matches regex pattern
   */
  static matchesPattern(str: string, pattern: RegExp): void {
    if (!pattern.test(str)) {
      throw new Error(`String "${str}" does not match pattern ${pattern}`);
    }
  }
}

/**
 * Mock setup helper
 */
export class MockSetupHelper {
  private static mockInstances: Map<string, any> = new Map();

  /**
   * Setup all required mocks for a test
   */
  static setupMocks(): {
    geminiService: MockGeminiService;
    logger: MockLogger;
  } {
    const geminiService = createMockGeminiService();
    const logger = createMockLogger();

    this.mockInstances.set("geminiService", geminiService);
    this.mockInstances.set("logger", logger);

    return { geminiService, logger };
  }

  /**
   * Get a mock instance by name
   */
  static getMock<T>(name: string): T | undefined {
    return this.mockInstances.get(name);
  }

  /**
   * Reset all mocks
   */
  static resetAllMocks(): void {
    this.mockInstances.forEach((mock) => {
      if (mock.reset) {
        mock.reset();
      }
    });
    this.mockInstances.clear();
  }

  /**
   * Clear all mocks
   */
  static clearAllMocks(): void {
    this.mockInstances.clear();
  }
}

/**
 * Test context manager
 */
export class TestContext {
  private testLogger: TestLogger;
  private mocks: Map<string, any> = new Map();
  private setupFunction?: () => Promise<void>;
  private teardownFunction?: () => Promise<void>;

  constructor() {
    this.testLogger = TestLogger.getInstance();
  }

  /**
   * Register setup function
   */
  public setup(fn: () => Promise<void>): void {
    this.setupFunction = fn;
  }

  /**
   * Register teardown function
   */
  public teardown(fn: () => Promise<void>): void {
    this.teardownFunction = fn;
  }

  /**
   * Add a mock to the context
   */
  public addMock(name: string, mock: any): void {
    this.mocks.set(name, mock);
  }

  /**
   * Get a mock by name
   */
  public getMock<T>(name: string): T | undefined {
    return this.mocks.get(name);
  }

  /**
   * Run test with setup and teardown
   */
  public async run(testFn: () => Promise<void>): Promise<void> {
    const testName = expect.getState().currentTestName || "unknown";

    try {
      // Run setup
      if (this.setupFunction) {
        await this.setupFunction();
      }

      // Log test start
      this.testLogger.logTestStart(testName);

      // Run test
      await testFn();

      // Log test success
      this.testLogger.logTestEnd(testName, true, 0);
    } catch (error) {
      // Log test failure
      this.testLogger.logTestEnd(testName, false, 0);
      this.testLogger.error("Test failed", { error });
      throw error;
    } finally {
      // Run teardown
      if (this.teardownFunction) {
        await this.teardownFunction();
      }
    }
  }
}

/**
 * Data validation helper
 */
export class ValidationHelper {
  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate URL format
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate date is in the past
   */
  static isPastDate(date: Date): boolean {
    return new Date(date) < new Date();
  }

  /**
   * Validate date is in the future
   */
  static isFutureDate(date: Date): boolean {
    return new Date(date) > new Date();
  }
}
