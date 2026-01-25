/**
 * Transcript-related types for video transcription
 */

/** A single word in a transcript with timing */
export interface Word {
  word: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: number;
  punctuatedWord?: string;
}

/** A segment of transcript (sentence or phrase) */
export interface Segment {
  id: string;
  text: string;
  start: number;
  end: number;
  speaker?: number;
  words: Word[];
}

/** A clip extracted from the transcript */
export interface Clip {
  id: string;
  title?: string;
  start: number;
  end: number;
  duration: number;
  segments: Segment[];
  thumbnail?: string;
}

/** Full transcript for a video */
export interface Transcript {
  id: string;
  videoId: string;
  segments: Segment[];
  words: Word[];
  speakers?: SpeakerInfo[];
  duration: number;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

/** Speaker identification info */
export interface SpeakerInfo {
  id: number;
  name?: string;
  color?: string;
}
