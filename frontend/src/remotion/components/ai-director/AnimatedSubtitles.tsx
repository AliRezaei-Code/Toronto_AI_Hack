/**
 * AnimatedSubtitles - Karaoke-style word highlighting with multiple style presets.
 * 
 * Features:
 * - Word-by-word highlighting synced to audio
 * - Multiple style presets (Hormozi, MrBeast, Minimal, Classic)
 * - Emphasis word support (larger/colored text)
 * - Safe area positioning for different platforms
 * - Smooth spring animations
 */

import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

export interface DiarizedWord {
  word: string;
  start: number; // seconds
  end: number; // seconds
  confidence: number;
  speaker_id?: number;
  is_filler?: boolean;
  punctuated_word?: string;
}

export type CaptionStyle = 'hormozi' | 'mrbeast' | 'minimal' | 'classic';
export type Platform = 'tiktok' | 'instagram' | 'youtube';

export interface AnimatedSubtitlesProps {
  /** Array of words with timing */
  words: DiarizedWord[];
  /** Words to emphasize (highlight/enlarge) */
  emphasisWords?: string[];
  /** Caption style preset */
  style?: CaptionStyle;
  /** Target platform for safe area positioning */
  platform?: Platform;
  /** Maximum words to show at once */
  maxWordsPerLine?: number;
  /** Custom font family */
  fontFamily?: string;
  /** Base font size (before scaling) */
  baseFontSize?: number;
  /** Primary text color */
  primaryColor?: string;
  /** Highlight color for current word */
  highlightColor?: string;
  /** Emphasis color for important words */
  emphasisColor?: string;
  /** Enable shadow/outline effect */
  enableShadow?: boolean;
  /** Vertical position (0 = top, 1 = bottom) */
  verticalPosition?: number;
  /** Start time offset in seconds */
  startFrom?: number;
}

// Style presets
const STYLE_PRESETS: Record<CaptionStyle, {
  fontFamily: string;
  baseFontSize: number;
  primaryColor: string;
  highlightColor: string;
  emphasisColor: string;
  backgroundColor: string;
  backgroundPadding: number;
  fontWeight: number;
  textTransform: 'none' | 'uppercase';
  letterSpacing: number;
  shadowStyle: string;
}> = {
  hormozi: {
    fontFamily: 'Impact, sans-serif',
    baseFontSize: 72,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFD700',
    emphasisColor: '#FF4444',
    backgroundColor: 'transparent',
    backgroundPadding: 0,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 2,
    shadowStyle: '3px 3px 0px #000, -3px -3px 0px #000, 3px -3px 0px #000, -3px 3px 0px #000',
  },
  mrbeast: {
    fontFamily: 'Arial Black, sans-serif',
    baseFontSize: 80,
    primaryColor: '#FFFFFF',
    highlightColor: '#00FF00',
    emphasisColor: '#FF00FF',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backgroundPadding: 16,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 1,
    shadowStyle: '4px 4px 0px #000',
  },
  minimal: {
    fontFamily: 'Inter, -apple-system, sans-serif',
    baseFontSize: 48,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    emphasisColor: '#3B82F6',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backgroundPadding: 12,
    fontWeight: 500,
    textTransform: 'none',
    letterSpacing: 0,
    shadowStyle: 'none',
  },
  classic: {
    fontFamily: 'Georgia, serif',
    baseFontSize: 52,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFD700',
    emphasisColor: '#FFD700',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backgroundPadding: 10,
    fontWeight: 600,
    textTransform: 'none',
    letterSpacing: 0.5,
    shadowStyle: '2px 2px 4px rgba(0, 0, 0, 0.8)',
  },
};

// Platform safe areas (percentage from edges)
const PLATFORM_SAFE_AREAS: Record<Platform, {
  top: number;
  bottom: number;
  left: number;
  right: number;
}> = {
  tiktok: { top: 0.15, bottom: 0.25, left: 0.05, right: 0.05 },
  instagram: { top: 0.12, bottom: 0.20, left: 0.05, right: 0.05 },
  youtube: { top: 0.10, bottom: 0.15, left: 0.05, right: 0.05 },
};

/**
 * Get words visible at current time, grouped into lines
 */
function getVisibleWords(
  words: DiarizedWord[],
  currentTime: number,
  maxWordsPerLine: number,
  windowDuration: number = 3 // seconds of context to show
): { words: DiarizedWord[]; activeIndex: number } {
  // Find current word index
  let activeIndex = -1;
  for (let i = 0; i < words.length; i++) {
    if (currentTime >= words[i].start && currentTime < words[i].end) {
      activeIndex = i;
      break;
    }
    if (currentTime < words[i].start) {
      activeIndex = Math.max(0, i - 1);
      break;
    }
  }
  
  if (activeIndex === -1 && words.length > 0) {
    activeIndex = words.length - 1;
  }
  
  // Get surrounding words for context
  const startIndex = Math.max(0, activeIndex - Math.floor(maxWordsPerLine / 2));
  const endIndex = Math.min(words.length, startIndex + maxWordsPerLine);
  
  return {
    words: words.slice(startIndex, endIndex),
    activeIndex: activeIndex - startIndex,
  };
}

export const AnimatedSubtitles: React.FC<AnimatedSubtitlesProps> = ({
  words,
  emphasisWords = [],
  style = 'hormozi',
  platform = 'tiktok',
  maxWordsPerLine = 5,
  fontFamily,
  baseFontSize,
  primaryColor,
  highlightColor,
  emphasisColor,
  enableShadow = true,
  verticalPosition = 0.75,
  startFrom = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  const currentTime = frame / fps + startFrom;
  const preset = STYLE_PRESETS[style];
  const safeArea = PLATFORM_SAFE_AREAS[platform];
  
  // Get visible words
  const { words: visibleWords, activeIndex } = useMemo(() => {
    return getVisibleWords(words, currentTime, maxWordsPerLine);
  }, [words, currentTime, maxWordsPerLine]);
  
  // Calculate position within safe area
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: width * safeArea.left,
    right: width * safeArea.right,
    top: height * safeArea.top + (height * (1 - safeArea.top - safeArea.bottom)) * verticalPosition,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: preset.backgroundPadding,
    backgroundColor: preset.backgroundColor,
    borderRadius: preset.backgroundPadding > 0 ? 8 : 0,
  };
  
  // Convert emphasis words to lowercase for matching
  const emphasisSet = new Set(emphasisWords.map(w => w.toLowerCase()));
  
  return (
    <div style={containerStyle}>
      {visibleWords.map((word, index) => {
        const isActive = index === activeIndex;
        const isEmphasis = emphasisSet.has(word.word.toLowerCase().replace(/[.,!?]/g, ''));
        const displayWord = word.punctuated_word || word.word;
        
        // Calculate animation progress for this word
        const wordProgress = interpolate(
          currentTime,
          [word.start, word.start + 0.1, word.end - 0.1, word.end],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        
        // Scale animation for active word
        const scale = isActive
          ? spring({
              frame: frame % 10,
              fps,
              from: 1,
              to: 1.1,
              config: { damping: 100 },
            })
          : 1;
        
        // Determine colors
        let color = primaryColor || preset.primaryColor;
        if (isActive) {
          color = highlightColor || preset.highlightColor;
        }
        if (isEmphasis) {
          color = emphasisColor || preset.emphasisColor;
        }
        
        const wordStyle: React.CSSProperties = {
          fontFamily: fontFamily || preset.fontFamily,
          fontSize: (baseFontSize || preset.baseFontSize) * (isEmphasis ? 1.2 : 1),
          fontWeight: preset.fontWeight,
          color,
          textTransform: preset.textTransform,
          letterSpacing: preset.letterSpacing,
          textShadow: enableShadow ? preset.shadowStyle : 'none',
          transform: `scale(${scale})`,
          opacity: interpolate(wordProgress, [0, 0.5, 1], [0.5, 1, 0.5]),
          display: 'inline-block',
          transition: 'transform 0.1s ease-out',
        };
        
        return (
          <span key={`${word.start}-${index}`} style={wordStyle}>
            {displayWord}{' '}
          </span>
        );
      })}
    </div>
  );
};

export default AnimatedSubtitles;
