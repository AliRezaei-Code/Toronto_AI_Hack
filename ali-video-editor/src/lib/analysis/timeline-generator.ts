/**
 * Video Copilot - Timeline Generator Service
 * Generates timeline segments from transcription and audio analysis
 */

import { v4 as uuidv4 } from "uuid";
import {
  ChapterMarker,
  SilenceSegment,
  SpeechSegment,
  TimelineSegment,
  TranscriptionResult,
} from "../../types";
import { clientLogger } from "../client-logger";

/**
 * Timeline Generator Service
 * Generates timeline visualizations from transcription data
 */
export class TimelineGenerator {
  private static instance: TimelineGenerator;

  private constructor() {
    clientLogger.info("TimelineGenerator initialized");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TimelineGenerator {
    if (!TimelineGenerator.instance) {
      TimelineGenerator.instance = new TimelineGenerator();
    }
    return TimelineGenerator.instance;
  }

  /**
   * Generate timeline segments from transcription
   */
  public generateTimelineSegments(
    transcription: TranscriptionResult,
    duration: number
  ): TimelineSegment[] {
    clientLogger.info("Generating timeline segments", {
      segments: transcription.segments.length,
      duration,
    });

    const segments: TimelineSegment[] = [];
    let currentTime = 0;

    // Process each transcription segment
    for (let i = 0; i < transcription.segments.length; i++) {
      const transSegment = transcription.segments[i];
      if (!transSegment) {
        continue;
      }

      const prevEnd = i > 0 ? transcription.segments[i - 1]?.end || 0 : 0;

      // Check for silence between segments
      if (transSegment.start - prevEnd > 0.5) {
        // Silence segment detected
        const silenceDuration = transSegment.start - prevEnd;
        segments.push({
          id: uuidv4(),
          start: prevEnd,
          end: transSegment.start,
          duration: silenceDuration,
          type: "silence",
          audioLevel: -60,
          isSelected: false,
        });
      }

      // Speech segment from transcription
      segments.push({
        id: uuidv4(),
        start: transSegment.start,
        end: transSegment.end,
        duration: transSegment.end - transSegment.start,
        type: "speech",
        audioLevel: this.calculateAudioLevel(transSegment.confidence),
        isSelected: false,
        transcriptionText: transSegment.text,
        speaker: transSegment.speaker,
        confidence: transSegment.confidence,
      });

      currentTime = transSegment.end;
    }

    // Fill remaining time with silence if any
    if (currentTime < duration) {
      segments.push({
        id: uuidv4(),
        start: currentTime,
        end: duration,
        duration: duration - currentTime,
        type: "silence",
        audioLevel: -60,
        isSelected: false,
      });
    }

    clientLogger.info("Timeline segments generated", {
      totalSegments: segments.length,
      speechSegments: segments.filter((s) => s.type === "speech").length,
      silenceSegments: segments.filter((s) => s.type === "silence").length,
    });

    return segments;
  }

  /**
   * Generate chapter markers from transcription
   */
  public generateChapterMarkers(
    transcription: TranscriptionResult,
    segments: TimelineSegment[]
  ): ChapterMarker[] {
    clientLogger.info("Generating chapter markers");

    const chapters: ChapterMarker[] = [];
    const chapterKeywords = [
      "introduction",
      "intro",
      "welcome",
      "overview",
      "let's begin",
      "let's start",
      "getting started",
      "first",
      "chapter",
      "section",
      "part",
      "topic",
      "next",
      "moving on",
      "finally",
      "conclusion",
      "summary",
      "wrap up",
      "in conclusion",
    ];

    // Create chapters based on transcription segments containing chapter keywords
    let currentChapter: ChapterMarker | null = null;
    const minChapterDuration = 30; // Minimum 30 seconds per chapter

    for (const segment of transcription.segments) {
      const text = segment.text.toLowerCase();
      let isChapterStart = false;
      let chapterTitle = "";

      // Check if segment contains chapter keyword
      for (const keyword of chapterKeywords) {
        if (text.includes(keyword)) {
          isChapterStart = true;
          chapterTitle = this.generateChapterTitle(segment.text);
          break;
        }
      }

      if (
        isChapterStart &&
        (!currentChapter || segment.start - currentChapter.end >= minChapterDuration)
      ) {
        // Save previous chapter if exists
        if (currentChapter) {
          chapters.push(currentChapter);
        }

        // Start new chapter
        currentChapter = {
          id: uuidv4(),
          title: chapterTitle,
          start: segment.start,
          end: segment.end,
          isAIGenerated: true,
        };
      } else if (currentChapter) {
        // Extend current chapter
        currentChapter.end = segment.end;
      }
    }

    // Add final chapter
    if (currentChapter) {
      chapters.push(currentChapter);
    }

    // If no chapters found, create default chapters based on duration
    if (chapters.length === 0 && transcription.segments.length > 0) {
      const lastSegment = transcription.segments[transcription.segments.length - 1];
      if (!lastSegment) {
        return chapters;
      }

      const totalDuration = lastSegment.end;
      const chapterCount = Math.max(3, Math.floor(totalDuration / 60)); // One chapter per minute, min 3

      for (let i = 0; i < chapterCount; i++) {
        const start = (i * totalDuration) / chapterCount;
        const end = ((i + 1) * totalDuration) / chapterCount;
        const segmentIndex = Math.floor((i / chapterCount) * transcription.segments.length);
        const segment = transcription.segments[segmentIndex];
        const title = this.generateChapterTitle(segment?.text || "");

        chapters.push({
          id: uuidv4(),
          title: title || `Chapter ${i + 1}`,
          start,
          end,
          isAIGenerated: true,
        });
      }
    }

    // Add chapter markers to timeline segments
    for (const chapter of chapters) {
      const segment = segments.find((s) => s.start === chapter.start);
      if (segment) {
        segment.chapterMarker = chapter;
      }
    }

    clientLogger.info("Chapter markers generated", { count: chapters.length });

    return chapters;
  }

  /**
   * Generate speech segments from transcription
   */
  public generateSpeechSegments(transcription: TranscriptionResult): SpeechSegment[] {
    return transcription.segments.map((segment) => ({
      start: segment.start,
      end: segment.end,
      duration: segment.end - segment.start,
      audioLevel: this.calculateAudioLevel(segment.confidence),
      intensity: segment.confidence,
    }));
  }

  /**
   * Generate silence segments from gaps in transcription
   */
  public generateSilenceSegments(
    transcription: TranscriptionResult,
    duration: number
  ): SilenceSegment[] {
    const silenceSegments: SilenceSegment[] = [];
    const minSilenceDuration = 0.5; // Minimum 0.5 seconds to be considered silence

    for (let i = 0; i < transcription.segments.length; i++) {
      const currentSegment = transcription.segments[i];
      if (!currentSegment) {
        continue;
      }

      const prevSegment = i > 0 ? transcription.segments[i - 1] : null;
      const prevEnd = prevSegment?.end || 0;
      const gap = currentSegment.start - prevEnd;

      if (gap >= minSilenceDuration) {
        silenceSegments.push({
          start: prevEnd,
          end: currentSegment.start,
          duration: gap,
          audioLevel: -60,
        });
      }
    }

    // Check for silence at the end
    const lastSegment = transcription.segments[transcription.segments.length - 1];
    if (lastSegment && duration - lastSegment.end >= minSilenceDuration) {
      silenceSegments.push({
        start: lastSegment.end,
        end: duration,
        duration: duration - lastSegment.end,
        audioLevel: -60,
      });
    }

    return silenceSegments;
  }

  /**
   * Calculate audio level from confidence score
   */
  private calculateAudioLevel(confidence: number): number {
    // Map confidence (0-1) to audio level (-60 to 0 dB)
    return Math.round(-60 + confidence * 60);
  }

  /**
   * Generate chapter title from text
   */
  private generateChapterTitle(text: string): string {
    // Extract first 5-8 words as chapter title
    const words = text.split(" ").slice(0, 8);
    let title = words.join(" ");

    // Remove trailing punctuation and capitalize
    title = title.replace(/[.,!?]+$/, "");
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return title || "Untitled Chapter";
  }
}

// Export singleton instance
export const timelineGenerator = TimelineGenerator.getInstance();
