'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BrandedHeader } from '@/src/components/BrandedHeader';
import { ProtectedRoute } from '@/src/components/ProtectedRoute';
import { 
  Upload, 
  Play, 
  Pause, 
  RefreshCw, 
  Trash2, 
  Download,
  Film,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Zap,
  Video,
  MessageSquare,
  Users,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

// Icon wrapper to fix TypeScript React version mismatch with pnpm
// This is a known issue with multiple React type definitions in pnpm workspaces
const Icon = ({ icon: IconComponent, ...props }: { icon: LucideIcon } & LucideProps) => {
  // @ts-ignore - React type version mismatch in pnpm workspace
  return <IconComponent {...props} />;
};
// Types matching backend models
interface ViralClip {
  id: string;
  job_id: string;
  start_time: number;
  end_time: number;
  duration: number;
  virality_score: number;
  hook_type: string;
  hook_strength: number;
  suggested_titles: string[];
  emphasis_words: string[];
  summary: string;
  speakers: number[];
  transcript_text: string;
}

interface DirectorJob {
  job_id: string;
  status: string;
  progress_percent: number;
  current_step: string;
  viral_clips_found: number;
  shorts_rendered: number;
  error?: string;
  created_at?: string;
}

type JobStatus = 'queued' | 'transcribing' | 'diarizing' | 'selecting_clips' | 'tracking_faces' | 'generating_layout' | 'rendering' | 'completed' | 'failed';

const STATUS_CONFIG: Record<JobStatus, { color: string; icon: LucideIcon; label: string }> = {
  queued: { color: 'bg-charcoal', icon: Clock, label: 'Queued' },
  transcribing: { color: 'bg-dark-gold', icon: MessageSquare, label: 'Transcribing' },
  diarizing: { color: 'bg-muted-gold', icon: Users, label: 'Identifying Speakers' },
  selecting_clips: { color: 'bg-luxury-gold', icon: Sparkles, label: 'Finding Viral Moments' },
  tracking_faces: { color: 'bg-pale-gold', icon: Video, label: 'Tracking Faces' },
  generating_layout: { color: 'bg-dark-gold', icon: Film, label: 'Generating Layout' },
  rendering: { color: 'bg-muted-gold', icon: Zap, label: 'Rendering' },
  completed: { color: 'bg-luxury-gold', icon: CheckCircle, label: 'Completed' },
  failed: { color: 'bg-red-500', icon: XCircle, label: 'Failed' },
};

// Job Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as JobStatus] || STATUS_CONFIG.queued;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-pure-white ${config.color}`}>
      <Icon icon={config.icon} size={16} />
      {config.label}
    </span>
  );
}

// Progress Bar Component
function ProgressBar({ progress, status }: { progress: number; status: string }) {
  const isActive = !['completed', 'failed'].includes(status);
  
  return (
    <div className="w-full bg-charcoal rounded-full h-2 overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${
          status === 'failed' ? 'bg-red-500' :
          status === 'completed' ? 'bg-luxury-gold' :
          'bg-muted-gold'
        } ${isActive ? 'animate-pulse' : ''}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}

// Viral Clip Card Component
function ViralClipCard({ clip, onRender }: { clip: ViralClip; onRender: (clipId: string) => void }) {
  const hookColors: Record<string, string> = {
    question: 'bg-muted-gold',
    shock: 'bg-dark-gold',
    story: 'bg-luxury-gold',
    result: 'bg-pale-gold',
    controversy: 'bg-dark-gold',
    promise: 'bg-muted-gold',
  };
  
  return (
    <div className="bg-charcoal/40 border border-divider-dark/30 rounded-xl p-4 hover:bg-charcoal/60 transition-colors backdrop-blur-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium text-pure-white ${hookColors[clip.hook_type] || 'bg-gray-500'}`}>
            {clip.hook_type.toUpperCase()}
          </span>
          <span className="text-text-secondary-dark text-sm">
            {Math.floor(clip.duration)}s
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* @ts-ignore - React type version mismatch in pnpm workspace */}
          <Sparkles size={14} className="text-yellow-400" />
          <span className="text-yellow-400 font-bold text-sm">
            {clip.virality_score.toFixed(0)}
          </span>
        </div>
      </div>
      
      <h4 className="text-pure-white font-playfair font-medium mb-2 line-clamp-2">
        {clip.suggested_titles[0] || clip.summary}
      </h4>

      <p className="text-text-secondary-dark font-formula text-sm mb-3 line-clamp-2">
        {clip.transcript_text.substring(0, 100)}...
      </p>

      <div className="flex items-center justify-between">
        <span className="text-text-secondary-dark font-formula text-xs">
          {formatTime(clip.start_time)} - {formatTime(clip.end_time)}
        </span>
        <button
          onClick={() => onRender(clip.id)}
          className="bg-luxury-gold hover:bg-muted-gold text-rich-black font-formula px-3 py-1 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-1"
        >
          {/* @ts-ignore - React type version mismatch in pnpm workspace */}
          <Film size={14} />
          Render
        </button>
      </div>
    </div>
  );
}

// Upload Zone Component
function UploadZone({ onUpload, isUploading }: { onUpload: (file: File) => void; isUploading: boolean }) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      onUpload(file);
    }
  }, [onUpload]);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  }, [onUpload]);
  
  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      className={`
        border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
        ${isDragging ? 'border-luxury-gold bg-luxury-gold/10' : 'border-divider-dark hover:border-luxury-gold/40'}
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
        id="video-upload"
        disabled={isUploading}
      />
      <label htmlFor="video-upload" className="cursor-pointer">
        {/* @ts-ignore - React type version mismatch in pnpm workspace */}
        <Upload size={48} className={`mx-auto mb-4 ${isDragging ? 'text-luxury-gold' : 'text-text-secondary-dark'}`} />
        <h3 className="text-xl font-playfair font-semibold text-pure-white mb-2">
          {isUploading ? 'Uploading...' : 'Upload Video'}
        </h3>
        <p className="text-text-secondary-dark font-formula mb-4">
          Drag and drop your interview or podcast video, or click to browse
        </p>
        <p className="text-text-secondary-dark font-formula text-sm">
          Supports MP4, MOV, WebM up to 2GB
        </p>
      </label>
    </div>
  );
}

// Job Card Component
function JobCard({ 
  job, 
  clips, 
  onRefresh, 
  onDelete, 
  onRenderClip,
  isExpanded,
  onToggle,
}: { 
  job: DirectorJob; 
  clips: ViralClip[];
  onRefresh: () => void;
  onDelete: () => void;
  onRenderClip: (clipId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 rounded-2xl overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-charcoal/40 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* @ts-ignore - React type version mismatch in pnpm workspace */}
            <ChevronRight
              size={20} 
              className={`text-text-secondary-dark transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-pure-white font-medium">Job {job.job_id.substring(0, 8)}</span>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-text-secondary-dark text-sm mt-1">
                {job.current_step || 'Processing...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-pure-white font-bold">{job.viral_clips_found}</div>
              <div className="text-text-secondary-dark text-xs">clips found</div>
            </div>
            <div className="text-right">
              <div className="text-pure-white font-bold">{job.shorts_rendered}</div>
              <div className="text-text-secondary-dark text-xs">rendered</div>
            </div>
          </div>
        </div>
        
        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-text-secondary-dark">Progress</span>
            <span className="text-pure-white font-medium">{job.progress_percent.toFixed(0)}%</span>
          </div>
          <ProgressBar progress={job.progress_percent} status={job.status} />
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-divider-dark/30 p-4">
          {/* Error Message */}
          {job.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
              {/* @ts-ignore - React type version mismatch in pnpm workspace */}
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{job.error}</p>
            </div>
          )}
          
          {/* Viral Clips */}
          {clips.length > 0 && (
            <div className="mb-4">
              <h4 className="text-pure-white font-medium mb-3">Viral Clips</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clips.map((clip) => (
                  <ViralClipCard 
                    key={clip.id} 
                    clip={clip} 
                    onRender={onRenderClip}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-divider-dark/30">
            <button
              onClick={(e) => { e.stopPropagation(); onRefresh(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-charcoal/60 hover:bg-charcoal text-text-secondary-dark text-sm transition-colors"
            >
              {/* @ts-ignore - React type version mismatch in pnpm workspace */}
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-colors"
            >
              {/* @ts-ignore - React type version mismatch in pnpm workspace */}
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Main AI Director Page
function AIDirectorContent() {
  const [isClient, setIsClient] = useState(false);
  const [jobs, setJobs] = useState<DirectorJob[]>([]);
  const [clips, setClips] = useState<Record<string, ViralClip[]>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Client-side rendering check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch jobs on mount - must be called unconditionally before any early returns
  useEffect(() => {
    if (!isClient) return;
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-rich-black flex items-center justify-center">
        <div className="text-pure-white font-formula">Loading AI Director...</div>
      </div>
    );
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/director/jobs`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const fetchClips = async (jobId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/director/clips/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setClips(prev => ({ ...prev, [jobId]: data.clips || [] }));
      }
    } catch (err) {
      console.error('Failed to fetch clips:', err);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('caption_style', 'hormozi');
      formData.append('target_platform', 'tiktok');
      formData.append('max_clips', '5');
      
      const response = await fetch(`${API_URL}/api/director/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      setExpandedJob(data.job_id);
      fetchJobs();
    } catch (err) {
      setError('Failed to upload video. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRefreshJob = async (jobId: string) => {
    await fetchJobs();
    await fetchClips(jobId);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await fetch(`${API_URL}/api/director/job/${jobId}`, { method: 'DELETE' });
      fetchJobs();
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  const handleRenderClip = async (jobId: string, clipId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/director/render-short`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          clip_id: clipId,
          caption_style: 'hormozi',
          platform: 'tiktok',
        }),
      });
      
      if (response.ok) {
        fetchJobs();
      }
    } catch (err) {
      console.error('Failed to render clip:', err);
    }
  };

  const handleToggleJob = (jobId: string) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
    } else {
      setExpandedJob(jobId);
      if (!clips[jobId]) {
        fetchClips(jobId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-rich-black">
      <BrandedHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {/* @ts-ignore - React type version mismatch in pnpm workspace */}
            <Sparkles className="text-luxury-gold" size={32} />
            <h1 className="text-4xl font-playfair font-bold text-pure-white">AI Director</h1>
          </div>
          <p className="text-text-secondary-dark font-formula">
            Automatically transform long-form interviews into viral short-form content
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            {/* @ts-ignore - React type version mismatch in pnpm workspace */}
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-500 text-sm underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <div className="mb-8">
          <UploadZone onUpload={handleUpload} isUploading={isUploading} />
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-playfair font-semibold text-pure-white">Processing Jobs</h2>
            <button
              onClick={fetchJobs}
              className="flex items-center gap-1.5 text-text-secondary-dark hover:text-luxury-gold transition-colors text-sm font-formula"
            >
              {/* @ts-ignore - React type version mismatch in pnpm workspace */}
              <RefreshCw size={14} />
              Refresh All
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 rounded-2xl p-8 text-center backdrop-blur-sm">
              {/* @ts-ignore - React type version mismatch in pnpm workspace */}
              <Film size={48} className="mx-auto mb-4 text-text-secondary-dark" />
              <h3 className="text-xl font-playfair font-semibold text-pure-white mb-2">No Jobs Yet</h3>
              <p className="text-text-secondary-dark font-formula">
                Upload a video to get started with AI-powered clip generation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.job_id}
                  job={job}
                  clips={clips[job.job_id] || []}
                  onRefresh={() => handleRefreshJob(job.job_id)}
                  onDelete={() => handleDeleteJob(job.job_id)}
                  onRenderClip={(clipId) => handleRenderClip(job.job_id, clipId)}
                  isExpanded={expandedJob === job.job_id}
                  onToggle={() => handleToggleJob(job.job_id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 rounded-xl p-6 border border-divider-dark/30">
            <div className="w-12 h-12 bg-luxury-gold/20 rounded-xl flex items-center justify-center mb-4">
              {/* @ts-ignore - React type version mismatch in pnpm workspace */}
              <MessageSquare className="text-blue-500" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-pure-white mb-2">Smart Transcription</h3>
            <p className="text-text-secondary-dark text-sm">
              Speaker diarization identifies who&apos;s talking and when, enabling multi-speaker layouts.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 rounded-xl p-6 border border-divider-dark/30">
            <div className="w-12 h-12 bg-muted-gold/20 rounded-xl flex items-center justify-center mb-4">
              {/* @ts-ignore - React type version mismatch in pnpm workspace */}
              <Sparkles className="text-purple-500" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-pure-white mb-2">Viral Detection</h3>
            <p className="text-text-secondary-dark text-sm">
              AI identifies the most engaging moments with hooks, stories, and emotional peaks.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-charcoal/60 via-rich-black/60 to-charcoal/60 border border-luxury-gold/20 rounded-2xl p-6 backdrop-blur-sm">
            <div className="w-12 h-12 bg-luxury-gold/20 rounded-xl flex items-center justify-center mb-4">
              {/* @ts-ignore - React type version mismatch in pnpm workspace */}
              <Video className="text-luxury-gold" size={24} />
            </div>
            <h3 className="text-lg font-playfair font-semibold text-pure-white mb-2">Smart Cropping</h3>
            <p className="text-text-secondary-dark font-formula text-sm">
              Face tracking keeps speakers in frame with dynamic 9:16 cropping for vertical video.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIDirectorPage() {
  return (
    <ProtectedRoute>
      <AIDirectorContent />
    </ProtectedRoute>
  );
}
