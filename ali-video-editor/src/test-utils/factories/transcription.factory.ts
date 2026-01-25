/**
 * Video Copilot - Transcription Factory
 * Hybrid factory using faker for dynamic data + fixtures for edge cases
 */

import { TranscriptionResult } from "@/types";
import { faker } from "@faker-js/faker";

/**
 * Transcription Factory
 * Generates realistic test data for transcription results
 */
export class TranscriptionFactory {
  /**
   * Create a transcription result with overrides
   */
  static create(overrides?: Partial<TranscriptionResult>): TranscriptionResult {
    const segmentsCount = faker.number.int({ min: 5, max: 50 });

    return {
      id: faker.string.uuid(),
      videoId: faker.string.uuid(),
      text: generateRealisticText(segmentsCount),
      segments: generateSegments(segmentsCount),
      language: "en",
      confidence: faker.number.float({ min: 0.8, max: 1.0, fractionDigits: 2 }),
      processingDuration: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
      createdAt: faker.date.past(),
      ...overrides,
    };
  }

  /**
   * Create multiple transcription results
   */
  static createMany(count: number): TranscriptionResult[] {
    return Array.from({ length: count }, () => this.create());
  }

  /**
   * Create a high-confidence transcription
   */
  static createHighConfidence(overrides?: Partial<TranscriptionResult>): TranscriptionResult {
    return this.create({
      confidence: faker.number.float({ min: 0.95, max: 1.0, fractionDigits: 2 }),
      ...overrides,
    });
  }

  /**
   * Create a low-confidence transcription
   */
  static createLowConfidence(overrides?: Partial<TranscriptionResult>): TranscriptionResult {
    return this.create({
      confidence: faker.number.float({ min: 0.6, max: 0.8, fractionDigits: 2 }),
      ...overrides,
    });
  }

  /**
   * Create a short transcription
   */
  static createShort(overrides?: Partial<TranscriptionResult>): TranscriptionResult {
    const shortSegments = generateSegments(faker.number.int({ min: 2, max: 5 }));
    return this.create({
      segments: shortSegments,
      text: generateRealisticText(shortSegments.length),
      ...overrides,
    });
  }

  /**
   * Create a long transcription
   */
  static createLong(overrides?: Partial<TranscriptionResult>): TranscriptionResult {
    const longSegments = generateSegments(faker.number.int({ min: 100, max: 500 }));
    return this.create({
      segments: longSegments,
      text: generateRealisticText(longSegments.length),
      ...overrides,
    });
  }
}

/**
 * Generate realistic text segments
 */
function generateRealisticText(segmentCount: number): string {
  const phrases = [
    "In this tutorial, we're going to explore",
    "The key concept here is",
    "Let me show you how this works",
    "One important thing to note is",
    "As you can see",
    "This approach allows us to",
    "The main benefit of this is",
    "It's crucial to understand that",
    "Now, let's move on to",
    "In the next section, we'll cover",
  ];

  let text = "";
  for (let i = 0; i < segmentCount; i++) {
    text += phrases[i % phrases.length] + " ";
    text += faker.lorem.sentence() + ". ";
  }

  return text.trim();
}

/**
 * Generate transcription segments
 */
function generateSegments(count: number): import("@/types").TranscriptionSegment[] {
  const segments: import("@/types").TranscriptionSegment[] = [];
  let currentTime = 0;

  for (let i = 0; i < count; i++) {
    const duration = faker.number.float({ min: 2, max: 10, fractionDigits: 1 });
    const text = faker.lorem.sentence();

    // Generate words for this segment
    const words: import("@/types").TranscriptionWord[] = text.split(" ").map((word, index) => ({
      word: word.trim(),
      start: parseFloat((currentTime + (index * duration) / text.split(" ").length).toFixed(2)),
      end: parseFloat((currentTime + ((index + 1) * duration) / text.split(" ").length).toFixed(2)),
      confidence: faker.number.float({ min: 0.85, max: 1.0, fractionDigits: 2 }),
      speaker: i % 5 === 0 ? "speaker1" : undefined,
      speakerLabel: i % 5 === 0 ? "Speaker 1" : undefined,
    }));

    segments.push({
      text,
      start: parseFloat(currentTime.toFixed(1)),
      end: parseFloat((currentTime + duration).toFixed(1)),
      confidence: faker.number.float({ min: 0.85, max: 1.0, fractionDigits: 2 }),
      words,
      speaker: i % 5 === 0 ? "speaker1" : undefined,
      speakerLabel: i % 5 === 0 ? "Speaker 1" : undefined,
    });
    currentTime += duration;
  }

  return segments;
}
