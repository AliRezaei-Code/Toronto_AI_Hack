# Script-Based Video Editor

An AI-powered single-page video editor for the HackAI x Stanford hackathon. Upload short video clips, generate transcripts, and edit videos by editing text or using natural language commands.

## Features

- **Video Stitching**: Automatically stitch 3-5 clips with crossfade transitions
- **AI Transcription**: Generate word-level transcripts with precise timestamps using OpenAI Whisper
- **Script-Based Editing**: Click any word to navigate to that moment in the video
- **Natural Language Edits**: Use the "Magic Box" to make edits like "Make it snappier" or "Remove the silence"
- **AI Agent**: LangGraph-powered agent that interprets queries and performs intelligent video edits

## Tech Stack

- **Frontend**: Next.js (App Router), TailwindCSS, Lucide Icons
- **Backend**: FastAPI, LangGraph, LangChain
- **MCP Server**: Custom MCP server wrapping FFmpeg and Whisper API
- **Video Processing**: FFmpeg (smart rendering and ultrafast presets)
- **AI**: OpenAI GPT-4o (agent decisions), Whisper (transcription)

## Project Structure

```
/project-root
├── apps/web/              # Next.js App (source of truth)
├── frontend/              # Legacy Next.js app (to be archived)
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   └── lib/              # API client
├── backend/              # FastAPI Orchestrator
│   └── app/              # Agent, models, state manager
├── mcp-server/           # Custom MCP Server
│   ├── tools/            # FFmpeg & Whisper tools
│   └── server.py         # MCP server implementation
├── docker/               # Dockerfile configurations
├── shared-data/          # Docker volume for video files
├── docker-compose.yml    # Service orchestration
└── .env.example          # Environment variables template
```

## Prerequisites

- Docker and Docker Compose
- OpenAI API key

## Quick Start

1. **Clone the repository**
   ```bash
   cd /path/to/Toronto_AI_Hack
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Build and run the stack**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/docs (Swagger UI)
   - MCP Server: http://localhost:9000
   - **Android App**: [Download APK](https://github.com/Chiheb-Bejaoui/https-f8f0628e1371.ngrok-free.app-)

## Usage

### 1. Upload Videos
- Drag and drop 3-5 video clips onto the upload zone
- Supported formats: MP4, MOV, WebM, AVI

### 2. View Transcript
- Transcript appears automatically after upload
- Click any word to seek to that timestamp in the video
- Current word is highlighted during playback

### 3. Make Edits
- **Via Magic Box**: Type natural language commands like:
  - "Make it snappier"
  - "Remove the silence"
  - "Delete the second sentence"
  - "Cut out the umms and aahs"
- **Via Transcript**: (Future feature - edit text directly)

### 4. Export
- Click the Export button to download the edited video

## Available MCP Tools

The MCP server exposes the following tools:

1. **`generate_transcript(video_path)`**
   - Generates word-level transcripts with timestamps using Whisper API

2. **`stitch_clips(clip_paths, transition_type, transition_duration)`**
   - Concatenates videos with crossfade or cut transitions

3. **`cut_segment(video_path, start_time, end_time, smart_render)`**
   - Extracts a segment, using smart rendering (stream copy) when possible

4. **`remove_segment(video_path, start_time, end_time)`**
   - Removes a portion and concatenates remaining parts

5. **`render_timeline(edit_instructions, source_video)`**
   - Renders final video from keep/cut timeline instructions

6. **`generate_edit_instructions(transcript, edits_to_make)`**
   - Converts word indices to timeline format for FFmpeg

## Agent Workflow

The LangGraph agent processes edit requests through these steps:

1. **Analyze Query**: Parse user intent (delete, trim, cut_silence, etc.)
2. **Fetch Transcript**: Load current transcript with timestamps
3. **Determine Edits**: Use GPT-4o to calculate word indices and time ranges
4. **Execute Edits**: Call MCP tools to perform video operations
5. **Update State**: Save new transcript and regenerate if needed

## Development

### Running Services Individually

**Frontend (Development Mode)**
```bash
cd apps/web
pnpm install
pnpm dev
```

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**MCP Server**
```bash
cd mcp-server
pip install -r requirements.txt
python -m mcp.cli.server server.py
```

### Building Docker Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build frontend
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Stopping Services

```bash
docker-compose down

# Including volumes (deletes all data)
docker-compose down -v
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for Whisper and GPT-4o | Required |
| `NEXT_PUBLIC_API_URL` | Backend API URL (frontend only) | `http://localhost:8000` |
| `SHARED_DATA_DIR` | Shared directory for video files | `./shared-data` |
| `MCP_SERVER_URL` | MCP server endpoint | `http://localhost:9000` |

## API Endpoints

### Backend Endpoints

- `POST /api/upload` - Upload video clips for processing
- `GET /api/job/{job_id}/status` - Get job processing status
- `GET /api/video/{job_id}` - Stream processed video
- `GET /api/transcript/{job_id}` - Get job transcript
- `POST /api/agent/query` - Submit natural language edit query
- `DELETE /api/job/{job_id}` - Delete job and associated files

### MCP Server Tools

All MCP tools are accessible via the MCP protocol at `/tools` endpoint.

## Troubleshooting

### Videos not processing
- Check that `OPENAI_API_KEY` is set correctly in `.env`
- Verify Docker has sufficient disk space
- Check logs: `docker-compose logs mcp-server`

### Transcript not appearing
- Ensure video has audio track
- Verify OpenAI API is accessible
- Check FFmpeg installation in container

### Agent not responding
- Check Backend API is running: http://localhost:8000/health
- Verify MCP Server is accessible
- Check GPT-4o API quota

## Hackathon Demo Tips

1. **Start with short clips**: 5-10 seconds each for faster processing
2. **Clear audio**: Audio quality affects transcription accuracy
3. **Simple edits first**: Start with "Remove silence" before complex edits
4. **Prepare API key**: Ensure OpenAI API has sufficient quota
5. **Use Chrome**: Best browser for video playback performance

## License

MIT License - HackAI x stan 2026

## Remotion: Programmatic Video Creation

### What is Remotion?

**Remotion** is an open-source React framework that allows developers to create videos programmatically using familiar React components and concepts. Instead of traditional timeline-based video editing, Remotion treats videos as functions of images over time, where each frame is rendered as a React component.

#### Core Philosophy
- **Code-Driven Creation**: Write React components to define video content
- **Component-Based Architecture**: Reusable elements like text, images, and effects
- **Frame-Based Rendering**: Videos are composed of individual frames (30 fps = 30 frames per second)
- **Dynamic Content**: Videos can respond to data, API calls, and user input

### How Remotion Works

#### Fundamental Concepts
1. **Compositions**: A combination of React component + video metadata
   ```tsx
   <Composition
     id="MyVideo"
     durationInFrames={300}  // 10 seconds at 30fps
     fps={30}
     width={1920}
     height={1080}
     component={MyComponent}
   />
   ```

2. **Frame Control**: Access current frame number for animations
   ```tsx
   const frame = useCurrentFrame();
   const opacity = Math.sin(frame * 0.05) * 0.5 + 0.5;
   ```

3. **Video Configuration**: Get video properties
   ```tsx
   const { fps, width, height, durationInFrames } = useVideoConfig();
   ```

#### Rendering Process
```
React Component → Frame Rendering → Canvas → Video Encoding → MP4 Output
```

### Remotion in This Project

Our Remotion implementation is available on the `feature/add-remotion-video-editor` branch and includes:

#### 🎬 Implemented Features
- **Multi-Format Support**: Landscape (1920×1080) and Vertical (1080×1920) videos
- **Advanced Animations**: Text effects, background gradients, transitions, audio visualizers
- **Real-Time Preview**: Browser-based development with instant feedback
- **Server-Side Rendering**: API endpoints for background video processing
- **Component Library**: Reusable video components with TypeScript support

#### 📁 Project Structure
```
frontend/src/remotion/
├── components/
│   ├── TextAnimation.tsx      # Text effects (fadeIn, slideUp, scaleIn, rotateIn)
│   ├── BackgroundGradient.tsx  # Animated gradient backgrounds
│   ├── AudioVisualizer.tsx    # Audio visualization bars
│   └── Transition.tsx        # Scene transitions
├── Root.tsx                 # Composition definitions
├── VideoComposition.tsx       # Main video logic (3 scenes)
└── index.ts                 # Entry point with registerRoot()
```

#### 🎨 Video Composition Structure
Our main video includes 3 distinct scenes:
- **Scene 1** (0-90 frames): Title screen with "Video Editor" branding
- **Scene 2** (90-180 frames): Features showcase with audio visualizer
- **Scene 3** (180-300 frames): Call-to-action with frame counter

#### 🔧 Development Commands
```bash
# Preview video in browser
npm run remotion:preview

# Open visual editor
npm run remotion:studio

# Render landscape video
npm run remotion:render

# Render vertical short
npm run remotion:render-short

# Generate thumbnail
npm run remotion:thumbnail
```

#### 🌐 API Integration
- **`/api/render`**: Server-side video rendering to MP4
- **`/api/compositions`**: List available video compositions
- **`/api/thumbnail`**: Extract still frames from videos

### When to Use Remotion vs Traditional Editing

| Scenario | Traditional Editing | Remotion |
|-----------|-------------------|------------|
| **Quick cuts/trim** | ✅ Fast and intuitive | ❌ Overkill |
| **Personalized videos** | ❌ Impractical | ✅ Perfect |
| **Data-driven content** | ❌ Manual work | ✅ Automated |
| **Batch generation** | ❌ Time consuming | ✅ Scalable |
| **Complex animations** | ❌ Limited | ✅ Programmable |
| **Social media variants** | ❌ Repetitive | ✅ Automated |

### Use Cases in This Project

#### Enhanced Video Creation
- **Dynamic Intros**: Auto-generated video openings with user data
- **Progress Visualizations**: Charts and graphs animated in video format
- **Social Media Adaptation**: Auto-render vertical/horizontal versions
- **Template Generation**: Create video templates from code

#### Advanced Features
- **Audio Synchronization**: Visual elements that respond to audio
- **Real-time Data**: Live data feeds in video format
- **Interactive Overlays**: Clickable elements in rendered videos
- **Custom Effects**: Programmatic visual effects and filters

### Getting Started with Remotion

#### Installation
```bash
# In frontend directory
npm install remotion @remotion/cli @remotion/player @remotion/renderer

# Create new Remotion project
npx create-video@latest

# Add to existing Next.js project
npm install remotion @remotion/cli @remotion/player
```

#### Basic Example
```tsx
// src/remotion/MyComposition.tsx
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

export const MyComposition = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps: 30,
    config: { damping: 20 },
  });

  return (
    <div style={{
      flex: 1,
      backgroundColor: '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
      display: 'flex',
    }}>
      <div
        style={{
          transform: `scale(${scale})`,
          fontSize: width / 10,
          color: 'white',
        }}
      >
        Frame: {frame}
      </div>
    </div>
  );
};
```

#### Register Composition
```tsx
// src/remotion/Root.tsx
import { Composition } from 'remotion';
import { MyComposition } from './MyComposition';

export const RemotionRoot = () => {
  return (
    <Composition
      id="MyVideo"
      component={MyComposition}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

### Advanced Techniques

#### Spring Animations
```tsx
const opacity = spring({
  frame,
  fps: 30,
  config: { damping: 20, mass: 1, stiffness: 100 },
});

const scale = spring({
  frame,
  fps: 30,
  config: { mass: 0.5 },
});
```

#### Interpolation
```tsx
const rotate = interpolate(
  frame,
  [0, 30],
  [0, Math.PI * 2],
  {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }
);
```

#### Audio Visualization
```tsx
const audioData = useAudioData(); // Built-in hook
const barHeight = interpolate(audioData[i], [0, 1], [0, 100]);
```

### Performance Tips

#### Rendering Optimization
- **Frame Caching**: Cache expensive calculations
- **Asset Optimization**: Pre-load images and videos
- **Minimal Rerenders**: Use useMemo for complex calculations
- **Selective Updates**: Only update what changes between frames

#### Server-Side Rendering
- **Background Processing**: Use API endpoints for long renders
- **Queue System**: Handle multiple render requests
- **Progress Tracking**: Provide real-time render status
- **Output Optimization**: Balance quality vs file size

### Troubleshooting

#### Common Issues
1. **Installation**: Ensure Node.js 16+ and FFmpeg installed
2. **Rendering**: Check if FFmpeg is in system PATH
3. **Performance**: Reduce resolution or complexity for preview
4. **Memory**: Increase Node.js heap for large videos

#### Debug Tools
- **Frame Inspector**: Use `console.log(frame)` for debugging
- **Component Tree**: React DevTools for component structure
- **Performance**: Chrome DevTools for rendering analysis

### Resources

- **Official Documentation**: [remotion.dev/docs](https://remotion.dev/docs)
- **Community**: [Discord Server](https://remotion.dev/discord)
- **Templates**: [remotion.dev/templates](https://remotion.dev/templates)
- **Showcase**: [remotion.dev/showcase](https://remotion.dev/showcase)

---

## Acknowledgments

- OpenAI Whisper & GPT-4o for AI capabilities
- FFmpeg for video processing
- LangGraph for agent orchestration
- Next.js & TailwindCSS for frontend
- **Remotion** for programmatic video creation capabilities
