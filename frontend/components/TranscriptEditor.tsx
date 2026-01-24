'use client'

import { useEffect, useState, useRef, useCallback, KeyboardEvent } from 'react'
import { editTranscriptText } from '@/lib/api-client'

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
  const [isSidebarEdit, setIsSidebarEdit] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [inlineEditedWords, setInlineEditedWords] = useState<Word[]>([])
  const [editedWordIndices, setEditedWordIndices] = useState<Set<number>>(new Set())
  const [editedWordIndex, setEditedWordIndex] = useState<number | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inlineInputRef = useRef<HTMLInputElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const baselineWordsRef = useRef<Word[]>([])
  const historyIndexRef = useRef(-1)

  useEffect(() => {
    const index = transcript.findIndex(
      word => currentTime >= word.start && currentTime <= word.end
    )
    setHighlightedWordIndex(index)
  }, [currentTime, transcript])

  useEffect(() => {
    if (!isEditing) {
      setInlineEditedWords([])
      setEditedWordIndex(null)
      setEditedWordIndices(new Set())
      setSaveError(null)
    }
  }, [isEditing])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isEditing) {
      baselineWordsRef.current = transcript
    }
  }, [isEditing, transcript])

  const queueInlineSave = useCallback(
    (words: Word[], immediate = false) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }

      const save = async () => {
        setIsSaving(true)
        setSaveError(null)

        try {
          const newText = words.map(word => word.word).join(' ')
          const result = await editTranscriptText(jobId, newText)

          if (onTranscriptUpdate) {
            onTranscriptUpdate(result.transcript.words)
          }

          baselineWordsRef.current = words
          setInlineEditedWords(words)
          setEditedWordIndex(null)
          setEditedWordIndices(new Set())
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : 'Failed to save transcript')
        } finally {
          setIsSaving(false)
        }
      }

      if (immediate) {
        void save()
      } else {
        saveTimeoutRef.current = setTimeout(() => {
          void save()
        }, 1500)
      }
    },
    [jobId, onTranscriptUpdate]
  )

  const handleStartInlineEdit = (index: number) => {
    setIsEditing(true)
    setIsSidebarEdit(false)
    setEditedWordIndex(index)
    setInlineEditedWords([...transcript])
    setEditedWordIndices(new Set())
    setEditedText(transcript.map(word => word.word).join(' '))
    baselineWordsRef.current = transcript

    setTimeout(() => {
      inlineInputRef.current?.focus()
    }, 10)
  }

  const handleInlineWordChange = (index: number, newWord: string) => {
    const updatedWords = inlineEditedWords.length ? [...inlineEditedWords] : [...transcript]
    const baselineWords = baselineWordsRef.current.length ? baselineWordsRef.current : transcript

    updatedWords[index] = {
      ...updatedWords[index],
      word: newWord,
    }

    const updatedEditedIndices = new Set(editedWordIndices)
    const baselineWord = baselineWords[index]?.word || ''
    if (newWord !== baselineWord) {
      updatedEditedIndices.add(index)
    } else {
      updatedEditedIndices.delete(index)
    }

    setInlineEditedWords(updatedWords)
    setEditedWordIndices(updatedEditedIndices)
    setEditedText(updatedWords.map(word => word.word).join(' '))

    queueInlineSave(updatedWords)
  }

  const handleInlineKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Escape') {
      setIsEditing(false)
      setIsSidebarEdit(false)
      setEditedWordIndex(null)
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      const nextIndex = index + 1
      if (nextIndex < transcript.length) {
        setEditedWordIndex(nextIndex)
        setTimeout(() => {
          const nextInput = document.querySelector(
            `[data-word-index="${nextIndex}"]`
          ) as HTMLInputElement | null
          nextInput?.focus()
          nextInput?.select()
        }, 10)
      }
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const wordsToSave = inlineEditedWords.length ? inlineEditedWords : transcript
      queueInlineSave(wordsToSave, true)
    }
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    setIsSidebarEdit(true)
    setEditedText(transcript.map(word => word.word).join(' '))
    setSaveError(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setIsSidebarEdit(false)
    setEditedText('')
    setSaveError(null)
    setEditedWordIndex(null)
    setInlineEditedWords([])
    setEditedWordIndices(new Set())
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    setSaveError(null)

    try {
      const result = await editTranscriptText(jobId, editedText)

      if (onTranscriptUpdate) {
        onTranscriptUpdate(result.transcript.words)
      }

      setIsEditing(false)
      setIsSidebarEdit(false)
      setEditedText('')
      setEditedWordIndex(null)
      setInlineEditedWords([])
      setEditedWordIndices(new Set())
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save transcript')
    } finally {
      setIsSaving(false)
    }
  }

  const displayWords =
    isEditing && !isSidebarEdit && inlineEditedWords.length > 0
      ? inlineEditedWords
      : transcript

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
            {isEditing
              ? isSidebarEdit
                ? 'Edit the text below to edit the video'
                : 'Double-click any word to edit. Changes auto-save.'
              : 'Click any word to jump to that moment'}
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
        {isEditing && !isSidebarEdit && (
          <button
            onClick={handleStartEdit}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Full Text Edit
          </button>
        )}
      </div>

      {isEditing && isSidebarEdit ? (
        <div className="flex-1 flex flex-col p-4">
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={(event) => setEditedText(event.target.value)}
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
            <button
              onClick={() => {
                setIsSidebarEdit(false)
                setEditedWordIndex(null)
              }}
              disabled={isSaving}
              className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
            >
              Inline Edit
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="text-lg leading-relaxed transcript-panel">
            {displayWords.map((word, index) => {
              const isHighlighted = highlightedWordIndex === index
              const isNearCurrent =
                index >= highlightedWordIndex - 2 && index <= highlightedWordIndex + 2
              const isBeingEdited = editedWordIndex === index
              const revealDelay = Math.min(index * 14, 280)

              return (
                <span
                  key={`${index}-${word.start}`}
                  className={`inline-block mx-0.5 px-1 rounded transition-all relative word-reveal ${
                    isBeingEdited
                      ? 'bg-green-600 text-white'
                      : editedWordIndices.has(index)
                      ? 'bg-yellow-600/80 text-white border border-yellow-400'
                      : isHighlighted
                      ? 'bg-blue-500 text-white cursor-pointer word-current'
                      : isNearCurrent
                      ? 'bg-blue-500/30 text-white cursor-pointer'
                      : 'text-gray-300 cursor-pointer hover:bg-gray-700'
                  }`}
                  onClick={() => onWordClick(word.start)}
                  onDoubleClick={() => handleStartInlineEdit(index)}
                  title={`${word.start.toFixed(2)}s - ${word.end.toFixed(2)}s${
                    isEditing ? ' (Double-click to edit word)' : ''
                  }`}
                  style={{ animationDelay: `${revealDelay}ms` }}
                >
                  {isBeingEdited ? (
                    <input
                      ref={index === editedWordIndex ? inlineInputRef : null}
                      type="text"
                      data-word-index={index}
                      value={word.word}
                      onChange={(event) => handleInlineWordChange(index, event.target.value)}
                      onKeyDown={(event) => handleInlineKeyDown(event, index)}
                      onBlur={() => {
                        if (!isSidebarEdit) {
                          setEditedWordIndex(null)
                        }
                      }}
                      className="bg-transparent border-b-2 border-green-400 outline-none w-auto min-w-[1ch] text-white"
                      style={{ width: `${Math.max(word.word.length * 0.6, 1)}em` }}
                    />
                  ) : (
                    word.word
                  )}
                </span>
              )
            })}
          </div>

          {saveError && !isSidebarEdit && (
            <div className="mt-4 bg-red-900/30 border border-red-800 rounded-lg p-3 mx-4">
              <p className="text-red-400 text-sm">{saveError}</p>
            </div>
          )}

          {isSaving && !isSidebarEdit && (
            <div className="mt-4 flex items-center gap-2 mx-4 text-gray-400 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span>Saving changes...</span>
            </div>
          )}

          {!isSidebarEdit && (
            <>
              <div className="mt-4 mx-4 text-sm text-gray-500">
                <p>Double-click any word to edit. Auto-saves after you stop typing. Press Enter to save now.</p>
              </div>

              {editedWordIndices.size > 0 && (
                <div className="mt-3 mx-4 flex items-center gap-3 text-sm">
                  <span className="text-gray-400">Changes:</span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-yellow-600/80 border border-yellow-400 rounded"></span>
                    <span className="text-gray-300">Modified ({editedWordIndices.size})</span>
                  </span>
                  <button
                    onClick={() => {
                      setEditedWordIndices(new Set())
                      setInlineEditedWords([...transcript])
                    }}
                    disabled={isSaving}
                    className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                  >
                    Reset Changes
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
