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
├── frontend/              # Next.js App
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
cd frontend
npm install
npm run dev
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

MIT License - HackAI x Stanford 2026

## Acknowledgments

- OpenAI Whisper & GPT-4o for AI capabilities
- FFmpeg for video processing
- LangGraph for agent orchestration
- Next.js & TailwindCSS for the frontend