'use client';

import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { VideoComposition } from '../../remotion/VideoComposition';

export default function VideoPlayerPage() {
  const [selectedComposition, setSelectedComposition] = useState<'VideoEditor' | 'ShortForm'>('VideoEditor');
  const [isPlaying, setIsPlaying] = useState(false);

  const compositions = {
    VideoEditor: {
      name: 'Landscape Video',
      width: 1920,
      height: 1080,
      duration: 300,
      fps: 30,
      aspectRatio: '16/9'
    },
    ShortForm: {
      name: 'Vertical Short',
      width: 1080,
      height: 1920,
      duration: 180,
      fps: 30,
      aspectRatio: '9/16'
    }
  };

  const currentComposition = compositions[selectedComposition];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Video Player</h1>
          <p className="text-slate-400">Watch and playback your Remotion videos</p>
        </div>

        {/* Composition Selector */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            {Object.entries(compositions).map(([key, comp]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedComposition(key as keyof typeof compositions);
                  setIsPlaying(false);
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedComposition === key
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {comp.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2 bg-slate-800 rounded-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {currentComposition.name}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              </div>
            </div>
            
            <div className="bg-black rounded-lg overflow-hidden">
              <Player
                component={VideoComposition}
                durationInFrames={currentComposition.duration}
                compositionWidth={currentComposition.width}
                compositionHeight={currentComposition.height}
                fps={currentComposition.fps}
                style={{
                  width: '100%',
                  aspectRatio: currentComposition.aspectRatio,
                }}
                controls
                loop={false}
                autoPlay={false}
              />
            </div>
          </div>

          {/* Video Information */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Video Metadata</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Resolution:</span>
                  <span className="text-white font-medium">
                    {currentComposition.width}×{currentComposition.height}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="text-white font-medium">
                    {(currentComposition.duration / currentComposition.fps).toFixed(1)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frame Rate:</span>
                  <span className="text-white font-medium">{currentComposition.fps} fps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Frames:</span>
                  <span className="text-white font-medium">{currentComposition.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Aspect Ratio:</span>
                  <span className="text-white font-medium">{currentComposition.aspectRatio}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-2">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
                  Export as MP4
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors">
                  Export as GIF
                </button>
                <button className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors">
                  Copy Share Link
                </button>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Play/Pause</span>
                  <span className="text-slate-300 font-mono">Space</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Seek Forward</span>
                  <span className="text-slate-300 font-mono">→</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Seek Backward</span>
                  <span className="text-slate-300 font-mono">←</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fullscreen</span>
                  <span className="text-slate-300 font-mono">f</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}