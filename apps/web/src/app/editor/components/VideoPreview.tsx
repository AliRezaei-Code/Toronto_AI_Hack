"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2 } from "lucide-react";

interface VideoPreviewProps {
  videoUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoPreview({
  videoUrl,
  videoRef,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onPlayPause,
  onSeek,
}: VideoPreviewProps) {
  const [isMuted, setIsMuted] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Handle video time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
    };

    const handleEnded = () => {
      // Reset to beginning when video ends
      video.currentTime = 0;
      onTimeUpdate(0);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [videoRef, onTimeUpdate]);

  // Handle progress bar click
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !duration) return;

      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;

      onSeek(newTime);
    },
    [duration, onSeek]
  );

  // Skip forward/backward
  const handleSkip = useCallback(
    (seconds: number) => {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      onSeek(newTime);
    },
    [currentTime, duration, onSeek]
  );

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [videoRef, isMuted]);

  // Toggle fullscreen
  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col"
    >
      {/* Video Container */}
      <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px]">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-h-full max-w-full object-contain aspect-[9/16]"
            playsInline
            onClick={onPlayPause}
          />
        ) : (
          <div className="text-slate-600 text-center p-8">
            <div className="w-24 h-40 mx-auto mb-4 bg-slate-700/50 rounded-xl flex items-center justify-center">
              <Play size={32} className="text-slate-500" />
            </div>
            <p className="text-slate-500">Video preview will appear here</p>
          </div>
        )}

        {/* Play/Pause Overlay */}
        {videoUrl && !isPlaying && (
          <button
            onClick={onPlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Play size={32} className="text-white ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-slate-800">
        {/* Progress Bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="relative w-full h-2 bg-slate-700 rounded-full cursor-pointer mb-3 group"
        >
          <div
            className="absolute left-0 top-0 h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSkip(-5)}
              disabled={!videoUrl}
              className="p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 transition-colors"
              title="Skip back 5s"
            >
              <SkipBack size={20} />
            </button>

            <button
              onClick={onPlayPause}
              disabled={!videoUrl}
              className="p-3 rounded-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white transition-colors"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>

            <button
              onClick={() => handleSkip(5)}
              disabled={!videoUrl}
              className="p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 transition-colors"
              title="Skip forward 5s"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* Time Display */}
          <div className="text-slate-400 text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              disabled={!videoUrl}
              className="p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <button
              onClick={handleToggleFullscreen}
              disabled={!videoUrl}
              className="p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 transition-colors"
            >
              <Maximize2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
