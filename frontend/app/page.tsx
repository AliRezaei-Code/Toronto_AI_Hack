'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import UploadZone from '@/components/UploadZone'
import VideoPreview from '@/components/VideoPreview'
import TranscriptEditor from '@/components/TranscriptEditor'
import { MagicBox } from '@/components/MagicBox'
import { uploadVideos, getJobStatus, processEdit } from '@/lib/api-client'

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
  
  const pollingRef = useRef<NodeJS.Timeout>()

  const handleUpload = async (files: File[]) => {
    setIsProcessing(true)
    setStatusMessage('Uploading and processing videos...')
    
    try {
      const result = await uploadVideos(files)
      setJobId(result.job_id)
      
      pollJobStatus(result.job_id)
    } catch (error) {
      console.error('Upload failed:', error)
      setStatusMessage('Upload failed. Please try again.')
      setIsProcessing(false)
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
          setStatusMessage('')
          if (pollingRef.current) clearInterval(pollingRef.current)
        } else if (status.status === 'error') {
          setStatusMessage(status.error || 'An error occurred')
          setIsProcessing(false)
          if (pollingRef.current) clearInterval(pollingRef.current)
        } else {
          setStatusMessage('Processing videos and generating transcript...')
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
    setStatusMessage(`Processing: "${message}"`)

    try {
      const response = await processEdit(jobId, message)
      setVideoUrl(response.video_url)
      setTranscript(response.transcript.words)
      setStatusMessage('')
    } catch (error) {
      console.error('Edit processing failed:', error)
      setStatusMessage('Edit failed. Please try again.')
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
        <button className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </header>

      {statusMessage && (
        <div className="px-6 py-2 bg-blue-600/20 text-blue-400 text-sm text-center border-b border-blue-600/30">
          {statusMessage}
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        {showUpload && !showEditor ? (
          <UploadZone onUpload={handleUpload} />
        ) : (
          <div className="flex h-full">
            <div className="w-1/2 border-r border-gray-800">
              {showEditor ? (
                <TranscriptEditor
                  transcript={transcript}
                  currentTime={currentTime}
                  onWordClick={handleWordClick}
                  isProcessing={isProcessing}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">Loading transcript...</p>
                </div>
              )}
            </div>

            <div className="w-1/2 flex flex-col">
              {showEditor ? (
                <VideoPreview
                  videoUrl={videoUrl}
                  currentTime={currentTime}
                  onTimeUpdate={setCurrentTime}
                  onSeek={setCurrentTime}
                />
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