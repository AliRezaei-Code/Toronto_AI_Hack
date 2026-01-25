# Startup & Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Client Browser                              │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Web Frontend (Next.js + Remotion)                    │
│                              Port 3000                                   │
│  • Video upload UI          • Transcript editor                         │
│  • Remotion video player    • Magic Box (NL commands)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Backend API (FastAPI + LangGraph)                   │
│                              Port 8000                                   │
│  • AI Director pipeline     • Job orchestration                         │
│  • Smart Merge              • Remotion composition                      │
└────────────────┬────────────────────────────────────────┬───────────────┘
                 │                                        │
                 ▼                                        ▼
┌────────────────────────────────┐    ┌────────────────────────────────────┐
│   MCP Server (FFmpeg/Whisper)  │    │   Video Processor (MediaPipe)      │
│          Port 9000             │    │          Port 8001                 │
│  • Transcription (Deepgram)    │    │  • Face tracking                   │
│  • Video stitching             │    │  • Kalman smoothing                │
│  • Segment cutting             │    │  • Speaker detection               │
└────────────────────────────────┘    └────────────────────────────────────┘
                 │                                        │
                 └────────────────┬───────────────────────┘
                                  ▼
                    ┌──────────────────────────┐
                    │      shared-data/        │
                    │  (videos, transcripts)   │
                    └──────────────────────────┘
```

### Services

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| **web** | 3000 | Next.js + Remotion | Frontend UI, video rendering |
| **backend** | 8000 | FastAPI + LangGraph | AI orchestration, job management |
| **mcp-server** | 9000 | FastAPI | FFmpeg/Whisper tools |
| **video-processor** | 8001 | FastAPI + MediaPipe | Face tracking, video analysis |

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** and **pnpm**
- **FFmpeg** (in system PATH)
- **API Keys**: OpenAI, Deepgram

---

## Local Development

### Quick Start

```bash
# 1. Clone and enter directory
cd Toronto_AI_Hack

# 2. Create environment file
cp .env.example .env
# Edit .env with your API keys:
#   OPENAI_API_KEY=sk-...
#   DEEPGRAM_API_KEY=...

# 3. Run all services (installs deps on first run)
python dev.py
```

### dev.py Features

- **Auto-install**: Installs dependencies on first run or with `--install` flag
- **Port cleanup**: Detects and kills ghost processes on startup
- **Hot reload**: All services restart on file changes
- **Colored logs**: Each service has distinct colored output
- **Clean shutdown**: Ctrl+C stops all services gracefully

### Manual Service Startup

If you prefer to run services individually:

```bash
# Terminal 1: Web Frontend
cd apps/web
pnpm install
pnpm run dev

# Terminal 2: Backend API
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 3: MCP Server
cd mcp-server
pip install -r requirements.txt
uvicorn server:app --reload --port 9000

# Terminal 4: Video Processor
cd video-processor
pip install -r requirements.txt
uvicorn api:app --reload --port 8001
```

---

## Docker Deployment

### Build and Run

```bash
# Build all services
docker-compose build

# Start the stack
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Rebuild Individual Services

```bash
# Rebuild specific service
docker-compose build web
docker-compose build backend
docker-compose build video-processor

# Rebuild without cache (for dependency changes)
docker-compose build --no-cache web
```

### Common Docker Issues

**BuildKit cache conflicts:**
```bash
docker builder prune -f
docker-compose build --no-cache
```

**Volume issues:**
```bash
# Remove all volumes and rebuild
docker-compose down -v
docker-compose up --build
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Required
OPENAI_API_KEY=sk-your-openai-key
DEEPGRAM_API_KEY=your-deepgram-key

# Optional (defaults shown)
NEXT_PUBLIC_API_URL=http://localhost:8000
MCP_SERVER_URL=http://localhost:9000
VIDEO_PROCESSOR_URL=http://localhost:8001
SHARED_DATA_DIR=./shared-data
```

---

## Service Endpoints

### Web Frontend
- **URL**: http://localhost:3000
- **Purpose**: Main application UI

### Backend API
- **URL**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

Key endpoints:
- `POST /api/upload` - Upload video clips
- `GET /api/job/{id}/status` - Job status
- `POST /api/agent/query` - Natural language edit
- `POST /api/director/process` - AI Director pipeline

### MCP Server
- **URL**: http://localhost:9000
- **Health Check**: http://localhost:9000/health

### Video Processor
- **URL**: http://localhost:8001
- **Health Check**: http://localhost:8001/health

Key endpoints:
- `POST /face-tracking/local` - Process local video
- `GET /face-tracking/{id}/status` - Tracking status
- `GET /face-tracking/{id}/result` - Get tracking data

---

## Troubleshooting

### Ports already in use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /F /PID <pid>

# Linux/Mac
lsof -ti :8000 | xargs kill -9
```

### Python path issues (Windows)
Edit `dev.py` line 21 to match your Python installation:
```python
PYTHON = r"C:\path\to\your\python.exe"
```

### Node modules conflicts
```bash
# Clear and reinstall
rm -rf apps/web/node_modules
cd apps/web && pnpm install
```

### FFmpeg not found
Ensure FFmpeg is installed and in your system PATH:
```bash
ffmpeg -version
```

---

## Production Deployment

For production, consider:

1. **Reverse proxy**: Use nginx/Caddy in front of services
2. **SSL certificates**: Let's Encrypt for HTTPS
3. **Process manager**: PM2 or systemd for service management
4. **Database**: Replace in-memory job storage with Redis/PostgreSQL
5. **Object storage**: S3/GCS for video files instead of local shared-data
6. **GPU instance**: For video-processor face tracking performance

Example nginx config:
```nginx
upstream backend {
    server localhost:8000;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://backend;
    }
}
```
