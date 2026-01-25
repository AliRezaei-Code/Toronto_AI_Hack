"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Upload,
  Play,
  RefreshCw,
  Trash2,
  Download,
  Film,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Zap,
  Video,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

// Types matching backend models
interface ViralClip {
  id: string;
  job_id: string;
  start_time: number;
  end_time: number;
  duration: number;
  virality_score: number;
  hook_type: string;
  hook_strength: number;
  suggested_titles: string[];
  emphasis_words: string[];
  summary: string;
  speakers: number[];
  transcript_text: string;
}

interface DirectorJob {
  job_id: string;
  status: string;
  progress_percent: number;
  current_step: string;
  viral_clips_found: number;
  shorts_rendered: number;
  error?: string;
  created_at?: string;
}

type JobStatus =
  | "queued"
  | "transcribing"
  | "diarizing"
  | "selecting_clips"
  | "tracking_faces"
  | "generating_layout"
  | "rendering"
  | "completed"
  | "failed";

const STATUS_CONFIG: Record<
  JobStatus,
  { color: string; icon: LucideIcon; label: string }
> = {
  queued: { color: "bg-gray-500", icon: Clock, label: "Queued" },
  transcribing: {
    color: "bg-blue-500",
    icon: MessageSquare,
    label: "Transcribing",
  },
  diarizing: {
    color: "bg-indigo-500",
    icon: Users,
    label: "Identifying Speakers",
  },
  selecting_clips: {
    color: "bg-purple-500",
    icon: Sparkles,
    label: "Finding Viral Moments",
  },
  tracking_faces: {
    color: "bg-pink-500",
    icon: Video,
    label: "Tracking Faces",
  },
  generating_layout: {
    color: "bg-orange-500",
    icon: Film,
    label: "Generating Layout",
  },
  rendering: {
    color: "bg-yellow-500",
    icon: Zap,
    label: "Rendering",
  },
  completed: {
    color: "bg-green-500",
    icon: CheckCircle,
    label: "Completed",
  },
  failed: {
    color: "bg-red-500",
    icon: XCircle,
    label: "Failed"
  },
};

// Helper to render Lucide icons in a consistent way
function LucideIconComponent(Icon: LucideIcon, props: React.ComponentProps<"svg"> & { size?: number; className?: string }) {
  return React.createElement(Icon as any, { ...props });
}

// Job Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as JobStatus] || STATUS_CONFIG.queued;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white ${config.color}`}
    >
      {LucideIconComponent(config.icon, { size: 16 })}
      {config.label}
    </span>
  );
}

// Progress Bar Component
function ProgressBar({
  progress,
  status,
}: {
  progress: number;
  status: string;
}) {
  const isActive = !["completed", "failed"].includes(status);

  return (
    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${
          status === "failed"
            ? "bg-red-500"
            : status === "completed"
              ? "bg-green-500"
              : "bg-blue-500"
        } ${isActive ? "animate-pulse" : ""}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}

// Rendered Short interface
interface RenderedShort {
  clip_id: string;
  video_url: string;
  status: "rendering" | "completed" | "failed";
}

// Video Preview Modal Component
function VideoPreviewModal({
  videoUrl,
  title,
  onClose,
  onDownload,
}: {
  videoUrl: string;
  title: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-white font-semibold truncate">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            title="Close"
            aria-label="Close"
            type="button"
          >
            {LucideIconComponent(XCircle, { size: 24 })}
          </button>
        </div>
        <div className="p-4">
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full rounded-lg bg-black max-h-[60vh]"
          />
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            title="Download"
            aria-label="Download"
            type="button"
          >
            {LucideIconComponent(Download, { size: 18 })}
            Download
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            title="Close"
            aria-label="Close"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Viral Clip Card Component
function ViralClipCard({
  clip,
  renderedShort,
  onRender,
  onPreview,
  onDownload,
  apiUrl,
}: {
  clip: ViralClip;
  renderedShort?: RenderedShort;
  onRender: (clipId: string) => void;
  onPreview: (videoUrl: string, title: string) => void;
  onDownload: (videoUrl: string, filename: string) => void;
  apiUrl: string;
}) {
  const hookColors: Record<string, string> = {
    question: "bg-blue-500",
    shock: "bg-red-500",
    story: "bg-purple-500",
    result: "bg-green-500",
    controversy: "bg-orange-500",
    promise: "bg-pink-500",
  };

  const isRendered = renderedShort?.status === "completed";
  const isRendering = renderedShort?.status === "rendering";
  const videoUrl = renderedShort?.video_url ? `${apiUrl}${renderedShort.video_url}` : null;
  const title = clip.suggested_titles[0] || clip.summary;

  return (
    <div className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors border border-slate-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium text-white ${hookColors[clip.hook_type] || "bg-gray-500"}`}
          >
            {clip.hook_type.toUpperCase()}
          </span>
          <span className="text-slate-400 text-sm">
            {Math.floor(clip.duration)}s
          </span>
        </div>
        <div className="flex items-center gap-1">
          {LucideIconComponent(Sparkles, { size: 14, className: "text-yellow-400" })}
          <span className="text-yellow-400 font-bold text-sm">
            {clip.virality_score.toFixed(0)}
          </span>
        </div>
      </div>

      <h4 className="text-white font-medium mb-2 line-clamp-2">
        {title}
      </h4>

      <p className="text-slate-400 text-sm mb-3 line-clamp-2">
        {clip.transcript_text.substring(0, 100)}...
      </p>

      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs">
          {formatTime(clip.start_time)} - {formatTime(clip.end_time)}
        </span>

        <div className="flex items-center gap-2">
          {isRendered && videoUrl ? (
            <>
              <button
                onClick={() => onPreview(videoUrl, title)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1"
                title="Preview"
                aria-label="Preview"
                type="button"
              >
                {LucideIconComponent(Play, { size: 14 })}
                Preview
              </button>
              <button
                onClick={() => onDownload(videoUrl, `${clip.id}.mp4`)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1"
                title="Download"
                aria-label="Download"
                type="button"
              >
                {LucideIconComponent(Download, { size: 14 })}
              </button>
            </>
          ) : isRendering ? (
            <span className="text-yellow-400 text-sm flex items-center gap-1">
              {LucideIconComponent(RefreshCw, { size: 14, className: "animate-spin" })}
              Rendering...
            </span>
          ) : (
            <button
              onClick={() => onRender(clip.id)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1"
              title="Render"
              aria-label="Render"
              type="button"
            >
              {LucideIconComponent(Film, { size: 14 })}
              Render
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Upload Zone Component
function UploadZone({
  onUpload,
  isUploading,
}: {
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("video/")) {
        onUpload(file);
      }
    },
    [onUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
      }
    },
    [onUpload],
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      className={`
        border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
        ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-slate-600 hover:border-slate-500"}
        ${isUploading ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      <input
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
        id="video-upload"
        disabled={isUploading}
      />
      <label htmlFor="video-upload" className="cursor-pointer">
       {LucideIconComponent(Upload, { size: 48 })}
        <h3 className="text-xl font-semibold text-white mb-2">
          {isUploading ? "Uploading..." : "Upload Video"}
        </h3>
        <p className="text-slate-400 mb-4">
          Drag and drop your interview or podcast video, or click to browse
        </p>
        <p className="text-slate-500 text-sm">
          Supports MP4, MOV, WebM up to 2GB
        </p>
      </label>
    </div>
  );
}

// Job Card Component
function JobCard({
  job,
  clips,
  renderedShorts,
  onRefresh,
  onDelete,
  onRenderClip,
  onPreview,
  onDownload,
  isExpanded,
  onToggle,
  apiUrl,
}: {
  job: DirectorJob;
  clips: ViralClip[];
  renderedShorts: Record<string, RenderedShort>;
  onRefresh: () => void;
  onDelete: () => void;
  onRenderClip: (clipId: string) => void;
  onPreview: (videoUrl: string, title: string) => void;
  onDownload: (videoUrl: string, filename: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  apiUrl: string;
}) {
  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-slate-750 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* @ts-expect-error - Ignore icon type errors */}
            <ChevronRight
              size={20}
              className={`text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">
                  Job {job.job_id.substring(0, 8)}
                </span>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-slate-400 text-sm mt-1">
                {job.current_step || "Processing..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-white font-bold">
                {job.viral_clips_found}
              </div>
              <div className="text-slate-400 text-xs">clips found</div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">{job.shorts_rendered}</div>
              <div className="text-slate-400 text-xs">rendered</div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-400">Progress</span>
            <span className="text-white font-medium">
              {job.progress_percent.toFixed(0)}%
            </span>
          </div>
          <ProgressBar progress={job.progress_percent} status={job.status} />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-700 p-4">
          {/* Error Message */}
          {job.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 flex items-start gap-2">
              {/* @ts-expect-error - Ignore icon type errors */}
              <AlertCircle
                size={18}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-red-400 text-sm">{job.error}</p>
            </div>
          )}

          {/* Viral Clips */}
          {clips.length > 0 && (
            <div className="mb-4">
              <h4 className="text-white font-medium mb-3">Viral Clips</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clips.map((clip) => (
                  <ViralClipCard
                    key={clip.id}
                    clip={clip}
                    renderedShort={renderedShorts[clip.id]}
                    onRender={onRenderClip}
                    onPreview={onPreview}
                    onDownload={onDownload}
                    apiUrl={apiUrl}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors"
            >
              {/* @ts-expect-error - Ignore icon type errors */}
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-colors"
            >
              {/* @ts-expect-error - Ignore icon type errors */}
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Main AI Director Page
export default function AIDirectorPage() {
  const [jobs, setJobs] = useState<DirectorJob[]>([]);
  const [clips, setClips] = useState<Record<string, ViralClip[]>>({});
  const [renderedShorts, setRenderedShorts] = useState<Record<string, RenderedShort>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/director/jobs`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  };

  const fetchClips = async (jobId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/director/clips/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setClips((prev) => ({ ...prev, [jobId]: data.clips || [] }));
      }
    } catch (err) {
      console.error("Failed to fetch clips:", err);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("caption_style", "hormozi");
      formData.append("target_platform", "tiktok");
      formData.append("max_clips", "5");

      const response = await fetch(`${API_URL}/api/director/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setExpandedJob(data.job_id);
      fetchJobs();
    } catch (err) {
      setError("Failed to upload video. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRefreshJob = async (jobId: string) => {
    await fetchJobs();
    await fetchClips(jobId);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await fetch(`${API_URL}/api/director/job/${jobId}`, { method: "DELETE" });
      fetchJobs();
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  };

  const handleRenderClip = async (jobId: string, clipId: string) => {
    try {
      // Mark as rendering
      setRenderedShorts((prev) => ({
        ...prev,
        [clipId]: { clip_id: clipId, video_url: "", status: "rendering" },
      }));

      const response = await fetch(`${API_URL}/api/director/render-short`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          clip_id: clipId,
          caption_style: "hormozi",
          platform: "tiktok",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRenderedShorts((prev) => ({
          ...prev,
          [clipId]: {
            clip_id: clipId,
            video_url: data.video_url,
            status: "completed",
          },
        }));
        fetchJobs();
      } else {
        setRenderedShorts((prev) => ({
          ...prev,
          [clipId]: { clip_id: clipId, video_url: "", status: "failed" },
        }));
      }
    } catch (err) {
      console.error("Failed to render clip:", err);
      setRenderedShorts((prev) => ({
        ...prev,
        [clipId]: { clip_id: clipId, video_url: "", status: "failed" },
      }));
    }
  };

  const handlePreview = (videoUrl: string, title: string) => {
    setPreviewVideo({ url: videoUrl, title });
  };

  const handleDownload = async (videoUrl: string, filename: string) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download:", err);
    }
  };

  const handleToggleJob = (jobId: string) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
    } else {
      setExpandedJob(jobId);
      if (!clips[jobId]) {
        fetchClips(jobId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {/* @ts-expect-error - Ignore icon type errors */}
            <Sparkles className="text-purple-500" size={32} />
            <h1 className="text-4xl font-bold text-white">AI Director</h1>
          </div>
          <p className="text-slate-400">
            Automatically transform long-form interviews into viral short-form
            content
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors"
          >
            Home
          </Link>
          {/* @ts-expect-error - Ignore icon type errors */}
          <ChevronRight size={16} className="text-slate-600" />
          <span className="text-white">AI Director</span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
            {/* @ts-expect-error - Ignore icon type errors */}
            <AlertCircle
              size={20}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 text-sm underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <div className="mb-8">
          <UploadZone onUpload={handleUpload} isUploading={isUploading} />
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Processing Jobs
            </h2>
            <button
              onClick={fetchJobs}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
            >
              {/* @ts-expect-error - Ignore icon type errors */}
              <RefreshCw size={14} />
              Refresh All
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
              {/* @ts-expect-error - Ignore icon type errors */}
              <Film size={48} className="mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Jobs Yet
              </h3>
              <p className="text-slate-400">
                Upload a video to get started with AI-powered clip generation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.job_id}
                  job={job}
                  clips={clips[job.job_id] || []}
                  renderedShorts={renderedShorts}
                  onRefresh={() => handleRefreshJob(job.job_id)}
                  onDelete={() => handleDeleteJob(job.job_id)}
                  onRenderClip={(clipId) =>
                    handleRenderClip(job.job_id, clipId)
                  }
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  isExpanded={expandedJob === job.job_id}
                  onToggle={() => handleToggleJob(job.job_id)}
                  apiUrl={API_URL}
                />
              ))}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              {/* @ts-expect-error - Ignore icon type errors */}
              <MessageSquare className="text-blue-500" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Smart Transcription
            </h3>
            <p className="text-slate-400 text-sm">
              Speaker diarization identifies who{"'"}s talking and when,
              enabling multi-speaker layouts.
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              {/* @ts-expect-error - Ignore icon type errors */}
              <Sparkles className="text-purple-500" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Viral Detection
            </h3>
            <p className="text-slate-400 text-sm">
              AI identifies the most engaging moments with hooks, stories, and
              emotional peaks.
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
              {/* @ts-expect-error - Ignore icon type errors */}
              <Video className="text-pink-500" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Smart Cropping
            </h3>
            <p className="text-slate-400 text-sm">
              Face tracking keeps speakers in frame with dynamic 9:16 cropping
              for vertical video.
            </p>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      {previewVideo && (
        <VideoPreviewModal
          videoUrl={previewVideo.url}
          title={previewVideo.title}
          onClose={() => setPreviewVideo(null)}
          onDownload={() => {
            handleDownload(previewVideo.url, "video.mp4");
          }}
        />
      )}
    </div>
  );
}
