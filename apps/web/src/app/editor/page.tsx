"use client";

import React from "react";
import Link from "next/link";
import { Download, ChevronRight, Film, AlertCircle, X } from "lucide-react";
import { LucideIcon } from "@/lib/lucide-icon";
import { useEditor } from "./hooks/useEditor";
import { MultiClipUpload } from "./components/MultiClipUpload";
import { ScriptEditor } from "./components/ScriptEditor";
import { PromptBox } from "./components/PromptBox";
import { VideoPreview } from "./components/VideoPreview";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function EditorPage() {
  const {
    // State
    clips,
    isUploading,
    currentJobId,
    jobStatus,
    jobError,
    words,
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
  } = useEditor();

  // Check if there are changes to apply
  const hasChanges = words.some((w) => w.isDeleted);

  // Get full video URL
  const fullVideoUrl = videoUrl
    ? videoUrl.startsWith("http")
      ? videoUrl
      : `${API_URL}${videoUrl}`
    : null;

  // Handle export
  const handleExport = async () => {
    await exportVideo("tiktok");
  };

  // Handle download
  const handleDownload = async (url: string, filename: string) => {
    try {
      const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename || "video.mp4";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download:", err);
      setJobError("Failed to download video");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <LucideIcon Icon={Film} className="text-purple-500" size={32} />
              <h1 className="text-4xl font-bold text-white">Quick Cut Editor</h1>
            </div>
            <div className="flex items-center gap-3">
              {exportedUrl && (
                <button
                  onClick={() => handleDownload(exportedUrl!, "edited-video.mp4")}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <LucideIcon Icon={Download} size={18} />
                  Download
                </button>
              )}
              {currentJobId && jobStatus === "completed" && !exportedUrl && (
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <LucideIcon Icon={Download} size={18} />
                      Export 9:16
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <p className="text-slate-400">
            Edit videos by editing text. Delete words to cut them from the video.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors"
          >
            Home
          </Link>
          <LucideIcon Icon={ChevronRight} size={16} className="text-slate-600" />
          <Link
            href="/ai-director"
            className="text-slate-400 hover:text-white transition-colors"
          >
            AI Director
          </Link>
          <LucideIcon Icon={ChevronRight} size={16} className="text-slate-600" />
          <span className="text-white">Editor</span>
        </div>

        {/* Error Message */}
        {jobError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
            <LucideIcon
              Icon={AlertCircle}
              size={20}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <p className="text-red-400">{jobError}</p>
            </div>
            <button
              onClick={() => setJobError(null)}
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              <LucideIcon Icon={X} size={18} />
            </button>
          </div>
        )}

        {/* Status Messages */}
        {jobStatus === "uploading" && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <p className="text-blue-400">Uploading videos...</p>
          </div>
        )}

        {jobStatus === "processing" && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <p className="text-yellow-400">
              Processing videos and generating transcript...
            </p>
          </div>
        )}

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Video Preview & Upload */}
          <div className="space-y-6">
            {/* Video Preview */}
            <VideoPreview
              videoUrl={fullVideoUrl}
              videoRef={videoRef}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onTimeUpdate={setCurrentTime}
              onPlayPause={togglePlayback}
              onSeek={seekTo}
            />

            {/* Multi-Clip Upload */}
            <MultiClipUpload
              clips={clips}
              isUploading={isUploading || jobStatus === "uploading" || jobStatus === "processing"}
              onAddClips={addClips}
              onRemoveClip={removeClip}
              onReorderClips={reorderClips}
              onProcess={processClips}
              minClips={1}
              maxClips={5}
            />
          </div>

          {/* Right Column: Script Editor & Prompt Box */}
          <div className="space-y-6">
            {/* Script Editor */}
            <ScriptEditor
              words={words}
              currentTime={currentTime}
              isLoading={isApplyingEdit}
              onToggleWord={toggleWordDeletion}
              onDeleteWords={deleteWords}
              onRestoreAll={restoreAllWords}
              onWordClick={seekTo}
              onApplyChanges={applyScriptEdit}
              hasChanges={hasChanges}
            />

            {/* Prompt Box */}
            <PromptBox
              onSubmit={applyPromptEdit}
              isLoading={isApplyingEdit}
              isDisabled={!currentJobId || jobStatus !== "completed"}
              message={editMessage}
            />
          </div>
        </div>

        {/* Export Success Message */}
        {exportedUrl && (
          <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400">
              Video exported successfully! Click the Download button above to save it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
