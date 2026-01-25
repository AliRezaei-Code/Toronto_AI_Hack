import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';

interface TextAnimationProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  animationType?: 'fadeIn' | 'slideUp' | 'scaleIn' | 'rotateIn';
  delay?: number;
  duration?: number;
}

export const TextAnimation: React.FC<TextAnimationProps> = ({
  children,
  style = {},
  animationType = 'fadeIn',
  delay = 0,
  duration = 30,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - delay);

  const getAnimationValues = () => {
    switch (animationType) {
      case 'fadeIn':
        return {
          opacity: spring({
            frame: adjustedFrame,
            fps: 30,
            config: { damping: 20 },
          }),
          transform: 'translateY(0px)',
        };
      
      case 'slideUp':
        return {
          opacity: spring({
            frame: adjustedFrame,
            fps: 30,
            config: { damping: 20 },
          }),
          transform: `translateY(${interpolate(
            adjustedFrame,
            [0, duration],
            [50, 0]
          )}px)`,
        };
      
      case 'scaleIn':
        const scale = spring({
          frame: adjustedFrame,
          fps: 30,
          config: { mass: 0.5 },
        });
        return {
          opacity: scale,
          transform: `scale(${scale})`,
        };
      
      case 'rotateIn':
        const rotation = interpolate(
          adjustedFrame,
          [0, duration],
          [180, 0]
        );
        const opacityRotation = spring({
          frame: adjustedFrame,
          fps: 30,
          config: { damping: 20 },
        });
        return {
          opacity: opacityRotation,
          transform: `rotate(${rotation}deg)`,
        };
      
      default:
        return { opacity: 1, transform: 'none' };
    }
  };

  const animationValues = getAnimationValues();

  return (
    <div
      style={{
        ...style,
        ...animationValues,
      }}
    >
      {children}
    </div>
  );
};