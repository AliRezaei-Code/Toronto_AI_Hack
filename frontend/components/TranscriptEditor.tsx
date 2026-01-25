'use client'

import { processEdit, Transcript } from '@/lib/api-client'
import { 
  findWordAtTime, 
  formatTimestamp, 
  isTranscriptEmpty,
  getFullText,
  getWordCount,
  getAllWords
} from '@/lib/transcript-utils'
import { useEffect, useState, useRef, useCallback, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { editTranscriptText } from '@/lib/api-client'

interface Word {
  word: string
  start: number
  end: number
}

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

  useEffect(() => {
    historyIndexRef.current = historyIndex
  }, [historyIndex])

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
    if (!isEditing && transcript) {
      baselineWordsRef.current = getAllWords(transcript)
    }
  }, [isEditing, transcript])

  useEffect(() => {
    if (!transcript) {
      return
    }

    const text = getFullText(transcript)
    setHistory((prev) => {
      const currentIndex = historyIndexRef.current
      if (currentIndex >= 0 && prev[currentIndex] === text) {
        return prev
      }

      const next = prev.slice(0, currentIndex + 1)
      next.push(text)
      historyIndexRef.current = next.length - 1
      setHistoryIndex(next.length - 1)
      return next
    })
  }, [transcript])

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
            onTranscriptUpdate(result.transcript)
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
    if (!transcript) return
    
    setIsEditing(true)
    setIsSidebarEdit(false)
    setEditedWordIndex(index)
    const allWords = getAllWords(transcript)
    setInlineEditedWords([...allWords])
    setEditedWordIndices(new Set())
    setEditedText(getFullText(transcript))
    baselineWordsRef.current = allWords

    setTimeout(() => {
      inlineInputRef.current?.focus()
    }, 10)
  }

  const handleInlineWordChange = (index: number, newWord: string) => {
    if (!transcript) return
    
    const allWords = getAllWords(transcript)
    const updatedWords = inlineEditedWords.length ? [...inlineEditedWords] : [...allWords]
    const baselineWords = baselineWordsRef.current.length ? baselineWordsRef.current : allWords

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
      if (!transcript) return
      const allWords = getAllWords(transcript)
      const nextIndex = index + 1
      if (nextIndex < allWords.length) {
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
      if (!transcript) return
      const allWords = getAllWords(transcript)
      const wordsToSave = inlineEditedWords.length ? inlineEditedWords : allWords
      queueInlineSave(wordsToSave, true)
    }
  }

  const handleStartEdit = () => {
    if (!transcript) return
    setEditedText(getFullText(transcript))
    setIsEditing(true)
    setIsSidebarEdit(true)
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
        onTranscriptUpdate(result.transcript)
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

  const canUndo = historyIndex > 0
  const canRedo = historyIndex >= 0 && historyIndex < history.length - 1
  const disableHistoryControls = isSaving || isEditing

  const applyHistory = async (targetIndex: number) => {
    const targetText = history[targetIndex]
    if (!targetText) {
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const result = await editTranscriptText(jobId, targetText)
      historyIndexRef.current = targetIndex
      setHistoryIndex(targetIndex)
      onTranscriptUpdate?.(result.transcript)
      setIsEditing(false)
      setIsSidebarEdit(false)
      setEditedWordIndex(null)
      setInlineEditedWords([])
      setEditedWordIndices(new Set())
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to apply history')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUndo = () => {
    if (!canUndo || disableHistoryControls) {
      return
    }
    void applyHistory(historyIndex - 1)
  }

  const handleRedo = () => {
    if (!canRedo || disableHistoryControls) {
      return
    }
    void applyHistory(historyIndex + 1)
  }

  const displayWords =
    isEditing && !isSidebarEdit && inlineEditedWords.length > 0
      ? inlineEditedWords
      : transcript ? getAllWords(transcript) : []

  if (isProcessing) {
    return (
      <motion.div
        className="flex items-center justify-center h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="text-center"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <motion.div
            className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-gray-400">Processing transcript...</p>
        </motion.div>
      </motion.div>
    )
  }

  if (isTranscriptEmpty(transcript)) {
    return (
      <motion.div
        className="flex items-center justify-center h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.p
          className="text-gray-400 text-center"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          No transcript available.<br />Upload videos to generate transcript.
        </motion.p>
      </motion.div>
    )
  }

  const wordCount = transcript ? getWordCount(transcript) : 0

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <motion.div
        className="p-4 border-b border-gray-700 flex justify-between items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
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
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo || disableHistoryControls}
            className="px-3 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Undo
          </motion.button>
          <motion.button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo || disableHistoryControls}
            className="px-3 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Redo
          </motion.button>
          {!isEditing && (
            <motion.button
              onClick={handleStartEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Edit Text
            </motion.button>
          )}
          {isEditing && !isSidebarEdit && (
            <motion.button
              onClick={handleStartEdit}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Full Text Edit
            </motion.button>
          )}
        </div>
      </motion.div>

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
            <motion.button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {isSaving ? 'Saving...' : 'Apply Changes'}
            </motion.button>
            <motion.button
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={() => {
                setIsSidebarEdit(false)
                setEditedWordIndex(null)
              }}
              disabled={isSaving}
              className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Inline Edit
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="text-lg leading-relaxed transcript-panel">
            {displayWords && displayWords.map((word, index) => {
              // Find which clip/segment/word this corresponds to for highlighting
              const wordLocation = transcript ? findWordAtTime(transcript, word.start) : null
              const isHighlighted = wordLocation && currentWordLocation
                ? wordLocation.clipIndex === currentWordLocation.clipIndex &&
                  wordLocation.segmentIndex === currentWordLocation.segmentIndex &&
                  wordLocation.wordIndex === currentWordLocation.wordIndex
                : false
              const isNearCurrent = wordLocation && currentWordLocation
                ? wordLocation.clipIndex === currentWordLocation.clipIndex &&
                  wordLocation.segmentIndex === currentWordLocation.segmentIndex &&
                  Math.abs(wordLocation.wordIndex - currentWordLocation.wordIndex) <= 2 &&
                  wordLocation.wordIndex !== currentWordLocation.wordIndex
                : false
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
                  <motion.button
                    onClick={() => {
                      if (!transcript) return
                      setEditedWordIndices(new Set())
                      setInlineEditedWords([...getAllWords(transcript)])
                    }}
                    disabled={isSaving}
                    className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Reset Changes
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}
