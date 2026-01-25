"use client";

import React, { useState, useCallback, useRef } from "react";
import { Upload, X, GripVertical, Play, Trash2, Loader2 } from "lucide-react";
import { UploadedClip } from "../hooks/useEditor";

interface MultiClipUploadProps {
  clips: UploadedClip[];
  isUploading: boolean;
  onAddClips: (files: File[]) => void;
  onRemoveClip: (clipId: string) => void;
  onReorderClips: (fromIndex: number, toIndex: number) => void;
  onProcess: () => void;
  minClips?: number;
  maxClips?: number;
}

export function MultiClipUpload({
  clips,
  isUploading,
  onAddClips,
  onRemoveClip,
  onReorderClips,
  onProcess,
  minClips = 1,
  maxClips = 5,
}: MultiClipUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("video/")
      );

      if (files.length > 0) {
        const remainingSlots = maxClips - clips.length;
        const filesToAdd = files.slice(0, remainingSlots);
        onAddClips(filesToAdd);
      }
    },
    [clips.length, maxClips, onAddClips]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith("video/")
      );

      if (files.length > 0) {
        const remainingSlots = maxClips - clips.length;
        const filesToAdd = files.slice(0, remainingSlots);
        onAddClips(filesToAdd);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [clips.length, maxClips, onAddClips]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOverItem = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;

      onReorderClips(draggedIndex, index);
      setDraggedIndex(index);
    },
    [draggedIndex, onReorderClips]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const canAddMore = clips.length < maxClips;
  const canProcess = clips.length >= minClips && !isUploading;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Upload size={20} className="text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Video Clips</h3>
        </div>
        <div className="text-slate-400 text-sm">
          {clips.length} / {maxClips}
        </div>
      </div>

      {/* Drop Zone */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-all mb-4
            ${isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-slate-600 hover:border-slate-500"
            }
            ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef.current}
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <Upload
            size={32}
            className={`mx-auto mb-2 ${isDragging ? "text-blue-500" : "text-slate-500"}`}
          />
          <p className="text-slate-300 text-sm font-medium mb-1">
            Drop videos here or click to browse
          </p>
          <p className="text-slate-500 text-xs">
            Add {maxClips - clips.length} more {maxClips - clips.length === 1 ? "clip" : "clips"}
          </p>
        </div>
      )}

      {/* Clip List */}
      {clips.length > 0 && (
        <div className="space-y-2 mb-4">
          {clips.map((clip, index) => (
            <div
              key={clip.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOverItem(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700
                hover:bg-slate-900 transition-colors
                ${draggedIndex === index ? "opacity-50" : ""}
              `}
            >
              {/* Drag Handle */}
              <GripVertical
                size={16}
                className="text-slate-500 cursor-move flex-shrink-0"
              />

              {/* Thumbnail */}
              <div className="relative w-16 h-16 rounded bg-slate-700 flex-shrink-0 overflow-hidden">
                <video
                  src={clip.previewUrl}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
                  <Play size={16} className="text-slate-400" />
                </div>
              </div>

              {/* Clip Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {clip.file.name}
                </p>
                <p className="text-slate-500 text-xs">
                  {(clip.file.size / (1024 * 1024)).toFixed(1)} MB
                  {clip.duration > 0 && ` • ${Math.floor(clip.duration)}s`}
                </p>
              </div>

              {/* Order Badge */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 text-xs font-bold">
                  {index + 1}
                </span>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => onRemoveClip(clip.id)}
                disabled={isUploading}
                className="flex-shrink-0 p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove clip"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Process Button */}
      {clips.length > 0 && (
        <button
          onClick={onProcess}
          disabled={!canProcess}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors
            ${canProcess
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }
          `}
        >
          {isUploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing Videos...
            </>
          ) : (
            <>
              <Upload size={18} />
              Process {clips.length} {clips.length === 1 ? "Clip" : "Clips"}
            </>
          )}
        </button>
      )}

      {/* Help Text */}
      {clips.length === 0 && (
        <p className="text-slate-500 text-xs text-center mt-4">
          Upload {minClips} to {maxClips} video clips to get started
        </p>
      )}
    </div>
  );
}
