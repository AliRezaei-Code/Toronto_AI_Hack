"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UploadZone } from "@/src/components/UploadZone";
import { VideoPreview } from "@/src/components/VideoPreview";
import { TranscriptEditor } from "@/src/components/TranscriptEditor";
import { MagicBox } from "@/src/components/MagicBox";
import {
  uploadVideos,
  getJobStatus,
  processEdit,
  getJobs,
  JobSummary,
  Transcript,
  startDemoJob,
} from "@/src/lib/api-client";
import { createEmptyTranscript, getAllWords } from "@/src/lib/transcript-utils";
import { WaveformTimeline } from "@/src/components/WaveformTimeline";
import { emitParticleBurst } from "@/src/lib/particle-events";
import { ProtectedRoute } from "@/src/components/ProtectedRoute";
import { useAuth } from "@/src/contexts/AuthContext";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      <p className="mt-4 text-gray-400">Loading...</p>
    </div>
  </div>
);

interface Word {
  word: string;
  start: number;
  end: number;
}

function HomeContent() {
  const { user, signOut } = useAuth();
  const [jobId, setJobId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [showJobList, setShowJobList] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  const statusMessageLower = statusMessage.toLowerCase();
  const isErrorMessage =
    statusMessageLower.includes("failed") ||
    statusMessageLower.includes("error");
  const isWarningMessage =
    statusMessageLower.includes("warning") ||
    statusMessageLower.includes("transcription") ||
    statusMessageLower.includes("disabled");

  const pollingRef = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editStartRef = useRef<number | null>(null);

  const handleUpload = async (files: File[]) => {
    setIsProcessing(true);
    setUploadProgress(0);
    setProcessingStep("Uploading videos...");
    setStatusMessage("Uploading and processing videos...");

    try {
      const result = await uploadVideos(files, (progress) => {
        setUploadProgress(progress);
        if (progress < 30) {
          setProcessingStep("Uploading videos...");
        } else if (progress < 60) {
          setProcessingStep("Transcribing with AI...");
        } else if (progress < 90) {
          setProcessingStep("Smart merging for optimal hook...");
        } else {
          setProcessingStep("Rendering final video...");
        }
      });
      setJobId(result.job_id);

      pollJobStatus(result.job_id);
    } catch (error) {
      console.error("Upload failed:", error);
      setStatusMessage("Upload failed. Please try again.");
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const handleDemo = async () => {
    setIsProcessing(true);
    setUploadProgress(0);
    setProcessingStep("Loading demo clips...");
    setStatusMessage("Loading demo clips...");

    try {
      const result = await startDemoJob();
      setJobId(result.job_id);
      pollJobStatus(result.job_id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Demo failed to start.";
      setStatusMessage(message);
      setIsProcessing(false);
      setProcessingStep("");
      setUploadProgress(0);
    }
  };

  const pollJobStatus = async (id: string) => {
    const poll = async () => {
      try {
        const status = await getJobStatus(id);

        if (status.status === "completed") {
          setVideoUrl(status.video_url || null);
          setTranscript(status.transcript || null);
          setIsProcessing(false);
          setStatusMessage(status.warning || "");
          setUploadProgress(100);
          setProcessingStep("");
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (status.status === "error") {
          setStatusMessage(status.error || "An error occurred");
          setIsProcessing(false);
          setUploadProgress(0);
          setProcessingStep("");
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else {
          setUploadProgress(Math.min(85, uploadProgress + 5));
          setProcessingStep(
            status.video_url
              ? "Almost done..."
              : "Transcribing and smart merging...",
          );
        }
      } catch (error) {
        console.error("Polling failed:", error);
      }
    };

    await poll();
    pollingRef.current = setInterval(poll, 2000);
  };

  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await getJobs();
      setJobs(response.jobs);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowJobList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleWordClick = (time: number) => {
    setCurrentTime(time);
  };

  const handleSelectJob = async (selectedJobId: string) => {
    setShowJobList(false);
    setIsProcessing(true);
    setStatusMessage("Loading project...");

    try {
      const status = await getJobStatus(selectedJobId);

      if (status.status === "completed") {
        setJobId(selectedJobId);
        setVideoUrl(status.video_url || null);
        setTranscript(status.transcript || null);
        setCurrentTime(0);
        setStatusMessage("");
      } else if (status.status === "processing") {
        setJobId(selectedJobId);
        setStatusMessage("This project is still processing...");
        pollJobStatus(selectedJobId);
      } else if (status.status === "error") {
        setStatusMessage(status.error || "This project encountered an error");
      }
    } catch (error) {
      console.error("Failed to load job:", error);
      setStatusMessage("Failed to load project. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewProject = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setJobId(null);
    setVideoUrl(null);
    setTranscript(null);
    setCurrentTime(0);
    setStatusMessage("");
    setUploadProgress(0);
    setProcessingStep("");
    setShowJobList(false);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleSendMessage = async (message: string) => {
    if (!jobId) return;

    editStartRef.current = Date.now();
    setIsProcessing(true);
    setProcessingStep("Processing your edit...");
    setStatusMessage(`Processing: "${message}"`);

    try {
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(90, prev + 10));
      }, 500);

      const response = await processEdit(jobId, message);

      clearInterval(progressInterval);
      setVideoUrl(response.video_url);
      setTranscript(response.transcript);
      setStatusMessage("");
      setUploadProgress(100);
      setProcessingStep("");

      const elapsedMs = editStartRef.current
        ? Date.now() - editStartRef.current
        : 0;
      const elapsedSeconds = elapsedMs / 1000;
      const intensity = Math.min(1.7, Math.max(0.7, 0.7 + elapsedSeconds / 4));
      if (typeof window !== "undefined") {
        emitParticleBurst(window.innerWidth * 0.5, window.innerHeight * 0.8, {
          color: "#34d399",
          intensity,
        });
      }
    } catch (error) {
      console.error("Edit processing failed:", error);
      setStatusMessage("Edit failed. Please try again.");
      setIsProcessing(false);
      setUploadProgress(0);
      setProcessingStep("");

      if (typeof window !== "undefined") {
        emitParticleBurst(window.innerWidth * 0.5, window.innerHeight * 0.8, {
          color: "#f87171",
          intensity: 0.9,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing && !jobId) {
    return <LoadingSpinner />;
  }

  const showEditor = jobId && videoUrl;
  const showUpload = showEditor || (!isProcessing && !jobId);

  return (
    <div className="flex flex-col h-screen">
      <motion.header
        className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">VE</span>
          </div>
          <h1 className="text-xl font-semibold">Script-Based Video Editor</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* History Button with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setShowJobList(!showJobList);
                if (!showJobList) fetchJobs();
              }}
              className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="View previous projects"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">History</span>
            </button>

            {showJobList && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700">
                  <h3 className="text-sm font-medium text-white">
                    Previous Projects
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {isLoadingJobs ? (
                    <div className="px-4 py-6 text-center text-gray-400">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent mb-2"></div>
                      <p className="text-sm">Loading...</p>
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-400">
                      <p className="text-sm">No previous projects</p>
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <button
                        key={job.job_id}
                        onClick={() => handleSelectJob(job.job_id)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                          job.job_id === jobId ? "bg-gray-700/50" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-mono truncate">
                            {job.job_id.substring(0, 8)}...
                          </p>
                          <p className="text-xs text-gray-400">
                            {job.created_at
                              ? formatRelativeTime(job.created_at)
                              : "Unknown date"}
                          </p>
                        </div>
                        <span
                          className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            job.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : job.status === "processing"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {job.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* New Project Button */}
          {jobId && (
            <button
              onClick={handleNewProject}
              className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Start a new project"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-sm">New Project</span>
            </button>
          )}

          {/* Help Button */}
          <button
            className="text-gray-400 hover:text-white transition-colors p-2"
            title="Help coming soon!"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12 a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-gray-400">{user.email}</span>}
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {statusMessage && (
          <motion.div
            className={`px-6 py-2 text-sm text-center border-b ${
              isErrorMessage
                ? "bg-red-600/20 text-red-400 border-red-600/30"
                : isWarningMessage
                  ? "bg-yellow-600/20 text-yellow-300 border-yellow-600/30"
                  : "bg-blue-600/20 text-blue-400 border-blue-600/30"
            }`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {statusMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-hidden">
        {showUpload && !showEditor ? (
          <UploadZone
            onUpload={handleUpload}
            onDemo={handleDemo}
            isUploading={isProcessing}
            uploadProgress={uploadProgress}
            uploadStatus={processingStep}
          />
        ) : (
          <div className="flex h-full">
            <div className="w-1/2 border-r border-gray-800">
              {showEditor ? (
                <TranscriptEditor
                  transcript={transcript}
                  currentTime={currentTime}
                  onWordClick={handleWordClick}
                  jobId={jobId ?? ""}
                  isProcessing={isProcessing}
                  onTranscriptUpdate={setTranscript}
                  onVideoUrlUpdate={setVideoUrl}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">Loading transcript...</p>
                </div>
              )}
            </div>

            <div className="w-1/2 flex flex-col">
              {showEditor ? (
                <>
                  <div className="flex-1">
                    <VideoPreview
                      videoUrl={videoUrl}
                      currentTime={currentTime}
                      onTimeUpdate={setCurrentTime}
                      onSeek={setCurrentTime}
                    />
                  </div>
                  <WaveformTimeline
                    transcript={transcript ? getAllWords(transcript) : []}
                    currentTime={currentTime}
                    onSeek={setCurrentTime}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center flex-1">
                  <p className="text-gray-400">Loading video...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showEditor && (
        <MagicBox
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
