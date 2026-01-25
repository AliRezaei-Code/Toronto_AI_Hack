import React from 'react';
import { useCurrentFrame, spring, interpolateColors } from 'remotion';

interface BackgroundGradientProps {
  colors: string[];
  duration?: number;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
  style?: React.CSSProperties;
}

export const BackgroundGradient: React.FC<BackgroundGradientProps> = ({
  colors = ['#1e293b', '#312e81', '#1e1b4b'],
  duration = 120,
  direction = 'horizontal',
  style = {},
}) => {
  const frame = useCurrentFrame();
  
  const progress = spring({
    frame: frame % duration,
    fps: 30,
    config: { damping: 20 },
  });

  const getGradient = () => {
    const angle = direction === 'horizontal' ? 90 : direction === 'vertical' ? 180 : 45;
    const colorIndex = Math.floor(progress * (colors.length - 1));
    const localProgress = (progress * (colors.length - 1)) % 1;
    
    let currentColor = colors[colorIndex];
    let nextColor = colors[Math.min(colorIndex + 1, colors.length - 1)];
    
    if (localProgress > 0) {
      // Simple color interpolation (in a real app, you'd want proper color space conversion)
      const r1 = parseInt(currentColor.slice(1, 3), 16);
      const g1 = parseInt(currentColor.slice(3, 5), 16);
      const b1 = parseInt(currentColor.slice(5, 7), 16);
      const r2 = parseInt(nextColor.slice(1, 3), 16);
      const g2 = parseInt(nextColor.slice(3, 5), 16);
      const b2 = parseInt(nextColor.slice(5, 7), 16);
      
      const r = Math.round(r1 + (r2 - r1) * localProgress);
      const g = Math.round(g1 + (g2 - g1) * localProgress);
      const b = Math.round(b1 + (b2 - b1) * localProgress);
      
      currentColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    return `linear-gradient(${angle}deg, ${currentColor} 0%, ${colors[(colorIndex + 2) % colors.length]} 100%)`;
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: getGradient(),
        ...style,
      }}
    />
  );
};