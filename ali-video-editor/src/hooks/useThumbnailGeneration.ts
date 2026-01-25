/**
 * React Hook for Thumbnail Generation
 *
 * Provides state management, API integration, and IndexedDB persistence for thumbnail generation.
 */

import { useCallback, useEffect, useState } from "react";
import { logError, logInfo } from "../lib/client-logger";
import browserHistoryService, { StoredThumbnail } from "../lib/database/browser-history-service";
import type { ThumbnailGenerationResult } from "../types";

/**
 * Request type for thumbnail generation
 */
export interface ThumbnailGenerationRequest {
  titleText: string;
  topic: string;
  style: "HIGH_ENERGY" | "MINIMAL_TECH" | "FINANCE" | "GAMING";
  videoId?: string;
  faceImageUrl?: string;
  brandOptions?: {
    primaryColor?: string;
    accentColor?: string;
    fontStyle?: "bold" | "modern" | "playful" | "professional";
  };
  guidanceScale?: number;
  numInferenceSteps?: number;
  seed?: number;
  huggingfaceApiKey?: string;
}

/**
 * Hook return type
 */
export interface UseThumbnailGenerationReturn {
  /** Generation status */
  status: "idle" | "generating" | "success" | "error";
  /** Generated thumbnail result */
  result: ThumbnailGenerationResult | null;
  /** Error message if generation failed */
  error: string | null;
  /** Generation history from IndexedDB */
  history: StoredThumbnail[];
  /** Generate a thumbnail */
  generate: (request: ThumbnailGenerationRequest) => Promise<void>;
  /** Save current result to history */
  saveToHistory: (videoId?: string) => Promise<void>;
  /** Load thumbnail history from IndexedDB */
  loadHistory: (videoId?: string) => Promise<void>;
  /** Restore thumbnail from history */
  restoreFromHistory: (thumbnailId: string) => void;
  /** Delete a thumbnail from history */
  deleteFromHistory: (thumbnailId: string) => Promise<void>;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for thumbnail generation with IndexedDB persistence
 */
export function useThumbnailGeneration(): UseThumbnailGenerationReturn {
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [result, setResult] = useState<ThumbnailGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<StoredThumbnail[]>([]);
  const [currentRequest, setCurrentRequest] = useState<ThumbnailGenerationRequest | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Generate a thumbnail via API
   */
  const generate = useCallback(async (request: ThumbnailGenerationRequest) => {
    setStatus("generating");
    setError(null);
    setResult(null);
    setCurrentRequest(request);

    try {
      logInfo("Starting thumbnail generation", "useThumbnailGeneration", {
        style: request.style,
        titleLength: request.titleText.length,
      });

      const response = await fetch("/api/thumbnails/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate thumbnail");
      }

      setResult(data);
      setStatus("success");

      logInfo("Thumbnail generation succeeded", "useThumbnailGeneration", {
        resultId: data.id,
        model: data.model,
        strategy: data.strategy,
        latencyMs: data.latencyMs,
      });

      // Auto-save to history if videoId provided
      if (request.videoId) {
        await saveResultToHistory(data, request);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setStatus("error");

      logError(err instanceof Error ? err : new Error(errorMessage), "useThumbnailGeneration");
    }
  }, []);

  /**
   * Load thumbnail history from IndexedDB
   */
  const loadHistory = useCallback(async (videoId?: string) => {
    try {
      let thumbnails: StoredThumbnail[];

      if (videoId) {
        thumbnails = await browserHistoryService.getThumbnailsByVideoId(videoId);
      } else {
        thumbnails = await browserHistoryService.getThumbnails(20);
      }

      setHistory(thumbnails);
    } catch (err) {
      logError(
        err instanceof Error ? err : new Error("Failed to load history"),
        "useThumbnailGeneration"
      );
    }
  }, []);

  /**
   * Save current result to IndexedDB history
   */
  const saveToHistory = useCallback(
    async (videoId?: string) => {
      if (!result || !currentRequest) {
        logError(new Error("No result to save"), "useThumbnailGeneration");
        return;
      }

      await saveResultToHistory(result, { ...currentRequest, videoId });
      await loadHistory(videoId);
    },
    [result, currentRequest, loadHistory]
  );

  /**
   * Internal function to save result to history
   */
  const saveResultToHistory = async (
    res: ThumbnailGenerationResult,
    req: ThumbnailGenerationRequest
  ) => {
    try {
      const storedThumbnail: StoredThumbnail = {
        id: res.id,
        videoId: req.videoId,
        imageData: res.imageData,
        titleText: req.titleText,
        topic: req.topic,
        style: req.style,
        model: res.model,
        strategy: res.strategy,
        seed: res.seed,
        generatedAt: new Date(res.generatedAt),
      };

      await browserHistoryService.saveThumbnail(storedThumbnail);

      logInfo("Thumbnail saved to history", "useThumbnailGeneration", {
        id: res.id,
        videoId: req.videoId,
      });
    } catch (err) {
      logError(
        err instanceof Error ? err : new Error("Failed to save thumbnail"),
        "useThumbnailGeneration"
      );
    }
  };

  /**
   * Restore thumbnail from history to current result
   */
  const restoreFromHistory = useCallback(
    (thumbnailId: string) => {
      const thumbnail = history.find((t) => t.id === thumbnailId);

      if (thumbnail) {
        setResult({
          id: thumbnail.id,
          imageData: thumbnail.imageData,
          width: 1280,
          height: 720,
          model: thumbnail.model,
          strategy: thumbnail.strategy as "SPECIALIZED" | "FALLBACK",
          prompt: "",
          seed: thumbnail.seed,
          latencyMs: 0,
          generatedAt: thumbnail.generatedAt,
        });
        setStatus("success");
        setError(null);

        logInfo("Thumbnail restored from history", "useThumbnailGeneration", {
          id: thumbnail.id,
        });
      }
    },
    [history]
  );

  /**
   * Delete a thumbnail from history
   */
  const deleteFromHistory = useCallback(async (thumbnailId: string) => {
    try {
      await browserHistoryService.deleteThumbnail(thumbnailId);
      setHistory((prev) => prev.filter((t) => t.id !== thumbnailId));

      logInfo("Thumbnail deleted from history", "useThumbnailGeneration", {
        id: thumbnailId,
      });
    } catch (err) {
      logError(
        err instanceof Error ? err : new Error("Failed to delete thumbnail"),
        "useThumbnailGeneration"
      );
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
    setCurrentRequest(null);
  }, []);

  return {
    status,
    result,
    error,
    history,
    generate,
    saveToHistory,
    loadHistory,
    restoreFromHistory,
    deleteFromHistory,
    reset,
  };
}
