/**
 * Video Copilot - Gemini Service Mock
 * Manual mock implementation following SOLID principles
 */

import { AppError, AppErrorType } from "@/types";

/**
 * Gemini Service Interface
 * Defines the contract that both real and mock implementations must follow
 */
export interface IGeminiService {
  analyzeCategory(category: string, data: any): Promise<any>;
  getModel(): Promise<any>;
}

/**
 * Mock Gemini Service
 * Configurable mock implementation for testing
 */
export class MockGeminiService implements IGeminiService {
  private shouldReject: boolean = false;
  private rejectWith?: Error;
  private delay: number = 0;
  private customResponses: Map<string, any> = new Map();

  /**
   * Configure mock behavior
   */
  public configure(options: {
    shouldReject?: boolean;
    rejectWith?: Error;
    delay?: number;
    customResponses?: Record<string, any>;
  }): void {
    this.shouldReject = options.shouldReject || false;
    this.rejectWith = options.rejectWith;
    this.delay = options.delay || 0;

    if (options.customResponses) {
      Object.entries(options.customResponses).forEach(([key, value]) => {
        this.customResponses.set(key, value);
      });
    }
  }

  /**
   * Analyze category (mock implementation)
   */
  public async analyzeCategory(category: string, data: any): Promise<any> {
    await this.applyDelay();

    if (this.shouldReject) {
      throw (
        this.rejectWith ||
        new AppError(AppErrorType.AI_INSIGHTS_FAILED, "Mock Gemini service error")
      );
    }

    // Return custom response if configured
    const key = `${category}-${data.videoId}`;
    if (this.customResponses.has(key)) {
      return this.customResponses.get(key);
    }

    // Return default mock response based on category
    return this.getDefaultResponse(category, data);
  }

  /**
   * Get model (mock implementation)
   */
  public async getModel(): Promise<any> {
    await this.applyDelay();

    if (this.shouldReject) {
      throw this.rejectWith || new AppError(AppErrorType.AI_INSIGHTS_FAILED, "Mock model error");
    }

    return {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue("Mock AI generated content"),
        },
      }),
    };
  }

  /**
   * Reset mock configuration
   */
  public reset(): void {
    this.shouldReject = false;
    this.rejectWith = undefined;
    this.delay = 0;
    this.customResponses.clear();
  }

  /**
   * Apply configured delay
   */
  private async applyDelay(): Promise<void> {
    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }
  }

  /**
   * Get default mock response for category
   */
  private getDefaultResponse(category: string, _data: any): any {
    switch (category) {
      case "scripting":
        return {
          issues: [
            {
              title: "Add Compelling Hook",
              recommendation:
                "Start with a strong hook to grab viewer attention in the first 30 seconds",
              category: "scripting",
              timestamp: { start: 0, end: 30 },
              confidence: 0.85,
            },
            {
              title: "Remove Filler Words",
              recommendation: "Eliminate unnecessary filler words for clearer communication",
              category: "scripting",
              timestamp: { start: 120, end: 150 },
              confidence: 0.78,
            },
          ],
        };

      case "visual_editing":
        return {
          issues: [
            {
              title: "Add Visual Overlays",
              recommendation: "Add text overlays at key moments to emphasize important points",
              category: "visual_editing",
              timestamp: { start: 60, end: 90 },
              confidence: 0.82,
            },
            {
              title: "Include Transitions",
              recommendation: "Add smooth transitions between different sections",
              category: "visual_editing",
              timestamp: { start: 180, end: 210 },
              confidence: 0.75,
            },
          ],
        };

      case "core_concepts":
        return {
          issues: [
            {
              title: "Maintain Proper Pacing",
              recommendation: "Keep consistent pacing throughout to maintain viewer engagement",
              category: "core_concepts",
              timestamp: { start: 90, end: 120 },
              confidence: 0.8,
            },
            {
              title: "Add Break Points",
              recommendation: "Include brief pauses or breaks to prevent viewer fatigue",
              category: "core_concepts",
              timestamp: { start: 240, end: 270 },
              confidence: 0.77,
            },
          ],
        };

      default:
        return {
          issues: [],
        };
    }
  }
}

/**
 * Create a configured mock instance
 */
export function createMockGeminiService(
  options: {
    shouldReject?: boolean;
    rejectWith?: Error;
    delay?: number;
    customResponses?: Record<string, any>;
  } = {}
): MockGeminiService {
  const mock = new MockGeminiService();
  mock.configure(options);
  return mock;
}

/**
 * Default mock instance
 */
export const mockGeminiService = createMockGeminiService();
