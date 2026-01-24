# Video Editor with Remotion & Next.js

A comprehensive video editing platform built with Remotion, Next.js, and TypeScript. This application provides both server-side video rendering capabilities and client-side video editing interfaces.

## Features

### 🎬 Video Editing
- **Remotion Studio**: Visual editor for creating videos programmatically
- **Multi-format Support**: Landscape (1920x1080) and Vertical (1080x1920) videos
- **Advanced Animations**: Text animations, background gradients, transitions, and audio visualization
- **Real-time Preview**: Live preview of video compositions during editing

### 🎥 Video Player
- **Multiple Format Support**: Play both landscape and vertical videos
- **Player Controls**: Full playback controls with keyboard shortcuts
- **Metadata Display**: Video information including resolution, duration, and frame rate
- **Export Options**: Export to MP4, GIF, and thumbnail generation

### 🔧 Server-side Rendering
- **REST API**: Render videos server-side via HTTP endpoints
- **Background Processing**: Asynchronous video rendering
- **Thumbnail Generation**: Extract frames as images
- **Composition Discovery**: List available video compositions

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Toronto_AI_Hack/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

### Development
- `npm run dev` - Start Next.js development server
- `npm run remotion:preview` - Start Remotion preview server
- `npm run remotion:studio` - Open Remotion Studio
- `npm run typecheck` - Run TypeScript type checking

### Rendering
- `npm run remotion:render` - Render landscape video to MP4
- `npm run remotion:render-short` - Render vertical video to MP4
- `npm run remotion:thumbnail` - Generate thumbnail image

### Production
- `npm run build` - Build Next.js application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/                 # API routes for server-side rendering
│   │   │   ├── render/          # Video rendering endpoint
│   │   │   ├── compositions/    # List compositions endpoint
│   │   │   └── thumbnail/       # Thumbnail generation endpoint
│   │   ├── video-editor/        # Remotion Studio page
│   │   ├── video-player/        # Video player page
│   │   └── page.tsx            # Home page
│   └── remotion/
│       ├── components/         # Reusable video components
│       │   ├── TextAnimation.tsx
│       │   ├── BackgroundGradient.tsx
│       │   ├── AudioVisualizer.tsx
│       │   └── Transition.tsx
│       ├── Root.tsx            # Remotion root component
│       ├── VideoComposition.tsx # Main video composition
│       └── index.ts            # Entry point
├── package.json
├── next.config.js
└── .eslintrc.json
```

## API Endpoints

### POST /api/render
Render a video to MP4 format.

**Request:**
```json
{
  "compositionId": "VideoEditor",
  "outputPath": "out/video.mp4",
  "inputProps": {}
}
```

**Response:**
```json
{
  "success": true,
  "outputPath": "out/video.mp4",
  "result": {...},
  "message": "Video rendered successfully"
}
```

### GET /api/compositions
List all available video compositions.

**Response:**
```json
{
  "success": true,
  "compositions": [
    {
      "id": "VideoEditor",
      "width": 1920,
      "height": 1080,
      "fps": 30,
      "durationInFrames": 300,
      "durationInSeconds": 10
    }
  ]
}
```

### POST /api/thumbnail
Generate a thumbnail from a specific frame.

**Request:**
```json
{
  "compositionId": "VideoEditor",
  "frame": 0,
  "outputPath": "out/thumbnail.png"
}
```

## Video Components

### TextAnimation
Animated text with multiple effect types:
- `fadeIn` - Fade in animation
- `slideUp` - Slide up from bottom
- `scaleIn` - Scale from center
- `rotateIn` - Rotate and scale in

### BackgroundGradient
Animated background gradients with customizable colors and directions.

### AudioVisualizer
Audio visualization with animated bars and fake data generation.

### Transition
Scene transitions with multiple types:
- `fadeIn` - Simple fade
- `slideIn` - Slide from direction
- `zoomIn` - Zoom from center
- `rotateIn` - Rotate and zoom

## Usage Examples

### Creating a Custom Video Composition

```tsx
import React from 'react';
import { TextAnimation, BackgroundGradient } from '../components';

export const CustomComposition: React.FC = () => {
  return (
    <div style={{ flex: 1 }}>
      <BackgroundGradient colors={['#1e293b', '#312e81']} />
      <TextAnimation animationType="fadeIn" duration={30}>
        <h1 style={{ color: 'white' }}>My Custom Video</h1>
      </TextAnimation>
    </div>
  );
};
```

### Using the API to Render Videos

```javascript
// Render a video
const response = await fetch('/api/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    compositionId: 'VideoEditor',
    outputPath: 'custom-video.mp4'
  })
});

const result = await response.json();
console.log(result.outputPath); // Path to rendered video
```

## Development

### Adding New Compositions

1. Create a new component in `src/remotion/components/`
2. Add it to `src/remotion/Root.tsx`:
```tsx
<Composition
  id="MyComposition"
  component={MyComponent}
  durationInFrames={300}
  fps={30}
  width={1920}
  height={1080}
/>
```

3. Access it via the API or Remotion Studio.

### Customizing Video Components

All components accept customizable props:
- Animation durations
- Colors and gradients
- Sizes and positions
- Delays and timing

## Troubleshooting

### Common Issues

1. **Server-side rendering errors**: Ensure `@remotion/renderer` is in `serverExternalPackages` in `next.config.js`
2. **Memory issues during rendering**: Increase Node.js memory limit with `--max-old-space-size=4096`
3. **TypeScript errors**: Run `npm run typecheck` to identify issues

### Performance Tips

- Use appropriate video resolutions for your use case
- Consider shorter durations for preview videos
- Optimize images and assets used in videos
- Use server-side rendering for production deployments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with `npm run typecheck` and `npm run lint`
5. Submit a pull request with detailed commit messages

## License

This project is licensed under the MIT License.