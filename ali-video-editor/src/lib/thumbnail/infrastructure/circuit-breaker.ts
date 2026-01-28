/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by stopping calls to failing services.
 */

import type { CIRCUIT_BREAKER_CONFIG } from "../domain";

// ============================================================================
// Circuit State
// ============================================================================

/**
 * Circuit breaker states
 */
export type CircuitState = "closed" | "open" | "half-open";

// ============================================================================
// Circuit Breaker Class
// ============================================================================

/**
 * Circuit breaker implementation
 *
 * Tracks failures and opens the circuit when threshold is reached.
 * After timeout, attempts to close the circuit with trial requests.
 */
export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  constructor(
    private readonly name: string,
    private readonly failureThreshold: number,
    private readonly resetTimeoutMs: number
  ) {}

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is open (blocking requests)
   */
  isOpen(): boolean {
    if (this.state === "open") {
      // Check if reset timeout has elapsed
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = "half-open";
        this.successCount = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    this.failures = 0;

    if (this.state === "half-open") {
      this.successCount++;
      // After 2 successful attempts in half-open, close the circuit
      if (this.successCount >= 2) {
        this.state = "closed";
      }
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = "open";
    }
  }

  /**
   * Reset circuit to closed state
   */
  reset(): void {
    this.state = "closed";
    this.failures = 0;
    this.lastFailureTime = 0;
    this.successCount = 0;
  }

  /**
   * Get statistics
   */
  getStats(): {
    state: CircuitState;
    failures: number;
    lastFailureTime: number;
    successCount: number;
  } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount,
    };
  }

  /**
   * Get circuit breaker name
   */
  getName(): string {
    return this.name;
  }
}

// ============================================================================
// Circuit Breaker Factory
// ============================================================================

/**
 * Factory for creating circuit breakers with standard configuration
 */
export class CircuitBreakerFactory {
  private static instances: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker for a provider
   */
  static getOrCreate(name: string, config: typeof CIRCUIT_BREAKER_CONFIG): CircuitBreaker {
    if (!this.instances.has(name)) {
      const circuitBreaker = new CircuitBreaker(
        name,
        config.FAILURE_THRESHOLD,
        config.RESET_TIMEOUT_MS
      );
      this.instances.set(name, circuitBreaker);
    }
    return this.instances.get(name) as CircuitBreaker;
  }

  /**
   * Reset all circuit breakers
   */
  static resetAll(): void {
    this.instances.forEach((cb) => cb.reset());
  }

  /**
   * Get all circuit breaker stats
   */
  static getAllStats(): Array<{ name: string; stats: ReturnType<CircuitBreaker["getStats"]> }> {
    return Array.from(this.instances.entries()).map(([name, cb]) => ({
      name,
      stats: cb.getStats(),
    }));
  }
}
