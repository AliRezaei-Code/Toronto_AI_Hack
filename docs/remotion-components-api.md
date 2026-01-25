# Remotion Component API Documentation

This document provides detailed API documentation for all Remotion components implemented in this project.

---

## Table of Contents

1. [TextAnimation](#textanimation)
2. [BackgroundGradient](#backgroundgradient)
3. [AudioVisualizer](#audiovisualizer)
4. [Transition](#transition)

---

## TextAnimation

A versatile text animation component that provides multiple animation types for text elements in video compositions.

### Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `children` | `React.ReactNode` | Required | Text or content to animate |
| `style` | `React.CSSProperties` | `{}` | Additional CSS styles to apply |
| `animationType` | `'fadeIn' \| 'slideUp' \| 'scaleIn' \| 'rotateIn'` | `'fadeIn'` | Type of animation to apply |
| `delay` | `number` | `0` | Number of frames to delay animation start |
| `duration` | `number` | `30` | Duration of animation in frames |

### Animation Types

#### `fadeIn`
Smoothly fades content from transparent to opaque over the specified duration.

```tsx
<TextAnimation animationType="fadeIn" duration={45}>
  <h1>Fading Text</h1>
</TextAnimation>
```

#### `slideUp`
Slides content up from below while fading in.

```tsx
<TextAnimation animationType="slideUp" delay={15} duration={60}>
  <p>Slides up from bottom</p>
</TextAnimation>
```

#### `scaleIn`
Scales content from 0 to 1 while fading in.

```tsx
<TextAnimation animationType="scaleIn" duration={30}>
  <div>Scales from center</div>
</TextAnimation>
```

#### `rotateIn`
Rotates content 360° while scaling and fading in.

```tsx
<TextAnimation animationType="rotateIn" delay={20} duration={40}>
  <span>Rotates and scales</span>
</TextAnimation>
```

### Implementation Details

The component uses Remotion's `useCurrentFrame()` hook and `spring()` animation function:

```tsx
const getAnimationValues = () => {
  switch (animationType) {
    case 'fadeIn':
      return {
        opacity: spring({ frame, fps, config: { damping: 20 } }),
        transform: 'translateY(0px)',
      };
    // ... other cases
  }
};
```

---

## BackgroundGradient

An animated background gradient component that creates smooth color transitions between specified colors.

### Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `colors` | `string[]` | `['#1e293b', '#312e81', '#1e1b4b']` | Array of hex colors to transition between |
| `duration` | `number` | `120` | Duration of one full color cycle in frames |
| `direction` | `'horizontal' \| 'vertical' \| 'diagonal'` | `'horizontal'` | Gradient direction angle |
| `style` | `React.CSSProperties` | `{}` | Additional CSS styles to apply |

### Color Transitions

The component interpolates between colors using RGB values:

```tsx
const localProgress = (progress * (colors.length - 1)) % 1;
const r1 = parseInt(currentColor.slice(1, 3), 16);
const g1 = parseInt(currentColor.slice(3, 5), 16);
const b1 = parseInt(currentColor.slice(5, 7), 16);

// Linear interpolation
const r = Math.round(r1 + (r2 - r1) * localProgress);
const g = Math.round(g1 + (g2 - g1) * localProgress);
const b = Math.round(b1 + (b2 - b1) * localProgress);
```

### Gradient Directions

- **`horizontal`**: 90° angle gradient (left to right)
- **`vertical`**: 180° angle gradient (top to bottom)
- **`diagonal`**: 45° angle gradient (corner to corner)

### Usage Examples

```tsx
// Basic usage
<BackgroundGradient colors={['#ff6b6b', '#4ecdc4', '#45b7d1']} />

// With custom duration and direction
<BackgroundGradient 
  colors={['#667eea', '#764ba2', '#f093fb']}
  duration={180}
  direction="diagonal"
/>

// With additional styling
<BackgroundGradient 
  colors={['#fa709a', '#fee140', '#30cfd0']}
  style={{ opacity: 0.8 }}
/>
```

---

## AudioVisualizer

A dynamic audio visualization component that creates animated bar graphs to represent audio data.

### Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `audioData` | `number[]` | `undefined` | Array of audio amplitude values (auto-generated if not provided) |
| `barCount` | `number` | `32` | Number of visualization bars |
| `barWidth` | `number` | `4` | Width of each bar in pixels |
| `barSpacing` | `number` | `2` | Spacing between bars in pixels |
| `maxHeight` | `number` | `100` | Maximum height of bars in pixels |
| `color` | `string` | `'#3b82f6'` | Color of the bars |
| `style` | `React.CSSProperties` | `{}` | Additional CSS styles to apply |

### Fake Data Generation

If no `audioData` is provided, the component generates fake audio data:

```tsx
const bars = audioData || Array.from({ length: barCount }, (_, i) => {
  const frequency = (i + 1) / barCount;
  const time = frame / 30;
  return Math.sin(time * frequency * 4) * 0.5 + 0.5;
});
```

### Animation Implementation

Each bar is animated using spring physics with staggered timing:

```tsx
bars.map((value, index) => {
  const height = spring({
    frame: frame - index * 2, // Stagger effect
    fps: 30,
    config: { damping: 15 },
  });
  
  const barHeight = interpolate(height, [0, 1], [0, value * maxHeight]);
  
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
});
```

### Usage Examples

```tsx
// Basic usage (auto-generated data)
<AudioVisualizer barCount={24} color="#10b981" />

// Custom audio data
<AudioVisualizer 
  audioData={realAudioData}
  barWidth={6}
  barSpacing={3}
  maxHeight={120}
  color="#8b5cf6"
/>

// Minimalist style
<AudioVisualizer 
  barCount={16}
  barWidth={2}
  color="#ffffff"
  style={{ opacity: 0.7 }}
/>
```

---

## Transition

A flexible scene transition component that provides various entrance and exit effects.

### Props

| Prop | Type | Default | Description |
|------|------|----------|-------------|
| `children` | `React.ReactNode` | Required | Content to apply transition to |
| `type` | `'fadeIn' \| 'slideIn' \| 'zoomIn' \| 'rotateIn'` | `'fadeIn'` | Type of transition effect |
| `duration` | `number` | `30` | Duration of transition in frames |
| `direction` | `'left' \| 'right' \| 'up' \| 'down'` | `'left'` | Direction for slideIn transitions |
| `style` | `React.CSSProperties` | `{}` | Additional CSS styles to apply |

### Transition Types

#### `fadeIn`
Simple opacity fade from 0 to 1.

```tsx
<Transition type="fadeIn" duration={45}>
  <div>Fades in smoothly</div>
</Transition>
```

#### `slideIn`
Slides content in from specified direction.

```tsx
<Transition 
  type="slideIn" 
  direction="up" 
  duration={60}
>
  <p>Slides up from bottom</p>
</Transition>
```

#### `zoomIn`
Scales content from 0 to 1 with fade.

```tsx
<Transition type="zoomIn" duration={30}>
  <h2>Zooms from center</h2>
</Transition>
```

#### `rotateIn`
Rotates 360° while scaling and fading in.

```tsx
<Transition type="rotateIn" duration={40}>
  <span>Dramatic entrance</span>
</Transition>
```

### Implementation Details

```tsx
const getTransform = () => {
  const clampedProgress = Math.min(1, progress);
  
  switch (type) {
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
    // ... other cases
  }
};
```

---

## Performance Considerations

### Optimization Tips

1. **Minimize Re-calculations**: Cache expensive computations in `useMemo`
2. **Frame-based Updates**: Only animate what changes between frames
3. **Spring Tuning**: Adjust spring configs for smooth vs snappy animations
4. **Asset Optimization**: Pre-load images and reduce file sizes

### Memory Management

```tsx
// Good: Use useMemo for expensive calculations
const animationValues = useMemo(() => {
  return getAnimationValues();
}, [frame, animationType, duration]);

// Avoid: Recalculating on every render
const animationValues = getAnimationValues(); // Bad!
```

---

## Integration Examples

### Combining Components

```tsx
export const ComplexScene = () => {
  return (
    <AbsoluteFill>
      {/* Background */}
      <BackgroundGradient 
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        duration={180}
      />
      
      {/* Animated Title */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)' }}>
        <TextAnimation 
          animationType="scaleIn"
          duration={60}
          style={{ fontSize: 80, color: 'white', textAlign: 'center' }}
        >
          Dynamic Video
        </TextAnimation>
      </div>
      
      {/* Audio Visualization */}
      <div style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)' }}>
        <AudioVisualizer 
          barCount={24}
          barWidth={4}
          color="#60a5fa"
        />
      </div>
    </AbsoluteFill>
  );
};
```

### Responsive Design

```tsx
export const ResponsiveVideo = () => {
  const { width, height } = useVideoConfig();
  
  return (
    <AbsoluteFill>
      <BackgroundGradient colors={['#667eea', '#764ba2']} />
      
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)' 
      }}>
        <TextAnimation 
          animationType="fadeIn"
          style={{ 
            fontSize: width / 12, // Responsive text size
            color: 'white',
            textAlign: 'center'
          }}
        >
          {width}×{height}
        </TextAnimation>
      </div>
    </AbsoluteFill>
  );
};
```

---

## Troubleshooting

### Common Issues

1. **Animations not working**: Check `duration` and `delay` values
2. **Performance issues**: Reduce `barCount` or `duration` values
3. **Color interpolation**: Ensure hex colors are valid #RRGGBB format
4. **Spring physics**: Adjust `damping` and `mass` values for desired feel

### Debug Tools

```tsx
// Add frame counter for debugging
const frame = useCurrentFrame();
console.log(`Frame: ${frame}, Progress: ${frame / durationInFrames}`);

// Log animation values
useEffect(() => {
  console.log('Animation config:', { animationType, duration, delay });
}, [animationType, duration, delay]);
```