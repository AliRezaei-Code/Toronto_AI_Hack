"use client";

import { FloatingLimeOrb } from "@/components/ui/FloatingLimeOrb";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { AlertCircle, Check, FileVideo, Loader2, Youtube } from "lucide-react";
import { useRef, useState } from "react";

interface UploadStageProps {
  isUploading: boolean;
  uploadProgress: number;
  uploadComplete?: boolean;
  onFileSelect: (file: File) => void;
  onUpload: () => void;
  onReset: () => void;
  selectedFile: File | null;
  className?: string;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  analyzeProgress?: number;
  onTranscribe?: () => void;
  isTranscribing?: boolean;
  onYouTubeDownload?: (url: string) => void;
  isDownloading?: boolean;
  downloadProgress?: number;
  downloadError?: string | null;
}

type UploadMethod = "file" | "youtube";

export function UploadStage({
  isUploading,
  uploadProgress,
  uploadComplete = false,
  onFileSelect,
  onUpload,
  onReset,
  selectedFile,
  className,
  onAnalyze: _onAnalyze,
  isAnalyzing = false,
  analyzeProgress = 0,
  onTranscribe,
  isTranscribing = false,
  onYouTubeDownload,
  isDownloading = false,
  downloadProgress = 0,
  downloadError = null,
}: UploadStageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>("file");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      setUrlError("");
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      onFileSelect(file);
      setUrlError("");
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(e.target.value);
    setUrlError("");

    if (downloadError) {
      setUrlError("");
    }
  };

  const validateYouTubeUrl = (url: string): boolean => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
    return pattern.test(url);
  };

  const handleYouTubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!youtubeUrl.trim()) {
      setUrlError("Please enter a YouTube URL");
      return;
    }

    if (!validateYouTubeUrl(youtubeUrl)) {
      setUrlError("Please enter a valid YouTube URL");
      return;
    }

    if (onYouTubeDownload) {
      onYouTubeDownload(youtubeUrl);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Area */}
      <motion.div
        className="relative overflow-hidden rounded-none border border-gray-700 bg-gray-800 p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 24 }}
        whileHover={{ rotateX: -1.5, rotateY: 1.5 }}
        style={{ transformPerspective: 1000 }}
      >
        <FloatingLimeOrb className="absolute -right-10 -top-16 opacity-35" size={160} />
        <div className="relative z-10">
          <h3 className="mb-4 text-lg font-semibold text-white">Upload Video</h3>

          {/* Upload Method Toggle */}
          {!selectedFile && !isDownloading && (
            <div className="mb-6">
              <div className="flex rounded-lg bg-gray-700 p-1">
                <button
                  onClick={() => {
                    setUploadMethod("file");
                    setUrlError("");
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all",
                    uploadMethod === "file"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <FileVideo className="h-4 w-4" />
                  File Upload
                </button>
                <button
                  onClick={() => {
                    setUploadMethod("youtube");
                    setUrlError("");
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all",
                    uploadMethod === "youtube"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <Youtube className="h-4 w-4" />
                  YouTube URL
                </button>
              </div>
            </div>
          )}

          {/* File Upload Section */}
          {!selectedFile && !isDownloading && uploadMethod === "file" && (
            <motion.div
              className={cn(
                "relative flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-none border-2 border-dashed",
                isDragging
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-600 hover:border-blue-500 hover:bg-gray-700/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              animate={isDragging ? { scale: 1.02, borderColor: "rgb(59 130 246)" } : {}}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="video-upload"
              />
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <svg
                  className="mb-4 h-16 w-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">MP4, MOV, AVI, WEBM, MKV (MAX. 2GB)</p>
              </div>
            </motion.div>
          )}

          {/* YouTube URL Section */}
          {!selectedFile && !isDownloading && uploadMethod === "youtube" && (
            <form onSubmit={handleYouTubeSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-300">
                  YouTube Video URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    id="youtube-url"
                    value={youtubeUrl}
                    onChange={handleUrlChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={cn(
                      "w-full rounded-lg border bg-gray-700 px-4 py-3 pr-10 text-white placeholder-gray-500 transition-colors",
                      urlError
                        ? "border-red-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        : "border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    )}
                    disabled={isDownloading}
                  />
                  {youtubeUrl && !urlError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
                {urlError && (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{urlError}</span>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <button
                type="submit"
                disabled={isDownloading || !youtubeUrl.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-600"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Downloading Video...
                  </>
                ) : (
                  <>
                    <Youtube className="h-4 w-4" />
                    Download from YouTube
                  </>
                )}
              </button>

              {/* URL Info */}
              <div className="rounded-lg bg-gray-700/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Youtube className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-gray-300">How it works</p>
                    <ul className="space-y-1 text-xs text-gray-400">
                      <li>• Paste any YouTube video URL above</li>
                      <li>• We&apos;ll download it to your project folder</li>
                      <li>• Then proceed with transcription & analysis</li>
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Download Progress */}
          {isDownloading && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-600 bg-blue-900/20 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-400">Downloading from YouTube...</p>
                    <p className="text-xs text-blue-300/70">
                      Please wait while we fetch your video
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-medium text-white">{Math.round(downloadProgress)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-700">
                    <div
                      className="h-2 animate-pulse rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  {youtubeUrl && <p className="truncate text-xs text-gray-500">{youtubeUrl}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Download Error */}
          {downloadError && !isDownloading && (
            <div className="rounded-lg border border-red-600 bg-red-900/30 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400">Download Failed</p>
                  <p className="mt-1 text-xs text-red-300/70">{downloadError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Selected File Info & Workflow */}
          {selectedFile && !isDownloading && (
            <div className="space-y-4">
              {/* Workflow Steps */}
              <div className="rounded-lg bg-gray-700/50 p-4">
                <h4 className="mb-3 text-sm font-medium text-gray-300">Workflow Steps</h4>
                <div className="space-y-2">
                  {/* Step 1: Upload */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${uploadComplete ? "bg-green-600" : isUploading ? "bg-blue-600" : "bg-gray-600"}`}
                    >
                      {uploadComplete ? (
                        <svg
                          className="h-3.5 w-3.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : isUploading ? (
                        <svg
                          className="h-3.5 w-3.5 animate-spin text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <span className="text-xs font-medium text-white">1</span>
                      )}
                    </div>
                    <span className={`text-sm ${uploadComplete ? "text-white" : "text-gray-400"}`}>
                      Upload Video
                    </span>
                  </div>

                  {/* Step 2: Transcribe */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${uploadComplete ? "bg-gray-600" : "bg-gray-800"}`}
                    >
                      <span className="text-xs font-medium text-gray-400">2</span>
                    </div>
                    <span className="text-sm text-gray-400">Transcribe Audio</span>
                  </div>

                  {/* Step 3: Analyze */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${uploadComplete ? "bg-gray-600" : "bg-gray-800"}`}
                    >
                      <span className="text-xs font-medium text-gray-400">3</span>
                    </div>
                    <span className="text-sm text-gray-400">AI Analysis</span>
                  </div>
                </div>
              </div>

              {/* Upload Complete Success Message */}
              {uploadComplete && !isUploading && (
                <motion.div
                  className="rounded-none border border-green-600 bg-green-900/30 p-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="flex items-start space-x-3">
                    <motion.div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-none bg-green-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
                    >
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-400">Upload Complete!</p>
                      <p className="mt-1 text-xs text-green-300/70">
                        Your video is ready. Click &quot;Transcribe&quot; to extract the audio
                        transcript.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Selected File Info */}
              <div className="rounded-none bg-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {uploadMethod === "youtube" && (
                        <Youtube className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                      <p className="truncate text-sm font-medium text-white">{selectedFile.name}</p>
                    </div>
                    <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={onReset}
                    className="ml-4 text-gray-400 transition-colors hover:text-white"
                    title="Remove file and start over"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Uploading video...</span>
                    <motion.span
                      className="text-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={uploadProgress}
                    >
                      {Math.round(uploadProgress)}%
                    </motion.span>
                  </div>
                  <div className="h-2 w-full bg-gray-700">
                    <motion.div
                      className="h-2 bg-blue-600"
                      initial={{ width: "0%" }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Please wait while we process your video...
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Upload Button */}
                {!uploadComplete && (
                  <button
                    onClick={onUpload}
                    disabled={isUploading}
                    className="w-full rounded-none bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600"
                  >
                    {isUploading ? "Uploading..." : "Upload Video"}
                  </button>
                )}

                {/* Transcribe Button */}
                {uploadComplete && !isTranscribing && onTranscribe && (
                  <button
                    onClick={onTranscribe}
                    className="w-full rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700"
                  >
                    Transcribe Audio
                  </button>
                )}

                {/* Transcription Progress Bar */}
                {isTranscribing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Transcribing audio...</span>
                      <span className="font-medium text-white">Processing</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-700">
                      <div
                        className="h-2 animate-pulse rounded-full bg-green-600"
                        style={{ width: "60%" }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Deepgram is transcribing your video. This may take a moment...
                    </p>
                  </div>
                )}

                {/* Analysis Progress Bar */}
                {isAnalyzing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Analyzing video...</span>
                      <motion.span
                        className="text-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={analyzeProgress}
                      >
                        {Math.round(analyzeProgress)}%
                      </motion.span>
                    </div>
                    <div className="h-2 w-full bg-gray-700">
                      <motion.div
                        className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"
                        initial={{ width: "0%" }}
                        animate={{ width: `${analyzeProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      AI is analyzing your video content. This may take a few minutes...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Supported Formats */}
      <div className="rounded-none border border-gray-700 bg-gray-800 p-6">
        <h4 className="mb-3 text-sm font-medium text-gray-300">Supported Formats</h4>
        <div className="flex flex-wrap gap-2">
          {["MP4", "MOV", "AVI", "WEBM", "MKV"].map((format, index) => (
            <motion.span
              key={format}
              className="rounded-none bg-gray-700 px-3 py-1 text-xs text-gray-300"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {format}
            </motion.span>
          ))}
          <span className="flex items-center gap-1 rounded-full border border-red-700 bg-red-900/50 px-3 py-1 text-xs text-red-300">
            <Youtube className="h-3 w-3" />
            YouTube
          </span>
        </div>
      </div>
    </div>
  );
}
