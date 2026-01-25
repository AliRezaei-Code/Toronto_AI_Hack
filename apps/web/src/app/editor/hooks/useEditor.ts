"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Types
export interface EditableWord {
  id: string;
  word: string;
  start: number;
  end: number;
  clipIndex: number;
  isDeleted: boolean;
}

export interface UploadedClip {
  id: string;
  file: File;
  previewUrl: string;
  duration: number;
  order: number;
}

export interface EditorState {
  // Clips
  clips: UploadedClip[];
  isUploading: boolean;
  uploadProgress: number;

  // Job
  currentJobId: string | null;
  jobStatus: "idle" | "uploading" | "processing" | "completed" | "error";
  jobError: string | null;

  // Transcript
  words: EditableWord[];
  originalWords: EditableWord[];

  // Video
  videoUrl: string | null;
  currentTime: number;
  isPlaying: boolean;
  duration: number;

  // Editing
  isApplyingEdit: boolean;
  editMessage: string | null;

  // Export
  isExporting: boolean;
  exportedUrl: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useEditor() {
  // State
  const [clips, setClips] = useState<UploadedClip[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<EditorState["jobStatus"]>("idle");
  const [jobError, setJobError] = useState<string | null>(null);

  const [words, setWords] = useState<EditableWord[]>([]);
  const [originalWords, setOriginalWords] = useState<EditableWord[]>([]);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const [isApplyingEdit, setIsApplyingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add clips
  const addClips = useCallback((files: File[]) => {
    const newClips: UploadedClip[] = files.map((file, index) => ({
      id: `clip-${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      duration: 0,
      order: clips.length + index,
    }));
    setClips((prev) => [...prev, ...newClips].slice(0, 5));
  }, [clips.length]);

  // Remove clip
  const removeClip = useCallback((clipId: string) => {
    setClips((prev) => {
      const clip = prev.find((c) => c.id === clipId);
      if (clip) {
        URL.revokeObjectURL(clip.previewUrl);
      }
      return prev.filter((c) => c.id !== clipId);
    });
  }, []);

  // Reorder clips
  const reorderClips = useCallback((fromIndex: number, toIndex: number) => {
    setClips((prev) => {
      const newClips = [...prev];
      const [removed] = newClips.splice(fromIndex, 1);
      newClips.splice(toIndex, 0, removed);
      return newClips.map((c, i) => ({ ...c, order: i }));
    });
  }, []);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/job/${jobId}/status`);
      if (!response.ok) throw new Error("Failed to fetch job status");

      const data = await response.json();

      if (data.status === "completed") {
        setJobStatus("completed");
        setVideoUrl(data.video_url);

        // Parse transcript into words
        if (data.transcript?.clips) {
          const allWords: EditableWord[] = [];
          let wordId = 0;

          data.transcript.clips.forEach((clip: any, clipIndex: number) => {
            clip.segments?.forEach((segment: any) => {
              segment.words?.forEach((word: any) => {
                allWords.push({
                  id: `word-${wordId++}`,
                  word: word.word,
                  start: word.start,
                  end: word.end,
                  clipIndex,
                  isDeleted: false,
                });
              });
            });
          });

          setWords(allWords);
          setOriginalWords(allWords.map((w) => ({ ...w })));
          setDuration(data.transcript.duration || 0);
        }

        // Clear polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else if (data.status === "error") {
        setJobStatus("error");
        setJobError(data.error || "Processing failed");

        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else {
        setJobStatus("processing");
      }
    } catch (err) {
      console.error("Poll error:", err);
    }
  }, []);

  // Upload and process clips
  const processClips = useCallback(async () => {
    if (clips.length < 1) {
      setJobError("Please add at least 1 video clip");
      return;
    }

    setIsUploading(true);
    setJobStatus("uploading");
    setJobError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // Add clips to form data
      clips.forEach((clip, index) => {
        formData.append(`clip_${index}`, clip.file);
      });

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }

      const data = await response.json();
      setCurrentJobId(data.job_id);
      setJobStatus("processing");

      // Start polling for job status
      pollIntervalRef.current = setInterval(() => {
        pollJobStatus(data.job_id);
      }, 2000);

      // Initial poll
      pollJobStatus(data.job_id);
    } catch (err: any) {
      setJobStatus("error");
      setJobError(err.message || "Failed to upload clips");
    } finally {
      setIsUploading(false);
    }
  }, [clips, pollJobStatus]);

  // Toggle word deletion
  const toggleWordDeletion = useCallback((wordId: string) => {
    setWords((prev) =>
      prev.map((w) =>
        w.id === wordId ? { ...w, isDeleted: !w.isDeleted } : w
      )
    );
  }, []);

  // Delete selected words (by indices)
  const deleteWords = useCallback((wordIds: string[]) => {
    setWords((prev) =>
      prev.map((w) =>
        wordIds.includes(w.id) ? { ...w, isDeleted: true } : w
      )
    );
  }, []);

  // Restore all words
  const restoreAllWords = useCallback(() => {
    setWords((prev) => prev.map((w) => ({ ...w, isDeleted: false })));
  }, []);

  // Apply edit via prompt (natural language)
  const applyPromptEdit = useCallback(async (prompt: string) => {
    if (!currentJobId) {
      setJobError("No job to edit");
      return;
    }

    setIsApplyingEdit(true);
    setEditMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/agent/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: currentJobId,
          query: prompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Edit failed");
      }

      const data = await response.json();
      setEditMessage(data.message || "Edit applied successfully");
      setVideoUrl(data.video_url);

      // Update transcript
      if (data.transcript?.words) {
        const updatedWords: EditableWord[] = data.transcript.words.map(
          (word: any, index: number) => ({
            id: `word-${index}`,
            word: word.word,
            start: word.start,
            end: word.end,
            clipIndex: 0,
            isDeleted: false,
          })
        );
        setWords(updatedWords);
      }
    } catch (err: any) {
      setJobError(err.message || "Failed to apply edit");
    } finally {
      setIsApplyingEdit(false);
    }
  }, [currentJobId]);

  // Apply script edit (deleted words → time ranges → cut)
  const applyScriptEdit = useCallback(async () => {
    if (!currentJobId) {
      setJobError("No job to edit");
      return;
    }

    const deletedWords = words.filter((w) => w.isDeleted);
    if (deletedWords.length === 0) {
      setEditMessage("No changes to apply");
      return;
    }

    // Build a description of what to cut
    const cutRanges = deletedWords.map((w) => `${w.start.toFixed(2)}-${w.end.toFixed(2)}`);
    const prompt = `Cut the following time ranges from the video: ${cutRanges.join(", ")}`;

    await applyPromptEdit(prompt);
  }, [currentJobId, words, applyPromptEdit]);

  // Export video
  const exportVideo = useCallback(async (platform: "tiktok" | "reels" | "shorts" = "tiktok") => {
    if (!currentJobId) {
      setJobError("No video to export");
      return;
    }

    setIsExporting(true);
    setExportedUrl(null);

    try {
      const response = await fetch(`${API_URL}/api/director/render-short`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: currentJobId,
          clip_id: "main",
          caption_style: "hormozi",
          platform,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Export failed");
      }

      const data = await response.json();
      setExportedUrl(data.video_url);
    } catch (err: any) {
      setJobError(err.message || "Failed to export video");
    } finally {
      setIsExporting(false);
    }
  }, [currentJobId]);

  // Seek video to time
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Play/pause video
  const togglePlayback = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      clips.forEach((clip) => URL.revokeObjectURL(clip.previewUrl));
    };
  }, []);

  return {
    // State
    clips,
    isUploading,
    uploadProgress,
    currentJobId,
    jobStatus,
    jobError,
    words,
    originalWords,
    videoUrl,
    currentTime,
    isPlaying,
    duration,
    isApplyingEdit,
    editMessage,
    isExporting,
    exportedUrl,
    videoRef,

    // Actions
    addClips,
    removeClip,
    reorderClips,
    processClips,
    toggleWordDeletion,
    deleteWords,
    restoreAllWords,
    applyPromptEdit,
    applyScriptEdit,
    exportVideo,
    seekTo,
    togglePlayback,
    setCurrentTime,
    setIsPlaying,
    setJobError,
    setEditMessage,
  };
}
