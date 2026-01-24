'use client';

import React, { useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import { VideoComposition } from '../../remotion/VideoComposition';

export default function VideoEditorPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading Video Editor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Video Editor</h1>
          <p className="text-slate-400">Create and preview your videos with Remotion</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
            <div className="bg-black rounded-lg overflow-hidden">
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
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Controls</h2>
            <div className="space-y-4">
              <div className="bg-slate-700 rounded p-4">
                <h3 className="text-white font-medium mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
                    Open in Studio
                  </button>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
                    Export Video
                  </button>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors">
                    Save Project
                  </button>
                </div>
              </div>

              <div className="bg-slate-700 rounded p-4">
                <h3 className="text-white font-medium mb-2">Project Info</h3>
                <div className="text-slate-300 text-sm space-y-1">
                  <p>Duration: 10 seconds</p>
                  <p>Resolution: 1920x1080</p>
                  <p>Frame Rate: 30 fps</p>
                  <p>Total Frames: 300</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}