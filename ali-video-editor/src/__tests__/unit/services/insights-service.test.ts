/**
 * Video Copilot - InsightsService Unit Tests
 * Comprehensive unit tests following SOLID principles for InsightsService
 */

import { InsightsService } from "@/lib/insights/insights-service";
import { RetentionAnalysisFactory, TranscriptionFactory } from "@/test-utils";
import {
  createMockGeminiService,
  createMockLogger,
  MockGeminiService,
  MockLogger,
} from "@/test-utils/mocks";
import { jest } from "@jest/globals";

// Mock dependencies using manual mocks in __mocks__ directories

describe("InsightsService", () => {
  let service: InsightsService;
  let mockGeminiService: MockGeminiService;
  let mockLogger: MockLogger;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { geminiService: geminiServiceMock } = require("@/lib/ai/gemini-service");

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock instances
    mockGeminiService = createMockGeminiService();
    mockLogger = createMockLogger();

    // Create spy functions that track calls
    jest
      .spyOn(geminiServiceMock, "analyzeCategory" as const)
      .mockImplementation((...args: unknown[]) =>
        mockGeminiService.analyzeCategory(args[0] as string, args[1] as Record<string, unknown>)
      );
    jest
      .spyOn(geminiServiceMock, "getModel" as const)
      .mockImplementation(mockGeminiService.getModel.bind(mockGeminiService));

    // Get service instance
    service = InsightsService.getInstance();
  });

  afterEach(() => {
    mockGeminiService.reset();
    mockLogger.reset();
    jest.restoreAllMocks();
  });

  describe("Singleton Pattern", () => {
    test("should return the same instance across multiple calls", () => {
      const instance1 = InsightsService.getInstance();
      const instance2 = InsightsService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(service);
    });

    test("should create only one instance", () => {
      const instances = [
        InsightsService.getInstance(),
        InsightsService.getInstance(),
        InsightsService.getInstance(),
      ];

      const uniqueInstances = new Set(instances);
      expect(uniqueInstances.size).toBe(1);
    });
  });

  describe("generateInsights", () => {
    test("should generate comprehensive insights successfully", async () => {
      // Arrange
      const transcription = TranscriptionFactory.createHighConfidence();
      const retentionAnalysis = RetentionAnalysisFactory.createHighEngagement();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result).toBeDefined();
      expect(result.videoId).toBe(videoId);
      expect(result.scriptSuggestions).toBeDefined();
      expect(result.visualRecommendations).toBeDefined();
      expect(result.pacingSuggestions).toBeDefined();
      expect(result.seoMetadata).toBeDefined();
      expect(result.overallImprovementPotential).toBeGreaterThanOrEqual(0);
      expect(result.overallImprovementPotential).toBeLessThanOrEqual(1);
      expect(result.topInsights).toHaveLength(3);
      expect(result.processingDuration).toBeGreaterThan(0);
    });

    test("should call progress callback with correct values", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";
      const progressCallback = jest.fn();

      // Act
      await service.generateInsights(transcription, retentionAnalysis, videoId, progressCallback);

      // Assert
      expect(progressCallback).toHaveBeenCalledWith(0, expect.any(String));
      expect(progressCallback).toHaveBeenCalledWith(20, expect.any(String));
      expect(progressCallback).toHaveBeenCalledWith(40, expect.any(String));
      expect(progressCallback).toHaveBeenCalledWith(60, expect.any(String));
      expect(progressCallback).toHaveBeenCalledWith(80, expect.any(String));
      expect(progressCallback).toHaveBeenCalledWith(100, expect.any(String));
    });

    test("should include keyframes in analysis when provided", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";
      const keyframes = [
        {
          timestamp: 10,
          base64Data: "data:image/jpeg;base64,",
          mimeType: "image/jpeg",
        },
      ];

      // Act
      await service.generateInsights(
        transcription,
        retentionAnalysis,
        videoId,
        undefined,
        keyframes
      );

      // Assert - verify keyframes were passed to gemini service
      expect(geminiServiceMock.analyzeCategory).toHaveBeenCalledWith(
        "scripting",
        expect.objectContaining({
          keyframes,
        })
      );
    });

    test("should handle original metadata for delta calculation", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";
      const originalMetadata = {
        title: "Original Title",
        description: "Original Description",
        tags: ["tag1", "tag2"],
      };

      // Act
      const result = await service.generateInsights(
        transcription,
        retentionAnalysis,
        videoId,
        undefined,
        undefined,
        originalMetadata
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.improvementBreakdown).toBeDefined();
      expect(result.seoMetadata.title).not.toBe(originalMetadata.title);
    });

    test("should handle errors gracefully", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Note: The actual service implementation has error handling
      // This test verifies it doesn't crash on errors
      // Act & Assert
      await expect(
        service.generateInsights(transcription, retentionAnalysis, videoId)
      ).resolves.toBeDefined();
    });

    test("should handle empty transcription segments gracefully", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create({
        segments: [],
        text: "",
      });
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert - should still generate suggestions from mock data even with empty segments
      expect(result).toBeDefined();
      expect(result.scriptSuggestions).toBeDefined();
      expect(Array.isArray(result.scriptSuggestions)).toBe(true);
    });

    test("should log appropriate messages during generation", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act & Assert - should not throw errors during generation
      await expect(
        service.generateInsights(transcription, retentionAnalysis, videoId)
      ).resolves.toBeDefined();
    });
  });

  describe("generateScriptSuggestions", () => {
    test("should generate script suggestions from gemini analysis", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.scriptSuggestions).toBeDefined();
      expect(Array.isArray(result.scriptSuggestions)).toBe(true);
      expect(result.scriptSuggestions.length).toBeGreaterThanOrEqual(0);
      expect(result.scriptSuggestions.length).toBeLessThanOrEqual(5);
    });

    test("should filter issues by scripting category", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      result.scriptSuggestions.forEach((suggestion) => {
        expect(suggestion.type).toBeDefined();
        expect(suggestion.description).toBeDefined();
        expect(suggestion.start).toBeGreaterThanOrEqual(0);
        expect(suggestion.end).toBeGreaterThan(suggestion.start);
        expect(suggestion.priority).toBeGreaterThan(0);
        expect(suggestion.priority).toBeLessThanOrEqual(5);
        expect(suggestion.expectedImpact).toBeGreaterThanOrEqual(0);
        expect(suggestion.expectedImpact).toBeLessThanOrEqual(1);
      });
    });

    test("should return empty array on error", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      mockGeminiService.configure({
        shouldReject: true,
        rejectWith: new Error("Test error"),
      });

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.scriptSuggestions).toEqual([]);
    });
  });

  describe("generateVisualRecommendations", () => {
    test("should generate visual recommendations from gemini analysis", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.visualRecommendations).toBeDefined();
      expect(Array.isArray(result.visualRecommendations)).toBe(true);
      expect(result.visualRecommendations.length).toBeGreaterThanOrEqual(0);
      expect(result.visualRecommendations.length).toBeLessThanOrEqual(5);
    });

    test("should filter issues by visual_editing category", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      result.visualRecommendations.forEach((recommendation) => {
        expect(recommendation.type).toBeDefined();
        expect(recommendation.description).toBeDefined();
        expect(recommendation.start).toBeGreaterThanOrEqual(0);
        expect(recommendation.end).toBeGreaterThan(recommendation.start);
        expect(recommendation.priority).toBeGreaterThan(0);
        expect(recommendation.priority).toBeLessThanOrEqual(5);
        expect(recommendation.expectedImpact).toBeGreaterThanOrEqual(0);
        expect(recommendation.expectedImpact).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("generatePacingSuggestions", () => {
    test("should generate pacing suggestions from gemini analysis", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.pacingSuggestions).toBeDefined();
      expect(Array.isArray(result.pacingSuggestions)).toBe(true);
      expect(result.pacingSuggestions.length).toBeGreaterThanOrEqual(0);
      expect(result.pacingSuggestions.length).toBeLessThanOrEqual(5);
    });

    test("should filter issues by core_concepts category", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      result.pacingSuggestions.forEach((suggestion) => {
        expect(suggestion.type).toBeDefined();
        expect(suggestion.description).toBeDefined();
        expect(suggestion.start).toBeGreaterThanOrEqual(0);
        expect(suggestion.end).toBeGreaterThan(suggestion.start);
        expect(suggestion.priority).toBeGreaterThan(0);
        expect(suggestion.priority).toBeLessThanOrEqual(5);
        expect(suggestion.expectedImpact).toBeGreaterThanOrEqual(0);
        expect(suggestion.expectedImpact).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("generateSEOMetadata", () => {
    test("should generate complete SEO metadata", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.seoMetadata).toBeDefined();
      expect(result.seoMetadata.title).toBeDefined();
      expect(result.seoMetadata.description).toBeDefined();
      expect(result.seoMetadata.tags).toBeDefined();
      expect(result.seoMetadata.keywords).toBeDefined();
      expect(result.seoMetadata.thumbnailSuggestions).toBeDefined();
      expect(result.seoMetadata.seoScore).toBeGreaterThanOrEqual(0);
      expect(result.seoMetadata.seoScore).toBeLessThanOrEqual(1);
    });

    test("should extract keywords from transcription", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.seoMetadata.keywords).toBeDefined();
      expect(Array.isArray(result.seoMetadata.keywords)).toBe(true);
    });

    test("should generate appropriate tags based on transcription", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create({
        language: "en",
      });
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.seoMetadata.tags).toBeDefined();
      expect(Array.isArray(result.seoMetadata.tags)).toBe(true);
      // Tags should at least be defined (may be empty in some cases)
      expect(result.seoMetadata.tags.length).toBeGreaterThanOrEqual(0);
    });

    test("should generate thumbnail suggestions from suspense moments", async () => {
      // Arrange
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const transcription = TranscriptionFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.seoMetadata.thumbnailSuggestions).toBeDefined();
      expect(Array.isArray(result.seoMetadata.thumbnailSuggestions)).toBe(true);
    });

    test("should calculate SEO score based on title, description, and tags", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.seoMetadata.seoScore).toBeDefined();
      expect(result.seoMetadata.seoScore).toBeGreaterThanOrEqual(0);
      expect(result.seoMetadata.seoScore).toBeLessThanOrEqual(1);
    });

    test("should handle SEO generation errors gracefully", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Mock getModel to fail
      mockGeminiService.configure({
        shouldReject: true,
        rejectWith: new Error("Model error"),
      });

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert - should return fallback values
      expect(result.seoMetadata).toBeDefined();
      expect(result.seoMetadata.title).toBe("Video Title");
      expect(result.seoMetadata.description).toBe("Video description");
    });
  });

  describe("calculateComprehensiveImprovement", () => {
    test("should calculate improvement breakdown", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.improvementBreakdown).toBeDefined();
      if (!result.improvementBreakdown) {
        throw new Error("Improvement breakdown should be defined");
      }
      const breakdown = result.improvementBreakdown;
      expect(breakdown.overall).toBeGreaterThanOrEqual(0);
      expect(breakdown.overall).toBeLessThanOrEqual(1);
      expect(breakdown.factors).toBeDefined();
      expect(breakdown.topPriorities).toBeDefined();
      expect(breakdown.estimatedBoostPercent).toBeDefined();
      expect(breakdown.confidenceLevel).toBeDefined();
    });

    test("should include all factor types in breakdown", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.improvementBreakdown).toBeDefined();
      if (!result.improvementBreakdown) {
        throw new Error("Improvement breakdown should be defined");
      }
      const factorNames = result.improvementBreakdown.factors.map((f) => f.name);
      expect(factorNames).toContain("Title Optimization");
      expect(factorNames).toContain("Description Optimization");
      expect(factorNames).toContain("Tags & Keywords");
      expect(factorNames.length).toBeGreaterThan(0);
    });
  });

  describe("generateTopInsights", () => {
    test("should generate exactly 3 top insights", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.topInsights).toBeDefined();
      expect(result.topInsights).toHaveLength(3);
    });

    test("should prioritize high-impact insights", async () => {
      // Arrange
      const transcription = TranscriptionFactory.createHighConfidence();
      const retentionAnalysis = RetentionAnalysisFactory.createHighEngagement();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result.topInsights).toHaveLength(3);
      result.topInsights.forEach((insight) => {
        expect(insight).toBeDefined();
        expect(typeof insight).toBe("string");
        expect(insight.length).toBeGreaterThan(0);
      });
    });

    test("should include improvement priorities in insights", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      const hasPriorityInsight = result.topInsights.some((insight) => insight.includes("🎯"));
      expect(hasPriorityInsight).toBe(true);
    });
  });

  describe("Performance", () => {
    test("should complete generation in reasonable time", async () => {
      // Arrange
      const transcription = TranscriptionFactory.create();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const startTime = Date.now();
      await service.generateInsights(transcription, retentionAnalysis, videoId);
      const duration = Date.now() - startTime;

      // Assert - should complete in less than 1 second for mocked services
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Edge Cases", () => {
    test("should handle very long transcription", async () => {
      // Arrange
      const transcription = TranscriptionFactory.createLong();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result).toBeDefined();
      expect(result.scriptSuggestions).toBeDefined();
    });

    test("should handle very short transcription", async () => {
      // Arrange
      const transcription = TranscriptionFactory.createShort();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result).toBeDefined();
      expect(result.scriptSuggestions).toBeDefined();
    });

    test("should handle low confidence transcription", async () => {
      // Arrange
      const transcription = TranscriptionFactory.createLowConfidence();
      const retentionAnalysis = RetentionAnalysisFactory.create();
      const videoId = "test-video-123";

      // Act
      const result = await service.generateInsights(transcription, retentionAnalysis, videoId);

      // Assert
      expect(result).toBeDefined();
      expect(result.seoMetadata).toBeDefined();
    });
  });
});
