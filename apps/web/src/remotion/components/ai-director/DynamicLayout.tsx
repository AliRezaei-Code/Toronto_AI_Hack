/**
 * DynamicLayout - Multi-speaker layout composition with automatic transitions.
 * 
 * Handles different layout modes:
 * - SINGLE_SPEAKER: Full frame on active speaker with smart crop
 * - SPLIT_SCREEN: Side-by-side or stacked view of both speakers
 * - REACTION_SHOT: Main speaker large, reactor in corner
 * - PICTURE_IN_PICTURE: Primary content with speaker overlay
 * 
 * Automatically transitions between layouts based on speaker changes.
 */

import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
  AbsoluteFill,
} from 'remotion';
import { SmartCrop, FaceCoordinate } from './SmartCrop';

export type LayoutType = 'single_speaker' | 'split_screen' | 'reaction_shot' | 'pip';

export interface LayoutFrame {
  frame: number;
  timestamp: number;
  layout_type: LayoutType;
  active_speaker: number;
  visible_speakers: number[];
}

export interface SpeakerSource {
  id: number;
  src: string;
  faceCoordinates: FaceCoordinate[];
  sourceWidth: number;
  sourceHeight: number;
}

export interface DynamicLayoutProps {
  /** Array of speaker video sources with their face tracking data */
  speakers: SpeakerSource[];
  /** Frame-by-frame layout decisions */
  layoutTimeline: LayoutFrame[];
  /** Default layout when no timeline entry */
  defaultLayout?: LayoutType;
  /** Enable smooth transitions between layouts */
  enableTransitions?: boolean;
  /** Transition duration in frames */
  transitionDuration?: number;
  /** Volume for speaker audio (0-1) */
  volume?: number;
  /** Time offset in source videos */
  startFrom?: number;
}

/**
 * Get layout at current frame with interpolation for transitions
 */
function getLayoutAtFrame(
  layoutTimeline: LayoutFrame[],
  frame: number,
  defaultLayout: LayoutType
): LayoutFrame {
  if (layoutTimeline.length === 0) {
    return {
      frame,
      timestamp: 0,
      layout_type: defaultLayout,
      active_speaker: 0,
      visible_speakers: [0],
    };
  }
  
  // Find the layout for current frame
  let current: LayoutFrame | null = null;
  
  for (const layout of layoutTimeline) {
    if (layout.frame <= frame) {
      current = layout;
    } else {
      break;
    }
  }
  
  return current || layoutTimeline[0];
}

/**
 * Single speaker layout - full frame with smart crop
 */
const SingleSpeakerLayout: React.FC<{
  speaker: SpeakerSource;
  volume: number;
  startFrom: number;
}> = ({ speaker, volume, startFrom }) => {
  const { width, height } = useVideoConfig();
  
  return (
    <AbsoluteFill>
      <SmartCrop
        src={speaker.src}
        faceCoordinates={speaker.faceCoordinates}
        activeSpeaker={speaker.id}
        sourceWidth={speaker.sourceWidth}
        sourceHeight={speaker.sourceHeight}
        targetWidth={width}
        targetHeight={height}
        volume={volume}
        startFrom={startFrom}
      />
    </AbsoluteFill>
  );
};

/**
 * Split screen layout - two speakers stacked vertically (for 9:16)
 */
const SplitScreenLayout: React.FC<{
  speakers: SpeakerSource[];
  activeSpeaker: number;
  volume: number;
  startFrom: number;
}> = ({ speakers, activeSpeaker, volume, startFrom }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  // Active speaker is slightly larger
  const activeScale = spring({
    frame,
    fps,
    from: 1,
    to: 1.05,
    config: { damping: 100 },
  });
  
  return (
    <AbsoluteFill>
      {speakers.slice(0, 2).map((speaker, index) => {
        const isActive = speaker.id === activeSpeaker;
        const yPosition = index === 0 ? 0 : height / 2;
        const scale = isActive ? activeScale : 1;
        
        return (
          <div
            key={speaker.id}
            style={{
              position: 'absolute',
              top: yPosition,
              left: 0,
              width: '100%',
              height: '50%',
              overflow: 'hidden',
              transform: `scale(${scale})`,
              transformOrigin: index === 0 ? 'center bottom' : 'center top',
              zIndex: isActive ? 2 : 1,
            }}
          >
            <SmartCrop
              src={speaker.src}
              faceCoordinates={speaker.faceCoordinates}
              activeSpeaker={speaker.id}
              sourceWidth={speaker.sourceWidth}
              sourceHeight={speaker.sourceHeight}
              targetWidth={width}
              targetHeight={height / 2}
              volume={isActive ? volume : 0}
              startFrom={startFrom}
              zoomFactor={1.4}
            />
          </div>
        );
      })}
      
      {/* Divider line */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: '#FFFFFF',
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Reaction shot layout - main speaker large, reactor small in corner
 */
const ReactionShotLayout: React.FC<{
  speakers: SpeakerSource[];
  activeSpeaker: number;
  volume: number;
  startFrom: number;
}> = ({ speakers, activeSpeaker, volume, startFrom }) => {
  const { width, height } = useVideoConfig();
  
  const mainSpeaker = speakers.find(s => s.id === activeSpeaker) || speakers[0];
  const reactorSpeaker = speakers.find(s => s.id !== activeSpeaker) || speakers[1];
  
  // PIP dimensions (30% of width, maintains aspect)
  const pipWidth = width * 0.35;
  const pipHeight = pipWidth * (16 / 9); // Assuming 16:9 source, showing in portrait
  
  return (
    <AbsoluteFill>
      {/* Main speaker - full frame */}
      <SmartCrop
        src={mainSpeaker.src}
        faceCoordinates={mainSpeaker.faceCoordinates}
        activeSpeaker={mainSpeaker.id}
        sourceWidth={mainSpeaker.sourceWidth}
        sourceHeight={mainSpeaker.sourceHeight}
        targetWidth={width}
        targetHeight={height}
        volume={volume}
        startFrom={startFrom}
      />
      
      {/* Reactor - small PIP */}
      {reactorSpeaker && (
        <div
          style={{
            position: 'absolute',
            top: height * 0.05,
            right: width * 0.05,
            width: pipWidth,
            height: pipHeight,
            borderRadius: 16,
            overflow: 'hidden',
            border: '4px solid #FFFFFF',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <SmartCrop
            src={reactorSpeaker.src}
            faceCoordinates={reactorSpeaker.faceCoordinates}
            activeSpeaker={reactorSpeaker.id}
            sourceWidth={reactorSpeaker.sourceWidth}
            sourceHeight={reactorSpeaker.sourceHeight}
            targetWidth={pipWidth}
            targetHeight={pipHeight}
            volume={0} // Reactor is muted
            startFrom={startFrom}
            zoomFactor={1.5}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * Picture-in-Picture layout - similar to reaction but bottom corner
 */
const PictureInPictureLayout: React.FC<{
  speakers: SpeakerSource[];
  activeSpeaker: number;
  volume: number;
  startFrom: number;
}> = ({ speakers, activeSpeaker, volume, startFrom }) => {
  const { width, height } = useVideoConfig();
  
  const mainSpeaker = speakers.find(s => s.id === activeSpeaker) || speakers[0];
  const pipSpeaker = speakers.find(s => s.id !== activeSpeaker) || speakers[1];
  
  const pipSize = width * 0.3;
  
  return (
    <AbsoluteFill>
      {/* Main speaker */}
      <SmartCrop
        src={mainSpeaker.src}
        faceCoordinates={mainSpeaker.faceCoordinates}
        activeSpeaker={mainSpeaker.id}
        sourceWidth={mainSpeaker.sourceWidth}
        sourceHeight={mainSpeaker.sourceHeight}
        targetWidth={width}
        targetHeight={height}
        volume={volume}
        startFrom={startFrom}
      />
      
      {/* PIP speaker - bottom left, circular */}
      {pipSpeaker && (
        <div
          style={{
            position: 'absolute',
            bottom: height * 0.15, // Above safe area
            left: width * 0.05,
            width: pipSize,
            height: pipSize,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid #FFFFFF',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <SmartCrop
            src={pipSpeaker.src}
            faceCoordinates={pipSpeaker.faceCoordinates}
            activeSpeaker={pipSpeaker.id}
            sourceWidth={pipSpeaker.sourceWidth}
            sourceHeight={pipSpeaker.sourceHeight}
            targetWidth={pipSize}
            targetHeight={pipSize}
            volume={0}
            startFrom={startFrom}
            zoomFactor={1.8}
            verticalBias={0.3}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

export const DynamicLayout: React.FC<DynamicLayoutProps> = ({
  speakers,
  layoutTimeline,
  defaultLayout = 'single_speaker',
  enableTransitions = true,
  transitionDuration = 10,
  volume = 1,
  startFrom = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const currentLayout = useMemo(() => {
    return getLayoutAtFrame(layoutTimeline, frame, defaultLayout);
  }, [layoutTimeline, frame, defaultLayout]);
  
  // Get speakers for current layout
  const visibleSpeakers = useMemo(() => {
    if (currentLayout.visible_speakers.length === 0) {
      return speakers;
    }
    return speakers.filter(s => currentLayout.visible_speakers.includes(s.id));
  }, [speakers, currentLayout.visible_speakers]);
  
  // Render appropriate layout
  const renderLayout = () => {
    const layoutProps = {
      speakers: visibleSpeakers,
      activeSpeaker: currentLayout.active_speaker,
      volume,
      startFrom,
    };
    
    switch (currentLayout.layout_type) {
      case 'single_speaker':
        const activeSpeaker = speakers.find(s => s.id === currentLayout.active_speaker) || speakers[0];
        return (
          <SingleSpeakerLayout
            speaker={activeSpeaker}
            volume={volume}
            startFrom={startFrom}
          />
        );
      
      case 'split_screen':
        return <SplitScreenLayout {...layoutProps} />;
      
      case 'reaction_shot':
        return <ReactionShotLayout {...layoutProps} />;
      
      case 'pip':
        return <PictureInPictureLayout {...layoutProps} />;
      
      default:
        const defaultSpeaker = speakers[0];
        return (
          <SingleSpeakerLayout
            speaker={defaultSpeaker}
            volume={volume}
            startFrom={startFrom}
          />
        );
    }
  };
  
  return <AbsoluteFill>{renderLayout()}</AbsoluteFill>;
};

export default DynamicLayout;
