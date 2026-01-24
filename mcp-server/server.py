#!/usr/bin/env python3
import os
import sys
import json
import logging
import asyncio
from typing import Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Fix for Windows: Use ProactorEventLoop which supports subprocesses
# This must be set before any async code runs
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Configure logging before importing tools
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from tools.transcription import TranscriptionTool
from tools.stitching import StitchingTool
from tools.cutting import CuttingTool
from tools.rendering import RenderingTool

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
_shared_data_env = os.getenv('SHARED_DATA_DIR')
if _shared_data_env:
    SHARED_DATA_DIR = os.path.abspath(_shared_data_env)
else:
    SHARED_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'shared-data'))
PROCESSED_DIR = os.path.join(SHARED_DATA_DIR, 'processed')
TRANSCRIPTS_DIR = os.path.join(SHARED_DATA_DIR, 'transcripts')

os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(TRANSCRIPTS_DIR, exist_ok=True)

transcription_tool = TranscriptionTool(OPENAI_API_KEY, TRANSCRIPTS_DIR)
stitching_tool = StitchingTool(PROCESSED_DIR)
cutting_tool = CuttingTool(PROCESSED_DIR)
rendering_tool = RenderingTool(PROCESSED_DIR)

app = FastAPI(title="Video Editor MCP Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class TranscriptRequest(BaseModel):
    video_path: str

class StitchRequest(BaseModel):
    clip_paths: List[str]
    transition_type: str = "crossfade"
    transition_duration: float = 0.5

class CutSegmentRequest(BaseModel):
    video_path: str
    start_time: float
    end_time: float
    smart_render: bool = True

class RemoveSegmentRequest(BaseModel):
    video_path: str
    start_time: float
    end_time: float

class RenderTimelineRequest(BaseModel):
    edit_instructions: List[dict]
    source_video: str

class EditInstructionsRequest(BaseModel):
    transcript: List[dict]
    edits_to_make: List[dict]

@app.get("/")
async def root():
    return {"message": "Video Editor MCP Server", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/tool/generate_transcript")
async def generate_transcript(request: TranscriptRequest):
    """Generate a transcript from video using OpenAI Whisper API."""
    try:
        transcript = await transcription_tool.generate_transcript(request.video_path)
        return {"status": "success", "data": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tool/stitch_clips")
async def stitch_clips(request: StitchRequest):
    """Stitch multiple video clips together with transitions."""
    print("starting stitch_clips")
    try:
        result = await stitching_tool.stitch_clips(
            request.clip_paths,
            request.transition_type,
            request.transition_duration
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tool/cut_segment")
async def cut_segment(request: CutSegmentRequest):
    """Cut a segment from video."""
    try:
        result = await cutting_tool.cut_segment(
            request.video_path,
            request.start_time,
            request.end_time,
            request.smart_render
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tool/remove_segment")
async def remove_segment(request: RemoveSegmentRequest):
    """Remove a segment from video."""
    try:
        result = await cutting_tool.remove_segment(
            request.video_path,
            request.start_time,
            request.end_time
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tool/render_timeline")
async def render_timeline(request: RenderTimelineRequest):
    """Render final video from timeline edit instructions."""
    try:
        result = await rendering_tool.render_timeline(
            request.edit_instructions,
            request.source_video
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tool/generate_edit_instructions")
async def generate_edit_instructions(request: EditInstructionsRequest):
    """Convert word-level edits to timeline instructions for FFmpeg."""
    try:
        instructions = await rendering_tool.generate_edit_instructions(
            request.transcript,
            request.edits_to_make
        )
        return {"status": "success", "data": instructions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)