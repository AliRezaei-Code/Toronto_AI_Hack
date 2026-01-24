'use client'

import { useEffect, useState } from 'react'

interface Word {
  word: string
  start: number
  end: number
}

interface TranscriptEditorProps {
  transcript: Word[]
  currentTime: number
  onWordClick: (time: number) => void
  isProcessing?: boolean
}

export function TranscriptEditor({
  transcript,
  currentTime,
  onWordClick,
  isProcessing = false,
}: TranscriptEditorProps) {
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1)

  useEffect(() => {
    const index = transcript.findIndex(
      word => currentTime >= word.start && currentTime <= word.end
    )
    setHighlightedWordIndex(index)
  }, [currentTime, transcript])

  const handleWordClick = (time: number) => {
    onWordClick(time)
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
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold">Transcript</h3>
        <p className="text-sm text-gray-400">Click any word to jump to that moment</p>
      </div>
      
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
    </div>
  )
}