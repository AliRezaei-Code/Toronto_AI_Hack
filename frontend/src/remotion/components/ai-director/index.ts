/**
 * AI Director Components
 * 
 * Remotion components for autonomous video repurposing:
 * - SmartCrop: Dynamic face-following crop for 9:16 vertical videos
 * - AnimatedSubtitles: Karaoke-style word highlighting
 * - DynamicLayout: Multi-speaker layout compositions
 * - AIDirectedShort: Main composition combining all features
 */

export { SmartCrop } from './SmartCrop';
export type { SmartCropProps, FaceCoordinate } from './SmartCrop';

export { AnimatedSubtitles } from './AnimatedSubtitles';
export type { 
  AnimatedSubtitlesProps, 
  DiarizedWord, 
  CaptionStyle, 
  Platform 
} from './AnimatedSubtitles';

export { DynamicLayout } from './DynamicLayout';
export type { 
  DynamicLayoutProps, 
  LayoutType, 
  LayoutFrame, 
  SpeakerSource 
} from './DynamicLayout';

export { AIDirectedShort } from './AIDirectedShort';
export type { 
  AIDirectedShortProps, 
  ViralClip, 
  EditDecisionList, 
  KeepRange 
} from './AIDirectedShort';
