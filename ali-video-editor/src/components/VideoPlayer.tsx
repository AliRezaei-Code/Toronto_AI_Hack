"use client";

import { cn } from "@/utils/cn";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  file: File;
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
}

export function VideoPlayer({ file, className, onTimeUpdate, onDurationChange }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [buffered, setBuffered] = useState(0);

  // Create object URL when file changes
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsLoading(true);
    setCurrentTime(0);
    setIsPlaying(false);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) {
      return;
    }

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Handle volume change
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      if (!videoRef.current) {
        return;
      }

      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      videoRef.current.volume = clampedVolume;
      setVolume(clampedVolume);

      if (clampedVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    },
    [isMuted]
  );

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!videoRef.current) {
      return;
    }

    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Handle seek
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current || !progressRef.current) {
        return;
      }

      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;

      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration]
  );

  // Skip forward/backward
  const skip = useCallback(
    (seconds: number) => {
      if (!videoRef.current) {
        return;
      }

      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration]
  );

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      return;
    }

    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) {
      return "0:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get volume icon based on level
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden rounded-none border border-gray-700 bg-black",
        isFullscreen && "border-0",
        className
      )}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="h-full w-full bg-black object-contain"
        onClick={togglePlay}
        onTimeUpdate={(e) => {
          const time = e.currentTarget.currentTime;
          setCurrentTime(time);
          onTimeUpdate?.(time);

          // Update buffered
          const video = e.currentTarget;
          if (video.buffered.length > 0) {
            setBuffered(video.buffered.end(video.buffered.length - 1));
          }
        }}
        onLoadedMetadata={(e) => {
          const dur = e.currentTarget.duration;
          setDuration(dur);
          onDurationChange?.(dur);
          setIsLoading(false);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {/* Play/Pause Overlay Button */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600/90 text-white shadow-lg transition-transform hover:scale-110">
            <Play className="ml-1 h-10 w-10" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="group/progress mb-3 h-1.5 w-full cursor-pointer rounded-full bg-gray-600"
          onClick={handleSeek}
        >
          {/* Buffered */}
          <div
            className="absolute h-1.5 rounded-full bg-gray-500"
            style={{ width: `${(buffered / duration) * 100}%` }}
          />
          {/* Progress */}
          <div
            className="relative h-1.5 rounded-full bg-blue-500 transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          >
            {/* Scrubber */}
            <div className="absolute -right-2 -top-1 h-3.5 w-3.5 rounded-full bg-blue-500 opacity-0 shadow-md transition-opacity group-hover/progress:opacity-100" />
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/20"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5" fill="currentColor" />
              )}
            </button>

            {/* Skip Backward */}
            <button
              onClick={() => skip(-10)}
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/20"
              title="Rewind 10s"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skip(10)}
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/20"
              title="Forward 10s"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {/* Volume */}
            <div className="group/volume flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="rounded-lg p-2 text-white transition-colors hover:bg-white/20"
                title={isMuted ? "Unmute" : "Mute"}
              >
                <VolumeIcon className="h-5 w-5" />
              </button>

              {/* Volume Slider */}
              <div className="w-0 overflow-hidden transition-all duration-200 group-hover/volume:w-20">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-gray-600 accent-blue-500"
                />
              </div>
            </div>

            {/* Time Display */}
            <span className="ml-2 font-mono text-sm text-white/90">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/20"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
