/**
 * Video Copilot - Deepgram Transcription Service
 * Handles audio transcription using Deepgram API
 */

import { createClient, DeepgramClient } from "@deepgram/sdk";
import {
  AppError,
  AppErrorType,
  ProgressCallback,
  TranscriptionResult,
  TranscriptionSegment,
} from "../../types";
import { clientLogger } from "../client-logger";

// ============================================================================
// Deepgram API Response Types
// ============================================================================

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: number;
}

interface DeepgramSentence {
  text: string;
  words?: DeepgramWord[];
}

interface DeepgramParagraph {
  start: number;
  end: number;
  speaker?: number;
  sentences?: DeepgramSentence[];
}

interface DeepgramUtterance {
  transcript: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: number;
  words?: DeepgramWord[];
}

interface DeepgramTranscript {
  transcript?: string;
  confidence?: number;
  words?: DeepgramWord[];
  paragraphs?: { paragraphs?: DeepgramParagraph[] };
  utterances?: DeepgramUtterance[];
}

interface DeepgramTranscriptionResult {
  results?: {
    channels?: Array<{
      alternatives?: DeepgramTranscript[];
    }>;
    language?: string;
  };
}

/**
 * Deepgram Service
 * Singleton service for audio transcription
 */
export class DeepgramService {
  private static instance: DeepgramService;
  private client: DeepgramClient | null = null;
  private apiKey: string = "";

  private constructor() {
    clientLogger.info("DeepgramService initialized");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DeepgramService {
    if (!DeepgramService.instance) {
      DeepgramService.instance = new DeepgramService();
    }
    return DeepgramService.instance;
  }

  /**
   * Initialize Deepgram client with API key
   */
  public initialize(apiKey?: string): void {
    // Use provided key or fall back to environment variable
    const key = apiKey || process.env.DEEPGRAM_API_KEY;

    if (!key) {
      throw new AppError(
        AppErrorType.API_KEY_INVALID,
        "Deepgram API key not provided. Set DEEPGRAM_API_KEY environment variable or pass key to initialize()."
      );
    }

    this.apiKey = key;
    this.client = createClient(key);
    clientLogger.info("Deepgram client initialized");
  }

  /**
   * Check if service is initialized
   */
  public isInitialized(): boolean {
    return this.client !== null && this.apiKey.length > 0;
  }

  /**
   * Transcribe audio file
   */
  public async transcribeAudio(
    audioFile: File,
    videoId: string,
    onProgress?: ProgressCallback
  ): Promise<TranscriptionResult> {
    // Auto-initialize from environment if not already done
    if (!this.isInitialized()) {
      this.initialize();
    }

    const startTime = Date.now();
    clientLogger.info("Starting audio transcription", { 
      videoId, 
      filename: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
      isInitialized: this.isInitialized(),
      hasApiKey: !!this.apiKey
    });

    try {
      if (onProgress) {
        onProgress(0, "Preparing audio for transcription...");
      }

      // Validate audio file
      if (!audioFile || audioFile.size === 0) {
        throw new AppError(
          AppErrorType.TRANSCRIPTION_FAILED,
          "Audio file is empty or invalid"
        );
      }

      // Read audio file
      const arrayBuffer = await audioFile.arrayBuffer();
      
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new AppError(
          AppErrorType.TRANSCRIPTION_FAILED,
          "Failed to read audio file - empty buffer"
        );
      }

      if (onProgress) {
        onProgress(20, "Uploading audio to Deepgram...");
      }

      // Ensure client is initialized
      if (!this.client) {
        throw new AppError(
          AppErrorType.API_KEY_INVALID,
          "Deepgram client not initialized. Please ensure your Deepgram API key is valid."
        );
      }

      clientLogger.info("Sending audio to Deepgram", {
        fileSize: arrayBuffer.byteLength,
        audioType: audioFile.type
      });

      // Transcribe using Deepgram with simplified options
      const { result, error } = await this.client.listen.prerecorded.transcribeFile(
        Buffer.from(arrayBuffer),
        {
          model: "nova-2",
          language: "en-US",
          smart_format: true,
          punctuate: true,
          paragraphs: true,
          diarize: true,           // Enable speaker diarization
          utterances: true,        // Group by speaker utterances
        }
      );

      if (error) {
        clientLogger.error("Deepgram API error", {
          error: error.message,
          stack: error.stack
        });
        throw new AppError(
          AppErrorType.TRANSCRIPTION_FAILED,
          `Deepgram transcription failed: ${error.message}`,
          error
        );
      }

      if (!result || !result.results) {
        throw new AppError(
          AppErrorType.TRANSCRIPTION_FAILED,
          "Deepgram returned empty result"
        );
      }

      if (onProgress) {
        onProgress(80, "Processing transcription results...");
      }

      // Parse transcription results
      const transcription = this.parseTranscriptionResult(result, videoId);

      if (onProgress) {
        onProgress(100, "Transcription completed");
      }

      const processingDuration = (Date.now() - startTime) / 1000;
      const wordCount = transcription.segments.reduce((acc, seg) => acc + seg.words.length, 0);
      
      // Calculate unique speaker count from segments
      const uniqueSpeakers = new Set(
        transcription.segments
          .map((s) => s.speaker)
          .filter(Boolean)
      );

      clientLogger.info("Audio transcription completed", {
        videoId,
        duration: processingDuration,
        wordCount,
        textLength: transcription.text.length,
        segmentsCount: transcription.segments.length,
        speakerCount: uniqueSpeakers.size,
        speakers: Array.from(uniqueSpeakers),
      });

      return transcription;
    } catch (error) {
      clientLogger.error("Audio transcription failed", {
        videoId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        isInitialized: this.isInitialized(),
        hasClient: !!this.client,
        audioFileSize: audioFile?.size,
      });

      if (error instanceof AppError) {
        throw error;
      }

      // Provide more specific error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new AppError(
        AppErrorType.TRANSCRIPTION_FAILED,
        `Failed to transcribe audio: ${errorMessage}. Please check your Deepgram API key and try again.`,
        error as Error
      );
    }
  }

  /**
   * Parse Deepgram transcription result
   */
  private parseTranscriptionResult(result: DeepgramTranscriptionResult, videoId: string): TranscriptionResult {
    const transcript = result.results?.channels?.[0]?.alternatives?.[0];

    if (!transcript) {
      throw new AppError(
        AppErrorType.TRANSCRIPTION_FAILED,
        "Invalid transcription result from Deepgram"
      );
    }

    // Helper to create human-readable speaker label
    const getSpeakerLabel = (speaker: number | undefined): string | undefined => {
      return speaker !== undefined ? `Speaker ${speaker + 1}` : undefined;
    };

    // Parse segments - prioritize utterances for speaker diarization
    // Utterances are the primary source for diarized content with speaker info
    let segments: TranscriptionSegment[] = [];

    // First, try utterances (best for speaker diarization)
    if (transcript.utterances && transcript.utterances.length > 0) {
      segments = transcript.utterances.map((utt: DeepgramUtterance) => ({
        text: utt.transcript,
        start: utt.start,
        end: utt.end,
        confidence: utt.confidence || transcript.confidence || 0,
        words:
          utt.words?.map((word: DeepgramWord) => ({
            word: word.word,
            start: word.start,
            end: word.end,
            confidence: word.confidence || 0,
            speaker: word.speaker !== undefined ? String(word.speaker) : undefined,
            speakerLabel: getSpeakerLabel(word.speaker),
          })) || [],
        speaker: utt.speaker !== undefined ? String(utt.speaker) : undefined,
        speakerLabel: getSpeakerLabel(utt.speaker),
      }));
    }
    // Fallback to paragraphs if no utterances
    else if (transcript.paragraphs?.paragraphs && transcript.paragraphs.paragraphs.length > 0) {
      segments = transcript.paragraphs.paragraphs.map(
        (para: DeepgramParagraph) => {
          // Combine all sentences in the paragraph
          const allSentencesText = para.sentences?.map(s => s.text).join(' ') || '';
          const allWords = para.sentences?.flatMap(s => s.words || []) || [];
          
          return {
            text: allSentencesText,
            start: para.start,
            end: para.end,
            confidence: transcript.confidence || 0,
            words: allWords.map((word: DeepgramWord) => ({
              word: word.word,
              start: word.start,
              end: word.end,
              confidence: word.confidence || 0,
              speaker: word.speaker !== undefined ? String(word.speaker) : undefined,
              speakerLabel: getSpeakerLabel(word.speaker),
            })),
            speaker: para.speaker !== undefined ? String(para.speaker) : undefined,
            speakerLabel: getSpeakerLabel(para.speaker),
          };
        }
      );
    }
    // Final fallback: use words directly
    else if (transcript.words && transcript.words.length > 0) {
      segments = [{
        text: transcript.transcript || '',
        start: transcript.words[0]?.start || 0,
        end: transcript.words[transcript.words.length - 1]?.end || 0,
        confidence: transcript.confidence || 0,
        words: transcript.words.map((word: DeepgramWord) => ({
          word: word.word,
          start: word.start,
          end: word.end,
          confidence: word.confidence || 0,
          speaker: word.speaker !== undefined ? String(word.speaker) : undefined,
          speakerLabel: getSpeakerLabel(word.speaker),
        })),
      }];
    }

    // Extract unique speakers for metadata
    const uniqueSpeakers = new Set<string>();
    for (const segment of segments) {
      if (segment.speakerLabel) {
        uniqueSpeakers.add(segment.speakerLabel);
      }
    }
    const speakers = Array.from(uniqueSpeakers).sort();
    const speakerCount = speakers.length;

    // Generate diarized text with speaker annotations
    let diarizedText = "";
    let previousSpeaker: string | null = null;
    for (const segment of segments) {
      const speaker = segment.speakerLabel || "Narrator";
      const text = segment.text.trim();
      if (!text) {
        continue;
      }
      
      if (speaker !== previousSpeaker) {
        diarizedText += `\n${speaker}:\n${text} `;
        previousSpeaker = speaker;
      } else {
        diarizedText += `${text} `;
      }
    }
    diarizedText = diarizedText.trim();

    return {
      id: `transcription-${videoId}`,
      videoId,
      text: transcript.transcript || "",
      segments,
      confidence: transcript.confidence || 0,
      language: result.results?.language || "en-US",
      processingDuration: 0, // Will be set by caller
      createdAt: new Date(),
      speakerCount: speakerCount > 0 ? speakerCount : undefined,
      speakers: speakers.length > 0 ? speakers : undefined,
      diarizedText: diarizedText || undefined,
    };
  }


  /**
   * Transcribe audio from URL
   */
  public async transcribeFromUrl(
    audioUrl: string,
    videoId: string,
    onProgress?: ProgressCallback
  ): Promise<TranscriptionResult> {
    // Auto-initialize from environment if not already done
    if (!this.isInitialized()) {
      this.initialize();
    }

    const startTime = Date.now();
    clientLogger.info("Starting audio transcription from URL", { videoId, audioUrl });

    try {
      if (onProgress) {
        onProgress(0, "Preparing transcription...");
      }

      // Ensure client is initialized
      if (!this.client) {
        throw new AppError(
          AppErrorType.API_KEY_INVALID,
          "Deepgram client not initialized"
        );
      }

      const { result, error } = await this.client.listen.prerecorded.transcribeUrl(
        { url: audioUrl },
        {
          model: "nova-2",
          language: "en-US",
          smart_format: true,
          punctuate: true,
          paragraphs: true,
          diarize: true,
          utterances: true,
        }
      );

      if (error) {
        throw new AppError(
          AppErrorType.TRANSCRIPTION_FAILED,
          `Deepgram transcription failed: ${error.message}`,
          error
        );
      }

      if (onProgress) {
        onProgress(100, "Transcription completed");
      }

      const transcription = this.parseTranscriptionResult(result, videoId);

      const processingDuration = (Date.now() - startTime) / 1000;
      transcription.processingDuration = processingDuration;

      clientLogger.info("Audio transcription from URL completed", {
        videoId,
        duration: processingDuration,
      });

      return transcription;
    } catch (error) {
      clientLogger.error("Audio transcription from URL failed", {
        videoId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        AppErrorType.TRANSCRIPTION_FAILED,
        "Failed to transcribe audio from URL",
        error as Error
      );
    }
  }
}

// Export singleton instance
export const deepgramService = DeepgramService.getInstance();
