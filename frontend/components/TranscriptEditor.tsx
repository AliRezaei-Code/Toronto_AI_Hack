'use client'

import { useEffect, useState, useRef } from 'react'
import { processEdit, Transcript, Word } from '@/lib/api-client'
import { 
  findWordAtTime, 
  formatTimestamp, 
  isTranscriptEmpty,
  getFullText,
  getWordCount
} from '@/lib/transcript-utils'

interface TranscriptEditorProps {
  transcript: Transcript | null
  currentTime: number
  onWordClick: (time: number) => void
  jobId: string
  isProcessing?: boolean
  onTranscriptUpdate?: (transcript: Transcript) => void
}

export function TranscriptEditor({
  transcript,
  currentTime,
  onWordClick,
  jobId,
  isProcessing = false,
  onTranscriptUpdate,
}: TranscriptEditorProps) {
  const [currentWordLocation, setCurrentWordLocation] = useState<{
    clipIndex: number
    segmentIndex: number
    wordIndex: number
  } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Track current word based on playback time
  useEffect(() => {
    if (!transcript) return
    
    const location = findWordAtTime(transcript, currentTime)
    if (location) {
      setCurrentWordLocation({
        clipIndex: location.clipIndex,
        segmentIndex: location.segmentIndex,
        wordIndex: location.wordIndex
      })
    } else {
      setCurrentWordLocation(null)
    }
  }, [currentTime, transcript])

  const handleWordClick = (time: number) => {
    onWordClick(time)
  }

  const handleStartEdit = () => {
    if (!transcript) return
    setEditedText(getFullText(transcript))
    setIsEditing(true)
    setSaveError(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedText('')
    setSaveError(null)
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    setSaveError(null)

    try {
      const result = await processEdit(jobId, editedText)
      
      if (onTranscriptUpdate) {
        onTranscriptUpdate(result.transcript)
      }
      
      setIsEditing(false)
      setEditedText('')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save transcript')
    } finally {
      setIsSaving(false)
    }
  }

  // Check if a word is the current word
  const isCurrentWord = (clipIdx: number, segIdx: number, wordIdx: number): boolean => {
    if (!currentWordLocation) return false
    return (
      currentWordLocation.clipIndex === clipIdx &&
      currentWordLocation.segmentIndex === segIdx &&
      currentWordLocation.wordIndex === wordIdx
    )
  }

  // Check if a word is near the current word (for subtle highlighting)
  const isNearCurrentWord = (clipIdx: number, segIdx: number, wordIdx: number): boolean => {
    if (!currentWordLocation) return false
    if (currentWordLocation.clipIndex !== clipIdx) return false
    if (currentWordLocation.segmentIndex !== segIdx) return false
    return Math.abs(currentWordLocation.wordIndex - wordIdx) <= 2 && 
           Math.abs(currentWordLocation.wordIndex - wordIdx) > 0
  }

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"></div>
          <p className="text-gray-400">Processing transcript...</p>
        </div>
      </div>
    )
  }

  if (isTranscriptEmpty(transcript)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-center">
          No transcript available.<br />Upload videos to generate transcript.
        </p>
      </div>
    )
  }

  const wordCount = transcript ? getWordCount(transcript) : 0

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Transcript</h3>
          <p className="text-sm text-gray-400">
            {isEditing 
              ? 'Edit the text below to edit the video' 
              : `${transcript?.clips.length || 0} clips • ${wordCount} words • Click any word to jump`}
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Text
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="flex-1 flex flex-col p-4">
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Edit the transcript text here..."
            autoFocus
          />
          
          {saveError && (
            <div className="mt-4 bg-red-900/30 border border-red-800 rounded-lg p-3">
              <p className="text-red-400 text-sm">{saveError}</p>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Apply Changes'}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {transcript?.clips.map((clip, clipIndex) => (
            <div key={`clip-${clipIndex}`} className="border-b border-gray-800 last:border-b-0">
              {/* Clip Header */}
              <div className="sticky top-0 z-10 bg-gray-800/95 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                    Clip {clipIndex + 1}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {clip.segments.length} segment{clip.segments.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-gray-500 text-sm font-mono">
                  {formatTimestamp(clip.start_offset)}
                </span>
              </div>
              
              {/* Segments */}
              <div className="p-4 space-y-3">
                {clip.segments.map((segment, segmentIndex) => (
                  <div 
                    key={`segment-${clipIndex}-${segmentIndex}`}
                    className="pl-3 border-l-2 border-gray-700 hover:border-blue-500/50 transition-colors"
                  >
                    {/* Segment timestamp */}
                    <div className="text-xs text-gray-500 mb-1 font-mono">
                      {formatTimestamp(segment.start)} - {formatTimestamp(segment.end)}
                    </div>
                    
                    {/* Words */}
                    <div className="text-lg leading-relaxed">
                      {segment.words.map((word, wordIndex) => {
                        const isCurrent = isCurrentWord(clipIndex, segmentIndex, wordIndex)
                        const isNear = isNearCurrentWord(clipIndex, segmentIndex, wordIndex)
                        
                        return (
                          <span
                            key={`word-${clipIndex}-${segmentIndex}-${wordIndex}`}
                            className={`inline-block mx-0.5 px-1 rounded transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-blue-500 text-white'
                                : isNear
                                ? 'bg-blue-500/30 text-white'
                                : 'text-gray-300 hover:bg-gray-700'
                            }`}
                            onClick={() => handleWordClick(word.start)}
                            title={`${word.start.toFixed(2)}s - ${word.end.toFixed(2)}s`}
                          >
                            {word.word}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
