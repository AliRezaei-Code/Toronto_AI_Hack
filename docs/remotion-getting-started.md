# Getting Started with Remotion in This Project

This guide walks you through setting up, developing, and deploying Remotion videos within our video editing platform.

---

## Prerequisites

Before working with Remotion, ensure you have:

- **Node.js 16+** with npm
- **FFmpeg** installed and in system PATH
- **Basic React knowledge** (hooks, components, state)
- **TypeScript** understanding (optional but recommended)

---

## Quick Start

### 1. Switch to Remotion Branch

```bash
git checkout feature/add-remotion-video-editor
cd frontend
```

### 2. Install Dependencies

```bash
npm install
# This installs all Remotion packages and dependencies
```

### 3. Start Development Server

```bash
npm run dev
# Opens Next.js at http://localhost:3000
```

### 4. Open Remotion Studio (Optional)

```bash
npm run remotion:studio
# Opens visual Remotion editor
```

---

## Project Structure Overview

```
frontend/src/remotion/
├── index.ts              # Entry point - registers RemotionRoot
├── Root.tsx              # Composition definitions
├── VideoComposition.tsx    # Main video with 3 scenes
└── components/            # Reusable video components
    ├── TextAnimation.tsx
    ├── BackgroundGradient.tsx
    ├── AudioVisualizer.tsx
    └── Transition.tsx
```

### Understanding the Structure

1. **`index.ts`**: Entry point that calls `registerRoot(RemotionRoot)`
2. **`Root.tsx`**: Defines all available video compositions
3. **`VideoComposition.tsx`**: Main video logic with scenes and timing
4. **`components/`**: Reusable video elements

---

## Your First Video

### Step 1: Create a Simple Composition

Create `src/remotion/MyVideo.tsx`:

```tsx
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  // Animate scale based on frame
  const scale = spring({
    frame,
    fps,
    config: { damping: 20 },
  });
  
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          fontSize: width / 10,
          color: 'white',
          textAlign: 'center',
        }}
      >
        Frame: {frame}
      </div>
    </div>
  );
};
```

### Step 2: Register Your Composition

Add to `src/remotion/Root.tsx`:

```tsx
import { Composition } from 'remotion';
import { MyVideo } from './MyVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={150}  // 5 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      
      {/* Keep existing compositions */}
      <Composition
        id="VideoEditor"
        component={VideoComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
```

### Step 3: Preview Your Video

```bash
npm run remotion:preview
# Opens browser with your video
```

Navigate to the sidebar to see your "MyVideo" composition.

---

## Using the Component Library

### Import Components

```tsx
import { 
  TextAnimation, 
  BackgroundGradient, 
  AudioVisualizer, 
  Transition 
} from './components';
```

### Text Animations

```tsx
<TextAnimation 
  animationType="fadeIn"
  delay={15}
  duration={30}
  style={{ fontSize: 60, color: 'white' }}
>
  Hello Remotion!
</TextAnimation>
```

### Background Gradients

```tsx
<BackgroundGradient 
  colors={['#667eea', '#764ba2', '#f093fb']}
  duration={120}
  direction="diagonal"
/>

<TextAnimation 
  animationType="slideUp"
  style={{ color: 'white', position: 'absolute', top: '50%' }}
>
  Over Gradient
</TextAnimation>
```

### Audio Visualization

```tsx
<AudioVisualizer 
  barCount={24}
  barWidth={6}
  color="#60a5fa"
  style={{ position: 'absolute', bottom: '20%' }}
/>
```

### Transitions

```tsx
<Transition 
  type="zoomIn"
  duration={45}
>
  <div>Content that zooms in</div>
</Transition>
```

---

## Creating Complex Scenes

### Scene Structure

Our `VideoComposition.tsx` uses a scene-based approach:

```tsx
export const VideoComposition: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Define scene boundaries
  const scene1End = 90;
  const scene2End = 180;
  const scene3End = 300;
  
  const currentScene = frame < scene1End ? 1 : 
                     frame < scene2End ? 2 : 3;

  // Render different content based on scene
  return (
    <div style={{ flex: 1 }}>
      {currentScene === 1 && renderScene1()}
      {currentScene === 2 && renderScene2()}
      {currentScene === 3 && renderScene3()}
    </div>
  );
};
```

### Timing and Sequencing

Use frame-based timing for precise control:

```tsx
const sceneStartTime = 90;
const sceneDuration = 90;
const sceneProgress = (frame - sceneStartTime) / sceneDuration;

// Trigger events at specific frames
const shouldShowElement = frame > sceneStartTime + 30;
const elementOpacity = frame > sceneStartTime + 60 ? 1 : 0;
```

---

## Working with Assets

### Images

Place images in `public/` folder:

```tsx
import { staticFile } from 'remotion';
import { Img } from 'remotion';

<Img 
  src={staticFile('logo.png')} 
  style={{ width: 200, height: 100 }}
/>
```

### Videos

```tsx
import { Video } from 'remotion';

<Video 
  src={staticFile('background.mp4')}
  style={{ position: 'absolute', top: 0, left: 0 }}
/>
```

### Audio

```tsx
import { useAudioData } from 'remotion';

const audioData = useAudioData();
// audioData contains amplitude values for each frame
```

---

## Development Workflow

### 1. Preview Development

```bash
# Terminal 1: Next.js development
npm run dev

# Terminal 2: Remotion preview  
npm run remotion:preview

# Terminal 3: Remotion Studio (optional)
npm run remotion:studio
```

### 2. Iterative Development

1. **Make changes** to components
2. **See updates** in preview immediately
3. **Test timing** with frame counter
4. **Optimize** performance if needed

### 3. Export Videos

```bash
# Render landscape video
npm run remotion:render

# Render vertical short
npm run remotion:render-short

# Generate thumbnail
npm run remotion:thumbnail
```

---

## Advanced Techniques

### Custom Hooks

Create reusable animation logic:

```tsx
const useBounceAnimation = (duration: number = 30) => {
  const frame = useCurrentFrame();
  
  const progress = spring({
    frame,
    fps: 30,
    config: { damping: 15, mass: 1 },
  });
  
  const bounce = Math.abs(Math.sin(progress * Math.PI * 2));
  
  return bounce;
};

// Usage
export const BouncingElement = () => {
  const bounce = useBounceAnimation(60);
  
  return (
    <div style={{
      transform: `translateY(${-bounce * 20}px)`,
    }}>
      Bouncing Content
    </div>
  );
};
```

### Data-Driven Videos

Use props to create dynamic content:

```tsx
interface VideoProps {
  title: string;
  subtitle: string;
  userCount: number;
}

export const DataDrivenVideo: React.FC<VideoProps> = ({ title, subtitle, userCount }) => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill>
      <BackgroundGradient colors={['#1e3a8a', '#2d3748', '#4a5568']} />
      
      <TextAnimation 
        animationType="scaleIn"
        style={{ fontSize: 80, color: 'white' }}
      >
        {title}
      </TextAnimation>
      
      <TextAnimation 
        animationType="slideUp"
        delay={60}
        duration={30}
        style={{ fontSize: 40, color: '#cbd5e0' }}
      >
        {subtitle}
      </TextAnimation>
      
      <TextAnimation 
        animationType="fadeIn"
        delay={90}
        duration={30}
        style={{ fontSize: 30, color: '#a0aec0' }}
      >
        {userCount.toLocaleString()} Users
      </TextAnimation>
    </AbsoluteFill>
  );
};
```

---

## Performance Optimization

### Frame Rate Considerations

- **30 fps**: Standard for web videos
- **60 fps**: Smoother but more processing
- **24 fps**: Cinematic look

### Resolution Guidelines

```tsx
const getResolution = (quality: 'high' | 'medium' | 'low') => {
  switch (quality) {
    case 'high': return { width: 1920, height: 1080 };
    case 'medium': return { width: 1280, height: 720 };
    case 'low': return { width: 854, height: 480 };
  }
};
```

### Memory Management

```tsx
// Good: Use useMemo for expensive calculations
const expensiveCalculation = useMemo(() => {
  return computeComplexAnimation(frame);
}, [frame]);

// Avoid: Re-calculating every render
const result = computeComplexAnimation(frame); // Bad!
```

---

## Troubleshooting

### Common Issues

1. **Preview not updating**: Check if Remotion preview server is running
2. **Render fails**: Verify FFmpeg installation
3. **Components not rendering**: Check imports and export statements
4. **Performance issues**: Reduce complexity or resolution
5. **TypeScript errors**: Ensure proper typing for props

### Debug Techniques

```tsx
// Add frame counter for debugging
const frame = useCurrentFrame();
console.log(`Frame: ${frame}, FPS: 30, Total: ${durationInFrames}`);

// Log component props
console.log('Props received:', { title, subtitle, userCount });

// Check animation values
const scale = spring({ frame, fps: 30 });
console.log('Scale value:', scale);
```

### Performance Monitoring

```tsx
// Monitor render time
useEffect(() => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    console.log(`Render time: ${endTime - startTime}ms`);
  };
});
```

---

## Next Steps

After mastering the basics:

1. **Explore Component Library**: Study [component API documentation](./remotion-components-api.md)
2. **Create Custom Effects**: Build your own animation components
3. **Integrate with Backend**: Use API endpoints for server-side rendering
4. **Add User Interface**: Create web controls for video customization
5. **Deploy**: Set up production rendering workflow

---

## Resources

- **Official Docs**: [remotion.dev/docs](https://remotion.dev/docs)
- **Component API**: [Components Documentation](./remotion-components-api.md)
- **Examples**: Check `frontend/src/remotion/` for implementation examples
- **Community**: [Discord](https://remotion.dev/discord) for help

Happy video creating! 🎬