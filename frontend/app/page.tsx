'use client'

import { useState, useEffect, useRef } from 'react'
import { UploadZone } from '@/components/UploadZone'
import { VideoPreview } from '@/components/VideoPreview'
import { TranscriptEditor } from '@/components/TranscriptEditor'
import { MagicBox } from '@/components/MagicBox'
import { WaveformTimeline } from '@/components/WaveformTimeline'
import { uploadVideos, getJobStatus, processEdit, startDemoJob } from '@/lib/api-client'

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      <p className="mt-4 text-gray-400">Loading...</p>
    </div>
  </div>
)

interface Word {
  word: string
  start: number
  end: number
}

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<Word[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState('')

  const statusMessageLower = statusMessage.toLowerCase()
  const isErrorMessage =
    statusMessageLower.includes('failed') || statusMessageLower.includes('error')
  const isWarningMessage =
    statusMessageLower.includes('warning') ||
    statusMessageLower.includes('transcription') ||
    statusMessageLower.includes('disabled')
  
  const pollingRef = useRef<NodeJS.Timeout>()

  const handleUpload = async (files: File[]) => {
    setIsProcessing(true)
    setUploadProgress(0)
    setProcessingStep('Uploading videos...')
    setStatusMessage('Uploading and processing videos...')
    
    try {
      const result = await uploadVideos(files, (progress) => {
        setUploadProgress(progress)
        if (progress < 30) {
          setProcessingStep('Uploading videos...')
        } else if (progress < 60) {
          setProcessingStep('Stitching clips together...')
        } else if (progress < 90) {
          setProcessingStep('Generating transcript with AI...')
        } else {
          setProcessingStep('Finalizing...')
        }
      })
      setJobId(result.job_id)
      
      pollJobStatus(result.job_id)
    } catch (error) {
      console.error('Upload failed:', error)
      setStatusMessage('Upload failed. Please try again.')
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  const handleDemo = async () => {
    setIsProcessing(true)
    setUploadProgress(0)
    setProcessingStep('Loading demo clips...')
    setStatusMessage('Loading demo clips...')

    try {
      const result = await startDemoJob()
      setJobId(result.job_id)
      pollJobStatus(result.job_id)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Demo failed to start.'
      setStatusMessage(message)
      setIsProcessing(false)
      setProcessingStep('')
      setUploadProgress(0)
    }
  }

  const pollJobStatus = async (id: string) => {
    const poll = async () => {
      try {
        const status = await getJobStatus(id)
        
        if (status.status === 'completed') {
          setVideoUrl(status.video_url || null)
          setTranscript(status.transcript?.words || [])
          setIsProcessing(false)
          setStatusMessage(status.warning || '')
          setUploadProgress(100)
          setProcessingStep('')
          if (pollingRef.current) clearInterval(pollingRef.current)
        } else if (status.status === 'error') {
          setStatusMessage(status.error || 'An error occurred')
          setIsProcessing(false)
          setUploadProgress(0)
          setProcessingStep('')
          if (pollingRef.current) clearInterval(pollingRef.current)
        } else {
          setUploadProgress(Math.min(85, uploadProgress + 5))
          setProcessingStep(status.video_url ? 'Almost done...' : 'Processing videos and generating transcript...')
        }
      } catch (error) {
        console.error('Polling failed:', error)
      }
    }

    await poll()
    pollingRef.current = setInterval(poll, 2000)
  }

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const handleWordClick = (time: number) => {
    setCurrentTime(time)
  }

  const handleSendMessage = async (message: string) => {
    if (!jobId) return
    
    setIsProcessing(true)
    setProcessingStep('Processing your edit...')
    setStatusMessage(`Processing: "${message}"`)

    try {
      setUploadProgress(0)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(90, prev + 10))
      }, 500)
      
      const response = await processEdit(jobId, message)
      
      clearInterval(progressInterval)
      setVideoUrl(response.video_url)
      setTranscript(response.transcript.words)
      setStatusMessage('')
      setUploadProgress(100)
      setProcessingStep('')
    } catch (error) {
      console.error('Edit processing failed:', error)
      setStatusMessage('Edit failed. Please try again.')
      setIsProcessing(false)
      setUploadProgress(0)
      setProcessingStep('')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isProcessing && !jobId) {
    return <LoadingSpinner />
  }

  const showEditor = jobId && videoUrl
  const showUpload = showEditor || (!isProcessing && !jobId)

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">VE</span>
          </div>
          <h1 className="text-xl font-semibold">Script-Based Video Editor</h1>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors" title="Help coming soon!">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12 a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </header>

      {statusMessage && (
        <div className={`px-6 py-2 text-sm text-center border-b ${
          isErrorMessage
            ? 'bg-red-600/20 text-red-400 border-red-600/30'
            : isWarningMessage
            ? 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30'
            : 'bg-blue-600/20 text-blue-400 border-blue-600/30'
        }`}>
          {statusMessage}
        </div>
      )}

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
                  jobId={jobId ?? ''}
                  isProcessing={isProcessing}
                  onTranscriptUpdate={(newTranscript) => {
                    setTranscript(newTranscript)
                  }}
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
                    transcript={transcript}
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
        <MagicBox onSendMessage={handleSendMessage} isProcessing={isProcessing} />
      )}
    </div>
  )
}
