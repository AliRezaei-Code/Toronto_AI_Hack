/**
 * SmartCrop - Dynamic face-following crop component for 9:16 vertical videos.
 * 
 * Takes face tracking coordinates and smoothly pans/crops the source video
 * to keep the active speaker in frame. Uses spring animations for smooth
 * transitions between crop positions.
 */

import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  OffthreadVideo,
  Sequence,
} from 'remotion';

export interface FaceCoordinate {
  frame: number;
  timestamp: number;
  face_id: number;
  x: number; // Normalized 0-1
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface SmartCropProps {
  /** Source video URL/path */
  src: string;
  /** Face tracking coordinates from video-processor service */
  faceCoordinates: FaceCoordinate[];
  /** Which face to follow (0 or 1 for two-speaker) */
  activeSpeaker?: number;
  /** Source video dimensions */
  sourceWidth: number;
  sourceHeight: number;
  /** Target output dimensions (default 1080x1920 for 9:16) */
  targetWidth?: number;
  targetHeight?: number;
  /** Zoom factor (1.0 = fit, 1.2 = 20% zoom for headroom) */
  zoomFactor?: number;
  /** Enable smooth spring animation between positions */
  enableSmoothing?: boolean;
  /** Spring damping (higher = less bouncy) */
  springDamping?: number;
  /** Vertical offset to keep face in upper third (talking head style) */
  verticalBias?: number;
  /** Playback volume */
  volume?: number;
  /** Start from this second in the source */
  startFrom?: number;
  /** End at this second in the source */
  endAt?: number;
}

/**
 * Interpolates face coordinates to find position at current frame.
 * Uses linear interpolation between keyframes.
 */
function getFaceAtFrame(
  coordinates: FaceCoordinate[],
  frame: number,
  faceId: number
): FaceCoordinate | null {
  // Filter to just this face
  const faceCoords = coordinates.filter(c => c.face_id === faceId);
  
  if (faceCoords.length === 0) return null;
  
  // Find surrounding keyframes
  let before: FaceCoordinate | null = null;
  let after: FaceCoordinate | null = null;
  
  for (const coord of faceCoords) {
    if (coord.frame <= frame) {
      before = coord;
    }
    if (coord.frame >= frame && !after) {
      after = coord;
      break;
    }
  }
  
  // If no surrounding frames, return nearest
  if (!before && after) return after;
  if (before && !after) return before;
  if (!before && !after) return null;
  
  // If same frame, return exact
  if (before!.frame === after!.frame) return before;
  
  // Interpolate
  const t = (frame - before!.frame) / (after!.frame - before!.frame);
  
  return {
    frame,
    timestamp: before!.timestamp + t * (after!.timestamp - before!.timestamp),
    face_id: faceId,
    x: before!.x + t * (after!.x - before!.x),
    y: before!.y + t * (after!.y - before!.y),
    width: before!.width + t * (after!.width - before!.width),
    height: before!.height + t * (after!.height - before!.height),
    confidence: before!.confidence + t * (after!.confidence - before!.confidence),
  };
}

/**
 * Calculate crop window to center face while maintaining aspect ratio
 */
function calculateCropWindow(
  face: FaceCoordinate,
  sourceWidth: number,
  sourceHeight: number,
  targetAspect: number, // width/height, e.g., 9/16 = 0.5625
  zoomFactor: number,
  verticalBias: number
): { x: number; y: number; width: number; height: number; scale: number } {
  // Calculate face center in pixels
  const faceCenterX = (face.x + face.width / 2) * sourceWidth;
  const faceCenterY = (face.y + face.height / 2) * sourceHeight;
  
  // Face size in pixels for scale calculation
  const faceHeight = face.height * sourceHeight;
  
  // Target crop dimensions - we want to capture at least the face with headroom
  // The crop should fill the target aspect ratio
  const sourceAspect = sourceWidth / sourceHeight;
  
  let cropWidth: number;
  let cropHeight: number;
  
  if (sourceAspect > targetAspect) {
    // Source is wider than target - crop sides
    cropHeight = sourceHeight / zoomFactor;
    cropWidth = cropHeight * targetAspect;
  } else {
    // Source is taller than target - crop top/bottom
    cropWidth = sourceWidth / zoomFactor;
    cropHeight = cropWidth / targetAspect;
  }
  
  // Center crop on face, with vertical bias to keep face in upper portion
  let cropX = faceCenterX - cropWidth / 2;
  let cropY = faceCenterY - cropHeight * (0.3 + verticalBias); // Face in upper third
  
  // Clamp to source bounds
  cropX = Math.max(0, Math.min(cropX, sourceWidth - cropWidth));
  cropY = Math.max(0, Math.min(cropY, sourceHeight - cropHeight));
  
  return {
    x: cropX,
    y: cropY,
    width: cropWidth,
    height: cropHeight,
    scale: zoomFactor,
  };
}

export const SmartCrop: React.FC<SmartCropProps> = ({
  src,
  faceCoordinates,
  activeSpeaker = 0,
  sourceWidth,
  sourceHeight,
  targetWidth = 1080,
  targetHeight = 1920,
  zoomFactor = 1.2,
  enableSmoothing = true,
  springDamping = 200,
  verticalBias = 0.1,
  volume = 1,
  startFrom = 0,
  endAt,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  const targetAspect = targetWidth / targetHeight;
  
  // Get face position at current frame
  const currentFace = useMemo(() => {
    // Adjust frame for startFrom offset
    const sourceFrame = frame + Math.floor(startFrom * fps);
    return getFaceAtFrame(faceCoordinates, sourceFrame, activeSpeaker);
  }, [faceCoordinates, frame, activeSpeaker, startFrom, fps]);
  
  // Calculate crop window
  const cropWindow = useMemo(() => {
    if (!currentFace) {
      // Default: center crop
      return calculateCropWindow(
        {
          frame: 0,
          timestamp: 0,
          face_id: 0,
          x: 0.3,
          y: 0.2,
          width: 0.4,
          height: 0.5,
          confidence: 0.5,
        },
        sourceWidth,
        sourceHeight,
        targetAspect,
        zoomFactor,
        verticalBias
      );
    }
    
    return calculateCropWindow(
      currentFace,
      sourceWidth,
      sourceHeight,
      targetAspect,
      zoomFactor,
      verticalBias
    );
  }, [currentFace, sourceWidth, sourceHeight, targetAspect, zoomFactor, verticalBias]);
  
  // Apply spring smoothing to crop position
  const smoothedX = enableSmoothing
    ? spring({
        frame,
        fps,
        from: cropWindow.x,
        to: cropWindow.x,
        config: { damping: springDamping },
      })
    : cropWindow.x;
  
  const smoothedY = enableSmoothing
    ? spring({
        frame,
        fps,
        from: cropWindow.y,
        to: cropWindow.y,
        config: { damping: springDamping },
      })
    : cropWindow.y;
  
  // Calculate transform to position the video
  // We need to scale and translate the video so the crop window fills the output
  const scaleX = width / cropWindow.width;
  const scaleY = height / cropWindow.height;
  const scale = Math.max(scaleX, scaleY);
  
  const translateX = -smoothedX * scale;
  const translateY = -smoothedY * scale;
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
      }}
    >
      <OffthreadVideo
        src={src}
        volume={volume}
        startFrom={Math.floor(startFrom * fps)}
        endAt={endAt ? Math.floor(endAt * fps) : undefined}
        style={{
          position: 'absolute',
          width: sourceWidth * scale,
          height: sourceHeight * scale,
          transform: `translate(${translateX}px, ${translateY}px)`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
};

export default SmartCrop;
