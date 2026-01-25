/**
 * useVideoUpload Hook
 *
 * Handles video file selection, upload, and YouTube download logic.
 * Integrates with session store for state persistence.
 *
 * @module useVideoUpload
 */

import { clientLogger } from "@/lib/client-logger";
import { useSessionStore } from "@/lib/stores/session-store";
import { uploadService } from "@/lib/upload/upload-service";
import type { VideoUploadSession } from "@/types";
import { useCallback, useState } from "react";

// ============================================================================
// Types
// ============================================================================

interface UseVideoUploadOptions {
  onUploadComplete?: (session: VideoUploadSession) => void;
  onError?: (error: string) => void;
}

interface UseVideoUploadReturn {
  // State
  isUploading: boolean;
  uploadComplete: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  downloadError: string | null;
  error: string | null;

  // Actions
  handleFileSelect: (file: File) => void;
  handleUpload: () => Promise<void>;
  handleYouTubeDownload: (url: string) => Promise<void>;
  handleReset: () => void;

  // Derived state from store
  selectedFile: File | null;
  selectedFileName: string | null;
  videoObjectUrl: string | null;
  uploadSession: VideoUploadSession | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useVideoUpload(options: UseVideoUploadOptions = {}): UseVideoUploadReturn {
  const { onUploadComplete, onError } = options;

  // Session store state and actions
  const selectedFileName = useSessionStore((state) => state.selectedFileName);
  const videoObjectUrl = useSessionStore((state) => state.videoObjectUrl);
  const uploadSession = useSessionStore((state) => state.uploadSession);
  const setVideo = useSessionStore((state) => state.setVideo);
  const clearVideo = useSessionStore((state) => state.clearVideo);
  const getVideoFile = useSessionStore((state) => state.getVideoFile);
  const setStage = useSessionStore((state) => state.setStage);

  // Local transient state (not persisted)
  // Note: isUploading is exposed for UI, setIsUploading reserved for future use
  const [isUploading, _setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get current file from memory
  const selectedFile = getVideoFile();

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);
      setDownloadError(null);

      // Use upload service to create session with proper metadata
      uploadService
        .uploadVideo(file, (progress, message) => {
          clientLogger.info(`Upload progress: ${progress}% - ${message}`);
        })
        .then((session) => {
          setVideo(file, session);
          setUploadComplete(true);
          clientLogger.info(`File selected and processed: ${file.name}`);
          onUploadComplete?.(session);
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : "File processing failed";
          setError(message);
          onError?.(message);
        });
    },
    [setVideo, onUploadComplete, onError]
  );

  const handleUpload = useCallback(async () => {
    const file = getVideoFile();
    if (!file) {
      setError("No file selected");
      return;
    }

    // File is already processed in handleFileSelect, just update stage
    setStage("results");
    clientLogger.info(`Upload confirmed: ${file.name}`);
  }, [getVideoFile, setStage]);

  const handleYouTubeDownload = useCallback(
    async (url: string) => {
      setIsDownloading(true);
      setDownloadProgress(0);
      setDownloadError(null);
      setError(null);

      try {
        clientLogger.info(`Downloading YouTube video: ${url}`);

        // Step 1: Call download API to download video on server
        setDownloadProgress(10);
        const downloadResponse = await fetch("/api/youtube/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!downloadResponse.ok) {
          const errorData = await downloadResponse.json().catch(() => ({}));
          throw new Error(
            (errorData as { error?: string }).error || `Download failed: ${downloadResponse.status}`
          );
        }

        // Parse the JSON response with metadata
        const downloadResult = (await downloadResponse.json()) as {
          success: boolean;
          filename?: string;
          title?: string;
          error?: string;
        };

        if (!downloadResult.success || !downloadResult.filename) {
          throw new Error(downloadResult.error || "Download failed - no filename returned");
        }

        clientLogger.info(
          `Server download complete, fetching video file: ${downloadResult.filename}`
        );
        setDownloadProgress(50);

        // Step 2: Fetch the actual video file from serve-video endpoint
        const videoResponse = await fetch(
          `/api/youtube/serve-video?filename=${encodeURIComponent(downloadResult.filename)}`
        );

        if (!videoResponse.ok) {
          const errorData = await videoResponse.json().catch(() => ({}));
          throw new Error(
            (errorData as { error?: string }).error ||
              `Failed to fetch video: ${videoResponse.status}`
          );
        }

        // Read the video file with progress
        const reader = videoResponse.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const chunks: Uint8Array[] = [];
        let receivedLength = 0;
        const contentLength = parseInt(videoResponse.headers.get("Content-Length") || "0");

        // Read chunks until done
        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;
          if (result.value) {
            chunks.push(result.value);
            receivedLength += result.value.length;

            if (contentLength > 0) {
              // Progress from 50% to 100% during file transfer
              setDownloadProgress(50 + Math.round((receivedLength / contentLength) * 50));
            }
          }
        }

        // Combine chunks into blob
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        const blob = new Blob([combined], { type: "video/mp4" });
        const filename = downloadResult.filename;
        const file = new File([blob], filename, { type: "video/mp4" });

        clientLogger.info(`Video file fetched: ${filename}, size: ${file.size} bytes`);

        // Use upload service to create proper session with YouTube title if available
        const session = await uploadService.uploadVideo(file, undefined, downloadResult.title);

        setVideo(file, session);
        setUploadComplete(true);
        setStage("results");

        clientLogger.info(`YouTube download complete: ${filename}`);
        onUploadComplete?.(session);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Download failed";
        setDownloadError(message);
        clientLogger.error("YouTube download failed", { error: message });
        onError?.(message);
      } finally {
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    },
    [setVideo, setStage, onUploadComplete, onError]
  );

  const handleReset = useCallback(() => {
    clearVideo();
    setUploadComplete(false);
    setError(null);
    setDownloadError(null);
    setStage("upload");

    // Also reset the session store
    useSessionStore.getState().reset();

    clientLogger.info("Session reset");
  }, [clearVideo, setStage]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    isUploading,
    uploadComplete,
    isDownloading,
    downloadProgress,
    downloadError,
    error,

    // Actions
    handleFileSelect,
    handleUpload,
    handleYouTubeDownload,
    handleReset,

    // Derived state
    selectedFile,
    selectedFileName,
    videoObjectUrl,
    uploadSession,
  };
}

export default useVideoUpload;
