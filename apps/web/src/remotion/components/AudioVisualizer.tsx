import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';

interface AudioVisualizerProps {
  audioData?: number[];
  barCount?: number;
  barWidth?: number;
  barSpacing?: number;
  maxHeight?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioData,
  barCount = 32,
  barWidth = 4,
  barSpacing = 2,
  maxHeight = 100,
  color = '#3b82f6',
  style = {},
}) => {
  const frame = useCurrentFrame();
  
  // Generate fake audio data if none provided
  const bars = audioData || Array.from({ length: barCount }, (_, i) => {
    const frequency = (i + 1) / barCount;
    const time = frame / 30;
    return Math.sin(time * frequency * 4) * 0.5 + 0.5;
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        height: maxHeight,
        gap: barSpacing,
        ...style,
      }}
    >
      {bars.map((value, index) => {
        const height = spring({
          frame: frame - index * 2, // Stagger the animation
          fps: 30,
          config: { damping: 15 },
          durationInFrames: 10,
        });
        
        const barHeight = interpolate(
          height,
          [0, 1],
          [0, value * maxHeight]
        );

        return (
          <div
            key={index}
            style={{
              width: barWidth,
              height: barHeight,
              backgroundColor: color,
              borderRadius: barWidth / 2,
              transform: `scaleY(${height})`,
              transformOrigin: 'bottom',
            }}
          />
        );
      })}
    </div>
  );
};