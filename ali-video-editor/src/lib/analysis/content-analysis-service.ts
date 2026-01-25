/**
 * Video Copilot - Content Analysis Service
 * Handles timeline analysis, silence detection, and chapter generation
 */

import { v4 as uuidv4 } from "uuid";
import {
    AppError,
    AppErrorType,
    ChapterMarker,
    ProgressCallback,
    RetentionAnalysis,
    SilenceSegment,
    SpeechSegment,
    Timeline,
    TimelineSegment,
    TranscriptionResult,
} from "../../types";
import { logger } from "../logger";

/**
 * Silence detection threshold in dB
 */
const SILENCE_THRESHOLD = -40;

/**
 * Minimum silence duration in seconds
 */
const MIN_SILENCE_DURATION = 2;

/**
 * Content Analysis Service
 * Singleton service for content analysis
 */
export class ContentAnalysisService {
  private static instance: ContentAnalysisService;

  private constructor() {
    logger.info("ContentAnalysisService initialized");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ContentAnalysisService {
    if (!ContentAnalysisService.instance) {
      ContentAnalysisService.instance = new ContentAnalysisService();
    }
    return ContentAnalysisService.instance;
  }

  /**
   * Analyze audio for silence and speech segments
   */
  public async analyzeAudio(
    audioFile: File,
    videoDuration: number,
    onProgress?: ProgressCallback
  ): Promise<{
    silenceSegments: SilenceSegment[];
    speechSegments: SpeechSegment[];
  }> {
    const startTime = Date.now();
    logger.info("Starting audio analysis", { filename: audioFile.name, duration: videoDuration });

    try {
      if (onProgress) {
        onProgress(0, "Analyzing audio levels...");
      }

      // Create audio context (with webkit prefix for older browsers)
      interface WebkitWindow extends Window {
        webkitAudioContext?: typeof AudioContext;
      }
      const AudioContextClass = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
      if (!AudioContextClass) {
        throw new AppError(AppErrorType.RETENTION_ANALYSIS_FAILED, "AudioContext not supported");
      }
      const audioContext = new AudioContextClass();
      const arrayBuffer = await audioFile.arrayBuffer();

      if (onProgress) {
        onProgress(30, "Decoding audio...");
      }

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0); // Use first channel

      if (onProgress) {
        onProgress(60, "Detecting silence and speech...");
      }

      // Analyze audio levels
      const sampleRate = audioBuffer.sampleRate;
      const silenceSegments: SilenceSegment[] = [];
      const speechSegments: SpeechSegment[] = [];

      let inSilence = false;
      let silenceStart = 0;
      let speechStart = 0;

      // Process audio in chunks
      const chunkSize = sampleRate * 0.1; // 100ms chunks
      for (let i = 0; i < channelData.length; i += chunkSize) {
        const chunk = channelData.slice(i, i + chunkSize);
        const rms = this.calculateRMS(chunk);
        const db = 20 * Math.log10(rms);

        const currentTime = i / sampleRate;

        if (db < SILENCE_THRESHOLD) {
          if (!inSilence) {
            // Start of silence
            inSilence = true;
            silenceStart = currentTime;

            // End of speech segment
            if (currentTime - speechStart >= 0.5) {
              speechSegments.push({
                start: speechStart,
                end: currentTime,
                duration: currentTime - speechStart,
                audioLevel: db,
                intensity: this.calculateSpeechIntensity(
                  channelData,
                  speechStart,
                  currentTime,
                  sampleRate
                ),
              });
            }
          }
        } else {
          if (inSilence) {
            // End of silence
            inSilence = false;
            const silenceDuration = currentTime - silenceStart;

            if (silenceDuration >= MIN_SILENCE_DURATION) {
              silenceSegments.push({
                start: silenceStart,
                end: currentTime,
                duration: silenceDuration,
                audioLevel: db,
              });
            }
          }

          speechStart = currentTime;
        }
      }

      // Handle final segment
      if (inSilence) {
        const silenceDuration = videoDuration - silenceStart;
        if (silenceDuration >= MIN_SILENCE_DURATION) {
          silenceSegments.push({
            start: silenceStart,
            end: videoDuration,
            duration: silenceDuration,
            audioLevel: SILENCE_THRESHOLD,
          });
        }
      } else if (videoDuration - speechStart >= 0.5) {
        speechSegments.push({
          start: speechStart,
          end: videoDuration,
          duration: videoDuration - speechStart,
          audioLevel: 0,
          intensity: this.calculateSpeechIntensity(
            channelData,
            speechStart,
            videoDuration,
            sampleRate
          ),
        });
      }

      if (onProgress) {
        onProgress(100, "Audio analysis completed");
      }

      const processingDuration = (Date.now() - startTime) / 1000;
      logger.info("Audio analysis completed", {
        duration: processingDuration,
        silenceSegments: silenceSegments.length,
        speechSegments: speechSegments.length,
      });

      return { silenceSegments, speechSegments };
    } catch (error) {
      logger.error("Audio analysis failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new AppError(
        AppErrorType.RETENTION_ANALYSIS_FAILED,
        "Failed to analyze audio",
        error as Error
      );
    }
  }

  /**
   * Calculate RMS (Root Mean Square) of audio samples
   */
  private calculateRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      if (sample !== undefined) {
        sum += sample * sample;
      }
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Calculate speech intensity based on audio variation
   */
  private calculateSpeechIntensity(
    samples: Float32Array,
    start: number,
    end: number,
    sampleRate: number
  ): number {
    const startIndex = Math.floor(start * sampleRate);
    const endIndex = Math.floor(end * sampleRate);
    const segment = samples.slice(startIndex, endIndex);

    if (segment.length === 0) {
      return 0;
    }

    // Calculate variation as a proxy for speech intensity
    const rms = this.calculateRMS(segment);
    return Math.min(rms * 10, 1); // Normalize to 0-1
  }

  /**
   * Generate timeline with segments
   */
  public async generateTimeline(
    videoId: string,
    videoDuration: number,
    silenceSegments: SilenceSegment[],
    speechSegments: SpeechSegment[],
    transcription: TranscriptionResult,
    retentionAnalysis: RetentionAnalysis,
    onProgress?: ProgressCallback
  ): Promise<Timeline> {
    const startTime = Date.now();
    logger.info("Generating timeline", { videoId, duration: videoDuration });

    try {
      if (onProgress) {
        onProgress(0, "Creating timeline segments...");
      }

      // Create timeline segments
      const segments: TimelineSegment[] = [];
      let currentTime = 0;

      // Sort silence and speech segments by start time
      const sortedSilence = [...silenceSegments].sort((a, b) => a.start - b.start);
      const sortedSpeech = [...speechSegments].sort((a, b) => a.start - b.start);

      // Merge segments into timeline
      let silenceIndex = 0;
      let speechIndex = 0;

      while (currentTime < videoDuration) {
        const nextSilence = sortedSilence[silenceIndex];
        const nextSpeech = sortedSpeech[speechIndex];

        if (nextSilence && nextSpeech) {
          if (nextSilence.start < nextSpeech.start) {
            // Add silence segment
            segments.push({
              id: uuidv4(),
              start: nextSilence.start,
              end: nextSilence.end,
              duration: nextSilence.duration,
              type: "silence",
              audioLevel: nextSilence.audioLevel,
              isSelected: false,
            });
            currentTime = nextSilence.end;
            silenceIndex++;
          } else {
            // Add speech segment
            segments.push({
              id: uuidv4(),
              start: nextSpeech.start,
              end: nextSpeech.end,
              duration: nextSpeech.duration,
              type: "speech",
              audioLevel: nextSpeech.audioLevel,
              isSelected: false,
            });
            currentTime = nextSpeech.end;
            speechIndex++;
          }
        } else if (nextSilence) {
          // Add remaining silence segments
          segments.push({
            id: uuidv4(),
            start: nextSilence.start,
            end: nextSilence.end,
            duration: nextSilence.duration,
            type: "silence",
            audioLevel: nextSilence.audioLevel,
            isSelected: false,
          });
          currentTime = nextSilence.end;
          silenceIndex++;
        } else if (nextSpeech) {
          // Add remaining speech segments
          segments.push({
            id: uuidv4(),
            start: nextSpeech.start,
            end: nextSpeech.end,
            duration: nextSpeech.duration,
            type: "speech",
            audioLevel: nextSpeech.audioLevel,
            isSelected: false,
          });
          currentTime = nextSpeech.end;
          speechIndex++;
        } else {
          break;
        }
      }

      if (onProgress) {
        onProgress(50, "Generating chapter markers...");
      }

      // Generate chapter markers based on transcription and retention analysis
      const chapterMarkers = this.generateChapterMarkers(
        transcription,
        retentionAnalysis,
        segments
      );

      if (onProgress) {
        onProgress(100, "Timeline generated");
      }

      const processingDuration = (Date.now() - startTime) / 1000;
      logger.info("Timeline generated", {
        duration: processingDuration,
        segments: segments.length,
        chapters: chapterMarkers.length,
      });

      return {
        id: `timeline-${videoId}`,
        videoId,
        duration: videoDuration,
        segments,
        chapterMarkers,
        silenceSegments,
        speechSegments,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error("Timeline generation failed", {
        videoId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new AppError(
        AppErrorType.RETENTION_ANALYSIS_FAILED,
        "Failed to generate timeline",
        error as Error
      );
    }
  }

  /**
   * Generate chapter markers from transcription and retention analysis
   */
  private generateChapterMarkers(
    transcription: TranscriptionResult,
    retentionAnalysis: RetentionAnalysis,
    _segments: TimelineSegment[]
  ): ChapterMarker[] {
    const chapters: ChapterMarker[] = [];

    // Use transcription segments as chapter candidates
    for (const segment of transcription.segments) {
      // Get retention score for this segment
      const retentionScore = retentionAnalysis.retentionScores.find(
        (rs) => segment.start >= rs.start && segment.end <= rs.end
      );

      // Generate chapter title from first few words
      const words = segment.text.split(" ").slice(0, 5).join(" ");
      const title = words.length > 30 ? words.substring(0, 30) + "..." : words;

      chapters.push({
        id: uuidv4(),
        title: title || "Chapter",
        start: segment.start,
        end: segment.end,
        description: segment.text.substring(0, 200),
        isAIGenerated: true,
        retentionScore: retentionScore?.retentionRate,
        engagementScore: retentionScore?.engagementScore,
      });
    }

    // Merge nearby chapters (within 30 seconds)
    const mergedChapters = this.mergeNearbyChapters(chapters, 30);

    return mergedChapters;
  }

  /**
   * Merge chapters that are close to each other
   */
  private mergeNearbyChapters(chapters: ChapterMarker[], maxGap: number): ChapterMarker[] {
    if (chapters.length === 0) {
      return [];
    }

    const firstChapter = chapters[0];
    if (!firstChapter) {
      return [];
    }

    const merged: ChapterMarker[] = [firstChapter];

    for (let i = 1; i < chapters.length; i++) {
      const lastChapter = merged[merged.length - 1];
      const currentChapter = chapters[i];

      if (!lastChapter || !currentChapter) {
        continue;
      }

      if (currentChapter.start - lastChapter.end <= maxGap) {
        // Merge chapters
        lastChapter.end = currentChapter.end;
        lastChapter.description = `${lastChapter.description} ${currentChapter.description}`;
      } else {
        merged.push(currentChapter);
      }
    }

    return merged;
  }
}

// Export singleton instance
export const contentAnalysisService = ContentAnalysisService.getInstance();
