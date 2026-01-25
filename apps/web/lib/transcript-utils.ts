import { Transcript, Clip, Segment, Word } from './api-client'

/**
 * Flatten all words from a hierarchical transcript.
 * Useful for total word count, text extraction, etc.
 */
export function getAllWords(transcript: Transcript): Word[] {
  const words: Word[] = []
  
  for (const clip of transcript.clips) {
    for (const segment of clip.segments) {
      words.push(...segment.words)
    }
  }
  
  return words
}

/**
 * Get the full text from a transcript.
 * Uses the transcript.text field if available, otherwise joins all words.
 */
export function getFullText(transcript: Transcript): string {
  if (transcript.text) {
    return transcript.text
  }
  
  return getAllWords(transcript).map(w => w.word).join(' ')
}

/**
 * Get the total word count from a transcript.
 */
export function getWordCount(transcript: Transcript): number {
  return getAllWords(transcript).length
}

/**
 * Find which clip/segment/word corresponds to a given timestamp.
 * Returns null if no word is found at that time.
 */
export function findWordAtTime(
  transcript: Transcript,
  time: number
): { clipIndex: number; segmentIndex: number; wordIndex: number; word: Word } | null {
  for (let clipIndex = 0; clipIndex < transcript.clips.length; clipIndex++) {
    const clip = transcript.clips[clipIndex]
    
    for (let segmentIndex = 0; segmentIndex < clip.segments.length; segmentIndex++) {
      const segment = clip.segments[segmentIndex]
      
      for (let wordIndex = 0; wordIndex < segment.words.length; wordIndex++) {
        const word = segment.words[wordIndex]
        
        if (time >= word.start && time <= word.end) {
          return { clipIndex, segmentIndex, wordIndex, word }
        }
      }
    }
  }
  
  return null
}

/**
 * Check if a word is near the current time (within a range of words).
 */
export function isWordNearTime(
  transcript: Transcript,
  clipIndex: number,
  segmentIndex: number,
  wordIndex: number,
  currentTime: number,
  range: number = 2
): boolean {
  const current = findWordAtTime(transcript, currentTime)
  
  if (!current) return false
  
  // Same clip and segment
  if (current.clipIndex === clipIndex && current.segmentIndex === segmentIndex) {
    return Math.abs(current.wordIndex - wordIndex) <= range
  }
  
  return false
}

/**
 * Format a timestamp in seconds to MM:SS or H:MM:SS format.
 */
export function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Check if a transcript is empty (no clips or no words).
 */
export function isTranscriptEmpty(transcript: Transcript | null | undefined): boolean {
  if (!transcript) return true
  if (!transcript.clips || transcript.clips.length === 0) return true
  
  // Check if there are any words in any segment
  for (const clip of transcript.clips) {
    for (const segment of clip.segments) {
      if (segment.words.length > 0) {
        return false
      }
    }
  }
  
  return true
}

/**
 * Create an empty transcript structure.
 */
export function createEmptyTranscript(): Transcript {
  return {
    text: '',
    duration: 0,
    clips: []
  }
}
