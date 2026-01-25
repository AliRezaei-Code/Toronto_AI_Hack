"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Upload, Film, FileVideo, X } from "lucide-react";
import {
  emitParticleBurstFromElement,
  emitParticleBurstFromEvent,
} from "@/src/lib/particle-events";

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadStatus?: string;
  onDemo?: () => void;
}

interface FileWithInfo {
  file: File;
  id: string;
}

export function UploadZone({
  onUpload,
  isUploading = false,
  uploadProgress = 0,
  uploadStatus = "",
  onDemo,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithInfo[]>([]);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const uploadCardRef = useRef<HTMLDivElement>(null);
  const lastBurstRef = useRef(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    emitParticleBurstFromEvent(e, { color: "#38bdf8", intensity: 1.2 });

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("video/"),
    );

    addFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith("video/"),
    );

    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const fileWithInfo = files.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));

    const newFiles = [...selectedFiles, ...fileWithInfo].slice(0, 5);
    setSelectedFiles(newFiles);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = () => {
    if (selectedFiles.length >= 3 && selectedFiles.length <= 5) {
      emitParticleBurstFromElement(dropZoneRef.current, {
        color: "#60a5fa",
        intensity: 1.4,
      });
      onUpload(selectedFiles.map((f) => f.file));
      setSelectedFiles([]);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return "bg-blue-500";
    if (progress < 70) return "bg-blue-600";
    return "bg-green-500";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isValidCount = selectedFiles.length >= 3 && selectedFiles.length <= 5;

  useEffect(() => {
    if (!isUploading) {
      lastBurstRef.current = 0;
      return;
    }

    const milestone = Math.floor(uploadProgress / 20) * 20;
    if (milestone > 0 && milestone !== lastBurstRef.current) {
      lastBurstRef.current = milestone;
      const intensity = Math.min(1.6, 0.6 + milestone / 100);
      emitParticleBurstFromElement(uploadCardRef.current, {
        color: milestone >= 80 ? "#22c55e" : "#38bdf8",
        intensity,
      });
    }
  }, [isUploading, uploadProgress]);

  if (isUploading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="w-full max-w-2xl p-12 bg-gray-800 rounded-2xl"
          ref={uploadCardRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="text-center mb-8">
            <motion.div
              className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <h3 className="text-2xl font-semibold mb-2">
              Uploading & Processing
            </h3>
            <p className="text-gray-400">
              {uploadStatus || "Uploading your videos..."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className={`h-full ${getProgressColor(uploadProgress)}`}
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Upload Progress</span>
              <span className="text-white font-medium">{uploadProgress}%</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-900/30 border border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Film className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm text-gray-300">
                  This may take 1-3 minutes depending on video size and length.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        className="w-full max-w-4xl p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Script-Based Video Editor</h2>
          <p className="text-gray-400">Upload 3-5 video clips to get started</p>
        </div>

        <motion.div
          className={`mb-6 p-8 border-4 border-dashed rounded-2xl text-center transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
          }`}
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          animate={{ scale: isDragging ? 1.02 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-700 rounded-full">
              <Upload className="w-10 h-10 text-gray-400" />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Drop videos here</h3>
              <p className="text-gray-400">
                Drag and drop up to 10 clips, or click to browse
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <motion.div
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                  onClick={(event) =>
                    emitParticleBurstFromEvent(event, {
                      color: "#3b82f6",
                      intensity: 0.9,
                    })
                  }
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Browse Files
                </motion.div>
              </label>
              {onDemo && (
                <motion.button
                  type="button"
                  onClick={(event) => {
                    emitParticleBurstFromEvent(event, {
                      color: "#a78bfa",
                      intensity: 1.05,
                    });
                    onDemo();
                  }}
                  disabled={isUploading}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Try Demo Clips
                </motion.button>
              )}
            </div>

            {onDemo && (
              <div className="text-xs text-gray-500">
                Uses clips from shared-data/sample-videos/clips
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <FileVideo className="w-4 h-4" />
              <span>MP4, MOV, WebM supported • Max 100MB each</span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedFiles.length > 0 && (
            <motion.div
              className="bg-gray-800 rounded-xl p-6 mb-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Selected Videos ({selectedFiles.length}/5)
                </h3>
                <motion.button
                  onClick={() => setSelectedFiles([])}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Clear All
                </motion.button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedFiles.map(({ file, id }) => (
                  <motion.div
                    key={id}
                    className="bg-gray-700 rounded-lg p-4 flex items-start gap-3"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="p-2 bg-gray-600 rounded-lg flex-shrink-0">
                      <Film className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => removeFile(id)}
                      className="p-1 hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  {isValidCount
                    ? "Ready to upload!"
                    : `Need ${3 - selectedFiles.length} more video${selectedFiles.length < 2 ? "" : "s"} to continue`}
                </p>

                {isValidCount && (
                  <motion.button
                    onClick={handleUpload}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Videos
                  </motion.button>
                )}
              </div>

              {!isValidCount && selectedFiles.length > 5 && (
                <p className="mt-2 text-sm text-red-400 text-center">
                  Maximum 5 videos allowed
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "3-5", description: "Video clips" },
            { label: "AI", description: "Auto transcription" },
            { label: "Edit", description: "By editing text" },
          ].map((item) => (
            <motion.div
              key={item.label}
              className="bg-gray-800/50 rounded-xl p- text-center p-4"
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {item.label}
              </div>
              <div className="text-sm text-gray-400">{item.description}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
