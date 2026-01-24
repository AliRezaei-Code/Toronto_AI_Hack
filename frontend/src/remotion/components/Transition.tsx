import React from 'react';
import { useCurrentFrame, spring } from 'remotion';

interface TransitionProps {
  children: React.ReactNode;
  type: 'fadeIn' | 'slideIn' | 'zoomIn' | 'rotateIn';
  duration?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  style?: React.CSSProperties;
}

export const Transition: React.FC<TransitionProps> = ({
  children,
  type = 'fadeIn',
  duration = 30,
  direction = 'left',
  style = {},
}) => {
  const frame = useCurrentFrame();
  
  const progress = spring({
    frame,
    fps: 30,
    config: { damping: 20 },
  });

  const getTransform = () => {
    const clampedProgress = Math.min(1, progress);
    
    switch (type) {
      case 'fadeIn':
        return {
          opacity: clampedProgress,
          transform: 'none',
        };
      
      case 'slideIn':
        const distance = 100;
        const transforms = {
          left: `translateX(${-distance * (1 - clampedProgress)}px)`,
          right: `translateX(${distance * (1 - clampedProgress)}px)`,
          up: `translateY(${-distance * (1 - clampedProgress)}px)`,
          down: `translateY(${distance * (1 - clampedProgress)}px)`,
        };
        return {
          opacity: clampedProgress,
          transform: transforms[direction],
        };
      
      case 'zoomIn':
        return {
          opacity: clampedProgress,
          transform: `scale(${clampedProgress})`,
        };
      
      case 'rotateIn':
        return {
          opacity: clampedProgress,
          transform: `rotate(${(1 - clampedProgress) * 360}deg) scale(${clampedProgress})`,
        };
      
      default:
        return { opacity: 1, transform: 'none' };
    }
  };

  const { opacity, transform } = getTransform();

  return (
    <div
      style={{
        opacity,
        transform,
        ...style,
      }}
    >
      {children}
    </div>
  );
};