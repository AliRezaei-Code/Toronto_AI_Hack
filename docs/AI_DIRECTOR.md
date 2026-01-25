# AI Director - Autonomous Video Repurposing System

> Transform long-form interviews and podcasts into viral short-form content automatically.

The AI Director is a complete pipeline for autonomous video repurposing, similar to OpusClip or Munch. It takes long-form content (interviews, podcasts, webinars) and automatically generates platform-optimized viral clips for TikTok, Instagram Reels, and YouTube Shorts.

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Components](#components)
- [Configuration](#configuration)
- [Development Guide](#development-guide)
- [Deployment](#deployment)

---

## Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Smart Transcription** | Deepgram Nova-2 with speaker diarization identifies who's speaking when |
| **Viral Moment Detection** | GPT-4o analyzes content to find the most engaging 30-90 second clips |
| **Face Tracking** | MediaPipe-based face detection with Kalman smoothing for smooth crops |
| **Smart Cropping** | Dynamic 9:16 cropping that follows speakers' faces |
| **Animated Subtitles** | Karaoke-style word highlighting (Hormozi, MrBeast, Minimal styles) |
| **Multi-Speaker Layouts** | Split screen, reaction shots, and picture-in-picture compositions |
| **Jump-Cut Processing** | Automatic removal of filler words (um, uh, like) and silence |
| **LiveKit Integration** | Record multi-participant interviews directly with track separation |

### Platform Support

- **TikTok** (1080x1920, up to 60s)
- **Instagram Reels** (1080x1920, up to 90s)  
- **YouTube Shorts** (1080x1920, up to 60s)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │ AI Director  │  │   Remotion   │  │     Video Preview          │ │
│  │  Dashboard   │  │   Player     │  │     & Controls             │ │
│  └──────────────┘  └──────────────┘  └────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────────────┐
│                        Backend (FastAPI)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Director    │  │   Services   │  │      LangGraph             │ │
│  │   Routes     │  │              │  │      Agents                │ │
│  │              │  │ • Deepgram   │  │                            │ │
│  │ /api/        │  │ • ViralClip  │  │                            │ │
│  │  director/*  │  │ • JumpCut    │  │                            │ │
│  │              │  │ • Remotion   │  │                            │ │
│  │              │  │ • LiveKit    │  │                            │ │
│  └──────────────┘  └──────────────┘  └────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐
│Video Processor│  │   MCP Server    │  │    External     │
│   Sidecar     │  │                 │  │    Services     │
│               │  │ • FFmpeg        │  │                 │
│ • MediaPipe   │  │ • Whisper       │  │ • Deepgram API  │
│ • Face Track  │  │ • Video Tools   │  │ • OpenAI API    │
│ • Kalman      │  │                 │  │ • LiveKit       │
└───────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- FFmpeg (for local development)

### Environment Setup

1. Clone the repository and checkout the feature branch:

```bash
git checkout feature/ai-director-pipeline
```

2. Copy the environment file and add your API keys:

```bash
cp .env.example .env
```

Required keys:
```env
# Required
OPENAI_API_KEY=sk-...           # For viral clip selection (GPT-4o)
DEEPGRAM_API_KEY=...            # For transcription + diarization

# Optional (for LiveKit recording)
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_HOST=wss://your-livekit-server.com
```

3. Start all services:

```bash
docker-compose up -d
```

4. Access the AI Director:

- **Dashboard**: http://localhost:3000/ai-director
- **API Docs**: http://localhost:8000/docs

### Basic Usage

1. **Upload a video** on the AI Director dashboard
2. **Wait for processing** - the system will:
   - Transcribe with speaker diarization
   - Identify viral moments
   - Track faces
   - Generate edit decision lists
3. **Review viral clips** with virality scores and suggested titles
4. **Render shorts** for your target platform

---

## API Reference

### Director Endpoints

Base URL: `/api/director`

#### Upload Video

```http
POST /api/director/upload
Content-Type: multipart/form-data

video: <file>
caption_style: hormozi | mrbeast | minimal | classic
target_platform: tiktok | instagram | youtube
max_clips: 1-10 (default: 5)
min_clip_duration: 30.0
max_clip_duration: 90.0
remove_fillers: true
enable_face_tracking: true
```

**Response:**
```json
{
  "job_id": "abc123",
  "status": "queued",
  "message": "Video uploaded successfully"
}
```

#### Get Job Status

```http
GET /api/director/status/{job_id}
```

**Response:**
```json
{
  "job_id": "abc123",
  "status": "selecting_clips",
  "progress_percent": 45.5,
  "current_step": "Analyzing content for viral moments",
  "viral_clips_found": 0,
  "shorts_rendered": 0
}
```

#### Get Viral Clips

```http
GET /api/director/clips/{job_id}
```

**Response:**
```json
{
  "clips": [
    {
      "id": "clip_001",
      "start_time": 125.5,
      "end_time": 180.2,
      "duration": 54.7,
      "virality_score": 87.5,
      "hook_type": "question",
      "hook_strength": 92.0,
      "suggested_titles": [
        "Why Most People Get This Wrong",
        "The Truth Nobody Tells You",
        "This Changed Everything"
      ],
      "emphasis_words": ["wrong", "truth", "everything"],
      "summary": "Speaker reveals a counterintuitive insight...",
      "transcript_text": "..."
    }
  ]
}
```

#### Render Short

```http
POST /api/director/render-short
Content-Type: application/json

{
  "job_id": "abc123",
  "clip_id": "clip_001",
  "caption_style": "hormozi",
  "platform": "tiktok",
  "include_captions": true,
  "output_format": "mp4"
}
```

#### Get Diarization

```http
GET /api/director/diarization/{job_id}
```

#### Get Edit Decision List

```http
GET /api/director/edl/{job_id}
```

### Video Processor Endpoints

Base URL: `http://localhost:8001`

#### Face Tracking (Upload)

```http
POST /face-tracking/upload
Content-Type: multipart/form-data

video: <file>
job_id: abc123
enable_smoothing: true
max_faces: 2
detection_confidence: 0.5
```

#### Face Tracking Status

```http
GET /face-tracking/{task_id}/status
```

#### Face Tracking Result

```http
GET /face-tracking/{task_id}/result
```

---

## Components

### Backend Services

#### DeepgramService (`backend/app/services/deepgram_service.py`)

Transcription with speaker diarization using Deepgram Nova-2.

```python
from app.services import transcribe_with_diarization

result = await transcribe_with_diarization(
    audio_path="path/to/audio.mp3",
    language="en"
)
# Returns: DiarizationResult with words, segments, speakers
```

#### ViralClipSelector (`backend/app/services/viral_clip_selector.py`)

GPT-4o powered viral moment detection.

```python
from app.services import select_viral_clips

clips = await select_viral_clips(
    diarization=result,
    max_clips=5,
    min_duration=30.0,
    max_duration=90.0
)
# Returns: List[ViralClip] with scores, hooks, titles
```

#### JumpCutProcessor (`backend/app/services/jump_cut_processor.py`)

Automatic filler and silence removal.

```python
from app.services import create_jump_cut_edl

edl = create_jump_cut_edl(
    diarization=result,
    min_pause_duration=0.5,
    remove_fillers=True
)
# Returns: EditDecisionList with keep_ranges
```

#### RemotionComposer (`backend/app/services/remotion_composer.py`)

Generates Remotion input props and triggers rendering.

```python
from app.services import get_composer

composer = get_composer()
result = await composer.render_short(
    job=job,
    clip=clip,
    diarization=diarization,
    face_tracking=face_tracking,
    caption_style=CaptionStyle.HORMOZI,
    platform=Platform.TIKTOK
)
```

#### LiveKitService (`backend/app/services/livekit_service.py`)

LiveKit room management and recording.

```python
from app.services import get_livekit_service

livekit = get_livekit_service()

# Create room
room = await livekit.create_room("my-podcast")

# Generate token for participant
token = await livekit.create_access_token(
    room_name="my-podcast",
    participant_name="Host"
)

# Start recording
await livekit.start_recording("my-podcast", job_id="abc123")

# Stop recording
result = await livekit.stop_recording("my-podcast")
```

### Remotion Components

#### SmartCrop (`frontend/src/remotion/components/ai-director/SmartCrop.tsx`)

Dynamic face-following crop for 9:16 vertical videos.

```tsx
<SmartCrop
  src="/video.mp4"
  faceCoordinates={faceData}
  activeSpeaker={0}
  sourceWidth={1920}
  sourceHeight={1080}
  targetWidth={1080}
  targetHeight={1920}
  zoomFactor={1.2}
  enableSmoothing={true}
/>
```

#### AnimatedSubtitles (`frontend/src/remotion/components/ai-director/AnimatedSubtitles.tsx`)

Karaoke-style word highlighting.

```tsx
<AnimatedSubtitles
  words={diarizedWords}
  emphasisWords={["viral", "amazing"]}
  style="hormozi"
  platform="tiktok"
  maxWordsPerLine={4}
/>
```

**Available Styles:**

| Style | Description |
|-------|-------------|
| `hormozi` | Bold Impact font, yellow highlight, black outline |
| `mrbeast` | Arial Black, green highlight, background box |
| `minimal` | Inter font, subtle fade, dark background |
| `classic` | Georgia serif, gold highlight, drop shadow |

#### DynamicLayout (`frontend/src/remotion/components/ai-director/DynamicLayout.tsx`)

Multi-speaker layout compositions.

```tsx
<DynamicLayout
  speakers={speakerSources}
  layoutTimeline={layoutTimeline}
  defaultLayout="single_speaker"
/>
```

**Layout Types:**

| Layout | Description |
|--------|-------------|
| `single_speaker` | Full frame on active speaker with smart crop |
| `split_screen` | Vertical 50/50 split for two speakers |
| `reaction_shot` | Main speaker large, reactor in corner |
| `pip` | Picture-in-picture with circular overlay |

#### AIDirectedShort (`frontend/src/remotion/components/ai-director/AIDirectedShort.tsx`)

Main composition combining all features.

```tsx
<AIDirectedShort
  jobId="abc123"
  clipId="clip_001"
  videoSources={["/video.mp4"]}
  words={diarizedWords}
  faceTrackingData={faceData}
  layoutTimeline={layouts}
  viralClip={clipData}
  captionStyle="hormozi"
  platform="tiktok"
  includeCaptions={true}
/>
```

### Video Processor

#### FaceTracker (`video-processor/face_tracker.py`)

MediaPipe face detection with Kalman smoothing.

```python
from face_tracker import FaceTracker

tracker = FaceTracker(
    min_detection_confidence=0.5,
    max_faces=2,
    enable_smoothing=True
)

result = tracker.process_video(
    "input.mp4",
    output_path="face_data.json"
)
```

---

## Configuration

### Environment Variables

```env
# === Required ===
OPENAI_API_KEY=sk-...                    # GPT-4o for viral selection
DEEPGRAM_API_KEY=...                     # Transcription + diarization

# === Video Processor ===
VIDEO_PROCESSOR_URL=http://video-processor:8001
TEMP_DIR=/tmp/video-processor

# === Remotion ===
REMOTION_PROJECT_PATH=../frontend
RENDERED_SHORTS_DIR=/shared-data/rendered_shorts
USE_REMOTION_LAMBDA=false                # Set true for production
REMOTION_LAMBDA_FUNCTION=...             # Lambda function name

# === LiveKit (Optional) ===
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_HOST=wss://your-server.livekit.cloud

# === AWS (For Lambda/S3) ===
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name
```

### Caption Styles

Configure in `frontend/src/remotion/components/ai-director/AnimatedSubtitles.tsx`:

```typescript
const STYLE_PRESETS = {
  hormozi: {
    fontFamily: 'Impact, sans-serif',
    baseFontSize: 72,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFD700',
    emphasisColor: '#FF4444',
    textTransform: 'uppercase',
    // ...
  },
  // Add custom styles here
};
```

### Platform Safe Areas

```typescript
const PLATFORM_SAFE_AREAS = {
  tiktok: { top: 0.15, bottom: 0.25, left: 0.05, right: 0.05 },
  instagram: { top: 0.12, bottom: 0.20, left: 0.05, right: 0.05 },
  youtube: { top: 0.10, bottom: 0.15, left: 0.05, right: 0.05 },
};
```

---

## Development Guide

### Project Structure

```
├── backend/
│   └── app/
│       ├── api/
│       │   └── director_routes.py      # REST API endpoints
│       ├── models/
│       │   └── director_models.py      # Pydantic data models
│       └── services/
│           ├── deepgram_service.py     # Transcription
│           ├── viral_clip_selector.py  # GPT-4o clip selection
│           ├── jump_cut_processor.py   # EDL generation
│           ├── remotion_composer.py    # Remotion integration
│           └── livekit_service.py      # LiveKit recording
│
├── frontend/
│   └── src/
│       ├── app/
│       │   └── ai-director/
│       │       └── page.tsx            # Dashboard UI
│       └── remotion/
│           └── components/
│               └── ai-director/
│                   ├── SmartCrop.tsx
│                   ├── AnimatedSubtitles.tsx
│                   ├── DynamicLayout.tsx
│                   └── AIDirectedShort.tsx
│
└── video-processor/
    ├── face_tracker.py                 # MediaPipe face tracking
    ├── api.py                          # FastAPI service
    ├── Dockerfile
    └── requirements.txt
```

### Running Locally

1. **Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

2. **Frontend:**
```bash
cd frontend
npm install
npm run dev
```

3. **Video Processor:**
```bash
cd video-processor
pip install -r requirements.txt
uvicorn api:app --port 8001
```

4. **Remotion Studio:**
```bash
cd frontend
npx remotion studio
```

### Adding a New Caption Style

1. Add preset to `AnimatedSubtitles.tsx`:
```typescript
const STYLE_PRESETS = {
  // ...existing styles
  custom: {
    fontFamily: 'Your Font',
    baseFontSize: 60,
    primaryColor: '#FFFFFF',
    highlightColor: '#00FF00',
    // ...
  },
};
```

2. Add to backend enum in `director_models.py`:
```python
class CaptionStyle(str, Enum):
    # ...existing
    CUSTOM = "custom"
```

### Adding a New Layout Type

1. Add layout component in `DynamicLayout.tsx`:
```typescript
const CustomLayout: React.FC<LayoutProps> = ({ speakers, ... }) => {
  // Your layout implementation
};
```

2. Add to switch statement in `DynamicLayout`:
```typescript
case 'custom':
  return <CustomLayout {...layoutProps} />;
```

3. Add to backend enum:
```python
class LayoutType(str, Enum):
    # ...existing
    CUSTOM = "custom"
```

---

## Deployment

### Docker Compose (Development)

```bash
docker-compose up -d
```

### Production with Remotion Lambda

1. Deploy Remotion Lambda:
```bash
npx remotion lambda sites create --site-name=ai-director
npx remotion lambda functions deploy
```

2. Update environment:
```env
USE_REMOTION_LAMBDA=true
REMOTION_LAMBDA_FUNCTION=remotion-render-...
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests (coming soon).

---

## Troubleshooting

### Common Issues

**Face tracking fails:**
- Ensure video has clear face visibility
- Try lowering `detection_confidence` to 0.3
- Check video-processor logs: `docker logs video-processor`

**Transcription slow:**
- Deepgram is faster than Whisper fallback
- Ensure `DEEPGRAM_API_KEY` is set
- For long videos, processing may take several minutes

**Render fails:**
- Check Remotion is properly installed: `npx remotion --version`
- Verify video sources are accessible
- Check backend logs for detailed errors

**No viral clips found:**
- Content may not have strong hook moments
- Try lowering `min_duration` or `virality_threshold`
- Review transcript for interesting content

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test
4. Submit a pull request

---

## License

MIT License - see LICENSE file for details.
