'use client'

import { useEffect, useState, useRef } from 'react'
import { processEdit } from '@/lib/api-client'

interface Word {
  word: string
  start: number
  end: number
}

interface TranscriptEditorProps {
  transcript: Word[]
  currentTime: number
  onWordClick: (time: number) => void
  jobId: string
  isProcessing?: boolean
  onTranscriptUpdate?: (transcript: Word[]) => void
}

export function TranscriptEditor({
  transcript,
  currentTime,
  onWordClick,
  jobId,
  isProcessing = false,
  onTranscriptUpdate,
}: TranscriptEditorProps) {
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1)
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const index = transcript.findIndex(
      word => currentTime >= word.start && currentTime <= word.end
    )
    setHighlightedWordIndex(index)
  }, [currentTime, transcript])

  const handleWordClick = (time: number) => {
    onWordClick(time)
  }

  const handleStartEdit = () => {
    setEditedText(transcript.map(w => w.word).join(' '))
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
        onTranscriptUpdate(result.transcript.words)
      }
      
      setIsEditing(false)
      setEditedText('')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save transcript')
    } finally {
      setIsSaving(false)
    }
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

  if (!transcript || transcript.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-center">
          No transcript available.<br />Upload videos to generate transcript.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Transcript</h3>
          <p className="text-sm text-gray-400">
            {isEditing ? 'Edit the text below to edit the video' : 'Click any word to jump to that moment'}
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
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="text-lg leading-relaxed">
            {transcript.map((word, index) => {
              const isHighlighted = highlightedWordIndex === index
              const isNearCurrent = 
                index >= highlightedWordIndex - 2 && index <= highlightedWordIndex + 2
              
              return (
                <span
                  key={`${index}-${word.start}`}
                  className={`inline-block mx-0.5 px-1 rounded transition-all ${
                    isHighlighted
                      ? 'bg-blue-500 text-white cursor-pointer'
                      : isNearCurrent
                      ? 'bg-blue-500/30 text-white cursor-pointer'
                      : 'text-gray-300 cursor-pointer hover:bg-gray-700'
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
      )}
    </div>
  )
}