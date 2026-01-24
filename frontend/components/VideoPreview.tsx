'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Play, Pause, Download, Volume2, VolumeX, Maximize2, SkipForward, SkipBack } from 'lucide-react'

interface VideoPreviewProps {
  videoUrl: string
  currentTime: number
  onTimeUpdate: (time: number) => void
  onSeek: (time: number) => void
}

export function VideoPreview({
  videoUrl,
  currentTime,
  onTimeUpdate,
  onSeek,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (video && Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime
    }
  }, [currentTime])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          e.preventDefault()
          seekRelative(5)
          break
        case 'ArrowLeft':
          e.preventDefault()
          seekRelative(-5)
          break
        case 'ArrowUp':
          e.preventDefault()
          changeVolume(0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          changeVolume(-0.1)
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
        case 'KeyF':
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime)
    }
  }, [onTimeUpdate])

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    onSeek(time)
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  const seekRelative = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds))
      onSeek(newTime)
      videoRef.current.currentTime = newTime
    }
  }

  const changeVolume = (delta: number) => {
    if (videoRef.current) {
      const newVolume = Math.max(0, Math.min(1, volume + delta))
      setVolume(newVolume)
      videoRef.current.volume = newVolume
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume
        videoRef.current.muted = false
        setIsMuted(false)
      } else {
        videoRef.current.muted = true
        setIsMuted(true)
      }
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = 'edited-video.mp4'
    link.click()
  }

  const handleMouseEnter = () => setShowControls(true)
  const handleMouseLeave = () => setShowControls(false)

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden relative group">
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-h-full max-w-full cursor-pointer"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
        />
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <button 
            onClick={togglePlay}
            className="p-4 bg-white/20 hover:bg-white/30 rounded-full pointer-events-auto"
          >
            {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 bg-gray-800/50 rounded-lg p-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => seekRelative(-5)}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            title="Skip back 5s (←)"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button
            onClick={togglePlay}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
            title="Play/Pause (Space)"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          
          <button
            onClick={() => seekRelative(5)}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            title="Skip forward 5s (→)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm text-gray-400 w-12 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.001}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-blue-400"
            />
            <span className="text-sm text-gray-400 w-12 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
          
          <button
            onClick={toggleMute}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            title={`Toggle mute (M) - Volume: ${Math.round(volume * 100)}%`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            title="Fullscreen (F)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleDownload}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
            title="Export video"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <span>Space: Play/Pause</span>
          <span>←/→: Skip 5s</span>
          <span>↑/↓: Volume</span>
          <span>M: Mute</span>
          <span>F: Fullscreen</span>
        </div>
      </div>
    </div>
  )
}