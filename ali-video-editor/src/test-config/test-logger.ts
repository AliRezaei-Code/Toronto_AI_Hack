/**
 * Video Copilot - Test Logger
 * Comprehensive test-specific logging with performance tracking
 */

interface TestLogEntry {
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  metadata?: any;
  testName?: string;
}

interface TestMetrics {
  testName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  passed: boolean;
  memoryUsage?: NodeJS.MemoryUsage;
}

export class TestLogger {
  private static instance: TestLogger;
  private logs: TestLogEntry[] = [];
  private metrics: TestMetrics[] = [];
  private currentTestName: string = "";

  private constructor() {}

  public static getInstance(): TestLogger {
    if (!TestLogger.instance) {
      TestLogger.instance = new TestLogger();
    }
    return TestLogger.instance;
  }

  /**
   * Log test start with correlation ID
   */
  public logTestStart(testName: string, metadata?: any): void {
    this.currentTestName = testName;
    const startTime = Date.now();

    this.info(`Test started: ${testName}`, {
      ...metadata,
      correlationId: this.generateCorrelationId(),
    });

    this.metrics.push({
      testName,
      startTime,
      passed: true,
      memoryUsage: process.memoryUsage(),
    });
  }

  /**
   * Log test end with performance metrics
   */
  public logTestEnd(testName: string, passed: boolean, duration: number): void {
    const metric = this.metrics.find((m) => m.testName === testName);
    if (metric) {
      metric.endTime = Date.now();
      metric.duration = duration;
      metric.passed = passed;
      metric.memoryUsage = process.memoryUsage();
    }

    this.info(`Test ${passed ? "passed" : "failed"}: ${testName}`, {
      duration: `${duration}ms`,
      memoryUsed: `${metric?.memoryUsage?.heapUsed || 0} bytes`,
    });

    // Check performance threshold
    if (duration > 100) {
      this.warn(`Performance warning: Test took ${duration}ms (>100ms)`, {
        testName,
      });
    }
  }

  /**
   * Log performance metrics
   */
  public logPerformance(metric: string, value: number, threshold?: number): void {
    this.info(`Performance metric: ${metric} = ${value}ms`, {
      threshold: threshold ? `${threshold}ms` : undefined,
      status: threshold && value > threshold ? "above_threshold" : "within_threshold",
    });

    if (threshold && value > threshold) {
      this.warn(`Performance threshold exceeded: ${metric} (${value}ms > ${threshold}ms)`);
    }
  }

  /**
   * Info level logging
   */
  public info(message: string, metadata?: any): void {
    this.addLog("info", message, metadata);
  }

  /**
   * Warning level logging
   */
  public warn(message: string, metadata?: any): void {
    this.addLog("warn", message, metadata);
  }

  /**
   * Error level logging
   */
  public error(message: string, metadata?: any): void {
    this.addLog("error", message, metadata);
  }

  /**
   * Debug level logging
   */
  public debug(message: string, metadata?: any): void {
    if (process.env.DEBUG_TESTS === "true") {
      this.addLog("debug", message, metadata);
    }
  }

  /**
   * Add log entry
   */
  private addLog(
    level: "info" | "warn" | "error" | "debug",
    message: string,
    metadata?: any
  ): void {
    this.logs.push({
      timestamp: Date.now(),
      level,
      message,
      metadata,
      testName: this.currentTestName,
    });
  }

  /**
   * Generate correlation ID for tracking
   */
  private generateCorrelationId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Clear test context
   */
  public clearTestContext(): void {
    this.currentTestName = "";
  }

  /**
   * Get all logs
   */
  public getLogs(): TestLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get test metrics
   */
  public getMetrics(): TestMetrics[] {
    return [...this.metrics];
  }

  /**
   * Flush logs to console (for CI/CD analysis)
   */
  public async flush(): Promise<void> {
    if (process.env.CI === "true") {
      console.log("\n=== Test Execution Summary ===");
      console.log(`Total tests: ${this.metrics.length}`);
      console.log(`Passed: ${this.metrics.filter((m) => m.passed).length}`);
      console.log(`Failed: ${this.metrics.filter((m) => !m.passed).length}`);

      const avgDuration =
        this.metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / this.metrics.length;
      console.log(`Average duration: ${avgDuration.toFixed(2)}ms`);

      console.log("\n=== Performance Threshold Violations ===");
      const slowTests = this.metrics.filter((m) => m.duration && m.duration > 100);
      if (slowTests.length > 0) {
        slowTests.forEach((test) => {
          console.log(`⚠️  ${test.testName}: ${test.duration}ms`);
        });
      } else {
        console.log("✅ All tests within performance thresholds");
      }
    }
  }

  /**
   * Get log summary for CI/CD
   */
  public getSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageDuration: number;
    slowTests: Array<{ testName: string; duration: number }>;
  } {
    return {
      totalTests: this.metrics.length,
      passedTests: this.metrics.filter((m) => m.passed).length,
      failedTests: this.metrics.filter((m) => !m.passed).length,
      averageDuration:
        this.metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / this.metrics.length,
      slowTests: this.metrics
        .filter((m) => m.duration && m.duration > 100)
        .map((m) => ({ testName: m.testName, duration: m.duration || 0 })),
    };
  }
}
