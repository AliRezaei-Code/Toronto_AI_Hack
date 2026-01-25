/**
 * useTranscription Hook
 *
 * Handles audio transcription via Deepgram API.
 * Integrates with session store for state persistence.
 *
 * @module useTranscription
 */

import { clientLogger } from "@/lib/client-logger";
import { useSessionStore } from "@/lib/stores/session-store";
import type { TranscriptionResult } from "@/types";
import { useCallback, useState } from "react";

// ============================================================================
// Types
// ============================================================================

interface TranscriptionProgress {
  stage: "extracting" | "transcribing" | "processing";
  progress: number;
  message: string;
}

interface UseTranscriptionOptions {
  deepgramApiKey?: string;
  onComplete?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: TranscriptionProgress) => void;
}

interface UseTranscriptionReturn {
  // State
  isTranscribing: boolean;
  transcriptionProgress: TranscriptionProgress | null;
  error: string | null;

  // Actions
  handleTranscribe: () => Promise<TranscriptionResult | null>;

  // Derived state from store
  transcription: TranscriptionResult | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

const isAudioFile = (file: File): boolean => {
  const audioMimeTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/x-m4a"];
  return audioMimeTypes.includes(file.type);
};

const extractAudioFromVideo = async (
  videoFile: File,
  onProgress?: (progress: number, message?: string) => void
): Promise<File> => {
  if (onProgress) {
    onProgress(0, "Starting audio extraction...");
  }

  const formData = new FormData();
  formData.append("video", videoFile);

  if (onProgress) {
    onProgress(30, "Uploading to server...");
  }

  const response = await fetch("/api/extract-audio", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Audio extraction failed: ${response.status}`);
  }

  if (onProgress) {
    onProgress(80, "Downloading extracted audio...");
  }

  const audioBlob = await response.blob();
  const audioFile = new File([audioBlob], "audio.wav", { type: "audio/wav" });

  if (onProgress) {
    onProgress(100, "Audio extraction complete");
  }

  return audioFile;
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useTranscription(options: UseTranscriptionOptions = {}): UseTranscriptionReturn {
  const { deepgramApiKey, onComplete, onError, onProgress } = options;

  // Session store state and actions
  const {
    transcription,
    setTranscription,
    getVideoFile,
    uploadSession,
    setStage,
    setActiveTab,
  } = useSessionStore((state) => ({
    transcription: state.transcription,
    setTranscription: state.setTranscription,
    getVideoFile: state.getVideoFile,
    uploadSession: state.uploadSession,
    setStage: state.setStage,
    setActiveTab: state.setActiveTab,
  }));

  // Local transient state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<TranscriptionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleTranscribe = useCallback(async (): Promise<TranscriptionResult | null> => {
    const file = getVideoFile();
    if (!file) {
      const msg = "No file selected for transcription";
      setError(msg);
      onError?.(msg);
      return null;
    }

    if (!deepgramApiKey) {
      const msg = "Deepgram API key is required";
      setError(msg);
      onError?.(msg);
      return null;
    }

    setIsTranscribing(true);
    setError(null);
    setStage("processing");

    try {
      let audioFile: File;

      // Extract audio if video file
      if (!isAudioFile(file)) {
        setTranscriptionProgress({
          stage: "extracting",
          progress: 0,
          message: "Extracting audio from video...",
        });
        onProgress?.({
          stage: "extracting",
          progress: 0,
          message: "Extracting audio from video...",
        });

        audioFile = await extractAudioFromVideo(file, (progress, message) => {
          setTranscriptionProgress({
            stage: "extracting",
            progress,
            message: message || "Extracting audio...",
          });
          onProgress?.({
            stage: "extracting",
            progress,
            message: message || "Extracting audio...",
          });
        });
      } else {
        audioFile = file;
      }

      // Transcribe audio
      setTranscriptionProgress({
        stage: "transcribing",
        progress: 0,
        message: "Sending to Deepgram...",
      });
      onProgress?.({
        stage: "transcribing",
        progress: 0,
        message: "Sending to Deepgram...",
      });

      // Convert audio file to base64 for JSON payload (browser-compatible)
      // Use chunked approach to avoid "Maximum call stack size exceeded" for large files
      const arrayBuffer = await audioFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Process in chunks to avoid stack overflow
      const CHUNK_SIZE = 32768; // 32KB chunks
      let binaryString = "";
      for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
        const chunk = uint8Array.subarray(i, Math.min(i + CHUNK_SIZE, uint8Array.length));
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64Audio = btoa(binaryString);

      const videoId = uploadSession?.metadata?.id || "";

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioBuffer: base64Audio,
          videoId,
          deepgramApiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Transcription failed: ${response.status}`);
      }

      setTranscriptionProgress({
        stage: "processing",
        progress: 80,
        message: "Processing transcription...",
      });
      onProgress?.({
        stage: "processing",
        progress: 80,
        message: "Processing transcription...",
      });

      const result: TranscriptionResult = await response.json();

      // Update session store
      setTranscription(result);
      setStage("results");
      setActiveTab("transcription");

      setTranscriptionProgress({
        stage: "processing",
        progress: 100,
        message: "Transcription complete!",
      });
      onProgress?.({
        stage: "processing",
        progress: 100,
        message: "Transcription complete!",
      });

      clientLogger.info("Transcription complete", { wordCount: result.text.split(" ").length });
      onComplete?.(result);

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transcription failed";
      setError(message);
      setStage("results");
      clientLogger.error("Transcription failed", err);
      onError?.(message);
      return null;
    } finally {
      setIsTranscribing(false);
      setTranscriptionProgress(null);
    }
  }, [
    getVideoFile,
    deepgramApiKey,
    uploadSession,
    setTranscription,
    setStage,
    setActiveTab,
    onComplete,
    onError,
    onProgress,
  ]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    isTranscribing,
    transcriptionProgress,
    error,

    // Actions
    handleTranscribe,

    // Derived state
    transcription,
  };
}

export default useTranscription;
