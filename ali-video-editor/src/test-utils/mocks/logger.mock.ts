/**
 * Video Copilot - Logger Mock
 * Manual mock implementation for testing
 */

/**
 * Logger Interface
 * Defines the contract for logger implementations
 */
export interface ILogger {
  info(message: string, metadata?: any): void;
  warn(message: string, metadata?: any): void;
  error(message: string, metadata?: any): void;
  debug(message: string, metadata?: any): void;
}

/**
 * Mock Logger
 * Configurable mock implementation for testing
 */
export class MockLogger implements ILogger {
  private logs: Array<{ level: string; message: string; metadata?: any }> = [];
  private shouldThrow: boolean = false;

  /**
   * Configure mock behavior
   */
  public configure(options: { shouldThrow?: boolean } = {}): void {
    this.shouldThrow = options.shouldThrow || false;
  }

  /**
   * Log info message
   */
  public info(message: string, metadata?: any): void {
    if (this.shouldThrow) {
      throw new Error("Mock logger error");
    }
    this.logs.push({ level: "info", message, metadata });
  }

  /**
   * Log warning message
   */
  public warn(message: string, metadata?: any): void {
    if (this.shouldThrow) {
      throw new Error("Mock logger error");
    }
    this.logs.push({ level: "warn", message, metadata });
  }

  /**
   * Log error message
   */
  public error(message: string, metadata?: any): void {
    if (this.shouldThrow) {
      throw new Error("Mock logger error");
    }
    this.logs.push({ level: "error", message, metadata });
  }

  /**
   * Log debug message
   */
  public debug(message: string, metadata?: any): void {
    if (this.shouldThrow) {
      throw new Error("Mock logger error");
    }
    this.logs.push({ level: "debug", message, metadata });
  }

  /**
   * Get all logged messages
   */
  public getLogs(): Array<{ level: string; message: string; metadata?: any }> {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: string): Array<{ level: string; message: string; metadata?: any }> {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear all logs
   */
  public clear(): void {
    this.logs = [];
  }

  /**
   * Reset mock configuration
   */
  public reset(): void {
    this.shouldThrow = false;
    this.clear();
  }
}

/**
 * Create a configured mock instance
 */
export function createMockLogger(options: { shouldThrow?: boolean } = {}): MockLogger {
  const mock = new MockLogger();
  mock.configure(options);
  return mock;
}

/**
 * Default mock instance
 */
export const mockLogger = createMockLogger();
