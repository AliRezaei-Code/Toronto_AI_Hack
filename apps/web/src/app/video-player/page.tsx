'use client';

import React, { useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import { VideoComposition } from '../../remotion/VideoComposition';
import { BrandedHeader } from '@/src/components/BrandedHeader';
import { ProtectedRoute } from '@/src/components/ProtectedRoute';

function VideoPlayerContent() {
  const [isClient, setIsClient] = useState(false);
  const [selectedComposition, setSelectedComposition] = useState<'VideoEditor' | 'ShortForm'>('VideoEditor');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-rich-black flex items-center justify-center">
        <div className="text-pure-white font-formula">Loading Video Player...</div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-rich-black">
      <BrandedHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold text-pure-white mb-2">Video Player</h1>
          <p className="text-text-secondary-dark font-formula">Watch and playback your Remotion videos</p>
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
                className={`px-6 py-3 rounded-xl font-formula font-medium transition-all ${
                  selectedComposition === key
                    ? 'bg-luxury-gold text-rich-black shadow-lg shadow-luxury-gold/25'
                    : 'bg-charcoal/60 text-text-secondary-dark hover:bg-charcoal border border-divider-dark/30'
                }`}
              >
                {comp.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2 bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-playfair font-semibold text-pure-white">
                {currentComposition.name}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-luxury-gold hover:bg-muted-gold text-rich-black font-formula font-semibold px-4 py-2 rounded-xl transition-all duration-300"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              </div>
            </div>

            <div className="bg-rich-black rounded-xl overflow-hidden border border-divider-dark/30">
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
            <div className="bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-playfair font-semibold text-pure-white mb-4">Video Metadata</h3>
              <div className="text-text-secondary-dark font-formula text-sm space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span>Resolution:</span>
                  <span className="text-luxury-gold font-medium">
                    {currentComposition.width}×{currentComposition.height}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-divider-dark/30">
                  <span>Duration:</span>
                  <span className="text-luxury-gold font-medium">
                    {(currentComposition.duration / currentComposition.fps).toFixed(1)}s
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-divider-dark/30">
                  <span>Frame Rate:</span>
                  <span className="text-luxury-gold font-medium">{currentComposition.fps} fps</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-divider-dark/30">
                  <span>Total Frames:</span>
                  <span className="text-luxury-gold font-medium">{currentComposition.duration}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-divider-dark/30">
                  <span>Aspect Ratio:</span>
                  <span className="text-luxury-gold font-medium">{currentComposition.aspectRatio}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-playfair font-semibold text-pure-white mb-4">Actions</h3>
              <div className="space-y-2">
                <button className="w-full bg-luxury-gold hover:bg-muted-gold text-rich-black font-formula font-semibold px-4 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-luxury-gold/20 hover:shadow-xl hover:shadow-luxury-gold/40">
                  Export as MP4
                </button>
                <button className="w-full bg-transparent hover:bg-luxury-gold/10 text-luxury-gold border-2 border-luxury-gold/40 hover:border-luxury-gold font-formula font-semibold px-4 py-3 rounded-xl transition-all duration-300">
                  Export as GIF
                </button>
                <button className="w-full bg-transparent hover:bg-luxury-gold/10 text-luxury-gold border-2 border-luxury-gold/40 hover:border-luxury-gold font-formula font-semibold px-4 py-3 rounded-xl transition-all duration-300">
                  Copy Share Link
                </button>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-playfair font-semibold text-pure-white mb-4">Shortcuts</h3>
              <div className="space-y-2 text-sm font-formula">
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Play/Pause</span>
                  <span className="text-luxury-gold font-mono">Space</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Seek Forward</span>
                  <span className="text-luxury-gold font-mono">→</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Seek Backward</span>
                  <span className="text-luxury-gold font-mono">←</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary-dark">Fullscreen</span>
                  <span className="text-luxury-gold font-mono">f</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoPlayerPage() {
  return (
    <ProtectedRoute>
      <VideoPlayerContent />
    </ProtectedRoute>
  );
}