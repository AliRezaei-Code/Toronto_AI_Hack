#!/usr/bin/env python3
import os
import asyncio
import json
from typing import Any
from mcp.server import Server
from mcp.types import Tool, TextContent
from dotenv import load_dotenv

load_dotenv()

from tools.transcription import TranscriptionTool
from tools.stitching import StitchingTool
from tools.cutting import CuttingTool
from tools.rendering import RenderingTool

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
SHARED_DATA_DIR = os.getenv(
    'SHARED_DATA_DIR',
    os.path.join(os.path.dirname(__file__), '..', 'shared-data')
)
PROCESSED_DIR = os.path.join(SHARED_DATA_DIR, 'processed')
TRANSCRIPTS_DIR = os.path.join(SHARED_DATA_DIR, 'transcripts')

os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(TRANSCRIPTS_DIR, exist_ok=True)

transcription_tool = TranscriptionTool(OPENAI_API_KEY, TRANSCRIPTS_DIR)
stitching_tool = StitchingTool(PROCESSED_DIR)
cutting_tool = CuttingTool(PROCESSED_DIR)
rendering_tool = RenderingTool(PROCESSED_DIR)

server = Server("video-editor-mcp")

@server.tool()
async def generate_transcript(video_path: str) -> list[TextContent]:
    """
    Generate a transcript from video using OpenAI Whisper API.
    
    Returns word-level transcription with precise timestamps.
    
    Args:
        video_path: Path to the video file to transcribe
    
    Returns:
        JSON string with words array containing 'word', 'start', 'end' for each word
    """
    try:
        transcript = await transcription_tool.generate_transcript(video_path)
        
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "success",
                    "data": transcript
                }, indent=2)
            )
        ]
    except Exception as e:
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "error",
                    "error": str(e)
                }, indent=2)
            )
        ]

@server.tool()
async def stitch_clips(
    clip_paths: list[str],
    transition_type: str = "crossfade",
    transition_duration: float = 0.5
) -> list[TextContent]:
    """
    Stitch multiple video clips together with transitions.
    
    Uses FFmpeg to concatenate videos. Supports 'crossfade' and 'cut' transitions.
    Crossfade creates a smooth transition between clips.
    
    Args:
        clip_paths: List of paths to video clips to stitch
        transition_type: Type of transition ('crossfade' or 'cut')
        transition_duration: Duration of transition in seconds (for crossfade)
    
    Returns:
        JSON with output_path of stitched video and duration
    """
    try:
        result = await stitching_tool.stitch_clips(
            clip_paths,
            transition_type,
            transition_duration
        )
        
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "success",
                    "data": result
                }, indent=2)
            )
        ]
    except Exception as e:
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "error",
                    "error": str(e)
                }, indent=2)
            )
        ]

@server.tool()
async def cut_segment(
    video_path: str,
    start_time: float,
    end_time: float,
    smart_render: bool = True
) -> list[TextContent]:
    """
    Cut a segment from video.
    
    Extracts a portion of the video from start_time to end_time.
    Smart rendering uses stream copy when possible for faster processing.
    
    Args:
        video_path: Path to source video
        start_time: Start time in seconds
        end_time: End time in seconds
        smart_render: Use stream copy if possible (faster, no quality loss)
    
    Returns:
        JSON with output_path of cut segment
    """
    try:
        result = await cutting_tool.cut_segment(
            video_path,
            start_time,
            end_time,
            smart_render
        )
        
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "success",
                    "data": result
                }, indent=2)
            )
        ]
    except Exception as e:
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "error",
                    "error": str(e)
                }, indent=2)
            )
        ]

@server.tool()
async def remove_segment(
    video_path: str,
    start_time: float,
    end_time: float
) -> list[TextContent]:
    """
    Remove a segment from video.
    
    Deletes the portion of video between start_time and end_time,
    concatenating the remaining parts together.
    
    Args:
        video_path: Path to source video
        start_time: Start time of segment to remove (seconds)
        end_time: End time of segment to remove (seconds)
    
    Returns:
        JSON with output_path and removed duration
    """
    try:
        result = await cutting_tool.remove_segment(
            video_path,
            start_time,
            end_time
        )
        
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "success",
                    "data": result
                }, indent=2)
            )
        ]
    except Exception as e:
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "error",
                    "error": str(e)
                }, indent=2)
            )
        ]

@server.tool()
async def render_timeline(
    edit_instructions: list[dict[str, Any]],
    source_video: str
) -> list[TextContent]:
    """
    Render final video from timeline edit instructions.
    
    Processes a list of keep/cut operations to produce the final video.
    Optimized to avoid re-encoding when possible.
    
    Args:
        edit_instructions: List of timeline operations
            Each op needs: type ('keep' or 'cut'), start (seconds), end (seconds)
        source_video: Path to source video
    
    Returns:
        JSON with output_path of rendered video
    """
    try:
        result = await rendering_tool.render_timeline(
            edit_instructions,
            source_video
        )
        
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "success",
                    "data": result
                }, indent=2)
            )
        ]
    except Exception as e:
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "error",
                    "error": str(e)
                }, indent=2)
            )
        ]

@server.tool()
async def generate_edit_instructions(
    transcript: list[dict[str, Any]],
    edits_to_make: list[dict[str, Any]]
) -> list[TextContent]:
    """
    Convert word-level edits to timeline instructions for FFmpeg.
    
    Takes word indices marked for deletion and converts them to
    time-based keep/cut operations for video rendering.
    
    Args:
        transcript: List of word objects with 'word', 'start', 'end'
        edits_to_make: List of edit operations
            Example: [{'type': 'delete', 'word_indices': [0, 1, 2]}]
    
    Returns:
        JSON with timeline instructions (keep/cut with timestamps)
    """
    try:
        instructions = await rendering_tool.generate_edit_instructions(
            transcript,
            edits_to_make
        )
        
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "success",
                    "data": instructions
                }, indent=2)
            )
        ]
    except Exception as e:
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "status": "error",
                    "error": str(e)
                }, indent=2)
            )
        ]

async def main():
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())