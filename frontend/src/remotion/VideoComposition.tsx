import React from 'react';
import { 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate 
} from 'remotion';

export const VideoComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  // Animation values
  const opacity = spring({
    frame,
    fps,
    config: { damping: 20 },
  });
  
  const scale = spring({
    frame,
    fps,
    config: { mass: 0.5 },
  });
  
  const rotate = interpolate(
    frame,
    [0, 30],
    [0, Math.PI * 2]
  );

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          transform: `scale(${scale}) rotate(${rotate}rad)`,
          opacity,
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: width / 8,
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Remotion Video
        </h1>
        <p
          style={{
            color: '#94a3b8',
            fontSize: width / 20,
            textAlign: 'center',
            marginTop: width / 40,
          }}
        >
          Frame: {frame} | {width}x{height} @ {fps}fps
        </p>
      </div>
    </div>
  );
};