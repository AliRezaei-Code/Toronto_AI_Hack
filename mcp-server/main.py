#!/usr/bin/env python3
"""
FastAPI wrapper for MCP server tools.
Exposes MCP tools as HTTP endpoints.
"""
import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

from http_api import (
    TOOL_HANDLERS,
    get_available_tools,
)

app = FastAPI(title="MCP Server HTTP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GenericToolRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any]


class StitchClipRequest(BaseModel):
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
    edit_instructions: List[Dict[str, Any]]
    source_video: str


class GenerateTranscriptRequest(BaseModel):
    video_path: str


class GenerateEditInstructionsRequest(BaseModel):
    transcript: List[Dict[str, Any]]
    edits_to_make: List[Dict[str, Any]]


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "MCP Server HTTP API",
        "version": "1.0.0",
        "endpoints": {
            "tools": "/tools",
            "tool_generic": "/tool/{tool_name}",
            "stitch_clips": "/tool/stitch_clips",
            "cut_segment": "/tool/cut_segment",
            "remove_segment": "/tool/remove_segment",
            "render_timeline": "/tool/render_timeline",
            "generate_transcript": "/tool/generate_transcript",
            "generate_edit_instructions": "/tool/generate_edit_instructions",
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/tools")
async def list_tools():
    """List all available MCP tools"""
    return {
        "tools": get_available_tools()
    }


@app.post("/tool/{tool_name}")
async def call_tool_generic(tool_name: str, parameters: Dict[str, Any]):
    """Generic endpoint to call any tool by name"""
    if tool_name not in TOOL_HANDLERS:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")
    
    try:
        handler = TOOL_HANDLERS[tool_name]
        result = await handler(parameters)
        return result
    except Exception as e:
        logger.error(f"Error calling tool {tool_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tool/generate_transcript")
async def generate_transcript(request: GenerateTranscriptRequest):
    """Generate transcript from video"""
    try:
        handler = TOOL_HANDLERS['generate_transcript']
        result = await handler(request.model_dump())
        return result
    except Exception as e:
        logger.error(f"Error in generate_transcript: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tool/stitch_clips")
async def stitch_clips(request: StitchClipRequest):
    """Stitch multiple video clips"""
    try:
        handler = TOOL_HANDLERS['stitch_clips']
        result = await handler(request.model_dump())
        return result
    except Exception as e:
        logger.error(f"Error in stitch_clips: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tool/cut_segment")
async def cut_segment(request: CutSegmentRequest):
    """Cut a segment from video"""
    try:
        handler = TOOL_HANDLERS['cut_segment']
        result = await handler(request.model_dump())
        return result
    except Exception as e:
        logger.error(f"Error in cut_segment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tool/remove_segment")
async def remove_segment(request: RemoveSegmentRequest):
    """Remove a segment from video"""
    try:
        handler = TOOL_HANDLERS['remove_segment']
        result = await handler(request.model_dump())
        return result
    except Exception as e:
        logger.error(f"Error in remove_segment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tool/render_timeline")
async def render_timeline(request: RenderTimelineRequest):
    """Render final video from timeline"""
    try:
        handler = TOOL_HANDLERS['render_timeline']
        result = await handler(request.model_dump())
        return result
    except Exception as e:
        logger.error(f"Error in render_timeline: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tool/generate_edit_instructions")
async def generate_edit_instructions(request: GenerateEditInstructionsRequest):
    """Generate edit instructions from transcript"""
    try:
        handler = TOOL_HANDLERS['generate_edit_instructions']
        result = await handler(request.model_dump())
        return result
    except Exception as e:
        logger.error(f"Error in generate_edit_instructions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 9000))
    uvicorn.run(app, host="0.0.0.0", port=port)