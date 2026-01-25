import Link from 'next/link';
import { Play, Edit3, Film, BarChart3, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">
            Video Editor Pro
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Create stunning videos with Remotion and Next.js
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/video-editor"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Edit3 size={20} />
              Start Editing
            </Link>
            <Link
              href="/ai-director"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Sparkles size={20} />
              AI Director
            </Link>
            <Link
              href="/video-player"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Play size={20} />
              Watch Videos
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <Edit3 className="text-blue-500" size={24} />
              <h3 className="text-xl font-semibold text-white">Video Editor</h3>
            </div>
            <p className="text-slate-300 mb-4">
              Create and edit videos with our powerful Remotion-based editor. 
              Add animations, effects, and more.
            </p>
            <Link
              href="/video-editor"
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              Open Editor
              <BarChart3 size={16} />
            </Link>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <Play className="text-purple-500" size={24} />
              <h3 className="text-xl font-semibold text-white">Video Player</h3>
            </div>
            <p className="text-slate-300 mb-4">
              Watch your created videos in our dedicated player. 
              Supports multiple formats and resolutions.
            </p>
            <Link
              href="/video-player"
              className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              Watch Videos
              <BarChart3 size={16} />
            </Link>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <Film className="text-green-500" size={24} />
              <h3 className="text-xl font-semibold text-white">API Integration</h3>
            </div>
            <p className="text-slate-300 mb-4">
              Server-side video rendering and thumbnail generation 
              with our REST API endpoints.
            </p>
            <div className="text-green-400 font-mono text-sm">
              /api/render
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-pink-500" size={24} />
              <h3 className="text-xl font-semibold text-white">AI Director</h3>
            </div>
            <p className="text-slate-300 mb-4">
              Automatically transform interviews into viral shorts with 
              AI-powered clip selection and smart cropping.
            </p>
            <Link
              href="/ai-director"
              className="text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1"
            >
              Launch AI Director
              <BarChart3 size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-16 bg-slate-800 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Creative Tools</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Multiple animation types
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Dynamic background gradients
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Text animations and effects
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Audio visualization
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Technical Features</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Server-side rendering
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Multiple video formats
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  REST API integration
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Real-time preview
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}