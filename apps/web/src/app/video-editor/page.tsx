'use client';

import React, { useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import { VideoComposition } from '../../remotion/VideoComposition';
import { BrandedHeader } from '@/src/components/BrandedHeader';
import { ProtectedRoute } from '@/src/components/ProtectedRoute';

function VideoEditorContent() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-rich-black flex items-center justify-center">
        <div className="text-pure-white font-formula">Loading Video Editor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rich-black">
      <BrandedHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold text-pure-white mb-2">Video Editor</h1>
          <p className="text-text-secondary-dark font-formula">Create and preview your videos with professional editing tools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div className="bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-playfair font-semibold text-pure-white mb-4">Preview</h2>
            <div className="bg-rich-black rounded-xl overflow-hidden border border-divider-dark/30">
              <Player
                component={VideoComposition}
                durationInFrames={300}
                compositionWidth={1920}
                compositionHeight={1080}
                fps={30}
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                }}
                controls
                loop
                autoPlay
              />
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-playfair font-semibold text-pure-white mb-4">Controls</h2>
            <div className="space-y-4">
              <div className="bg-charcoal/40 border border-divider-dark/30 rounded-xl p-4">
                <h3 className="text-pure-white font-formula font-medium mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full bg-luxury-gold hover:bg-muted-gold text-rich-black font-formula font-semibold px-4 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-luxury-gold/20 hover:shadow-xl hover:shadow-luxury-gold/40">
                    Open in Studio
                  </button>
                  <button className="w-full bg-transparent hover:bg-luxury-gold/10 text-luxury-gold border-2 border-luxury-gold/40 hover:border-luxury-gold font-formula font-semibold px-4 py-3 rounded-xl transition-all duration-300">
                    Export Video
                  </button>
                  <button className="w-full bg-transparent hover:bg-luxury-gold/10 text-luxury-gold border-2 border-luxury-gold/40 hover:border-luxury-gold font-formula font-semibold px-4 py-3 rounded-xl transition-all duration-300">
                    Save Project
                  </button>
                </div>
              </div>

              <div className="bg-charcoal/40 border border-divider-dark/30 rounded-xl p-4">
                <h3 className="text-pure-white font-formula font-medium mb-3">Project Info</h3>
                <div className="text-text-secondary-dark font-formula text-sm space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span>Duration:</span>
                    <span className="text-luxury-gold font-medium">10 seconds</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-divider-dark/30">
                    <span>Resolution:</span>
                    <span className="text-luxury-gold font-medium">1920x1080</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-divider-dark/30">
                    <span>Frame Rate:</span>
                    <span className="text-luxury-gold font-medium">30 fps</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-divider-dark/30">
                    <span>Total Frames:</span>
                    <span className="text-luxury-gold font-medium">300</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoEditorPage() {
  return (
    <ProtectedRoute>
      <VideoEditorContent />
    </ProtectedRoute>
  );
}
