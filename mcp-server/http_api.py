#!/usr/bin/env python3
"""
HTTP API wrapper for MCP server tools.
Allows direct HTTP access to MCP functionality.
"""
import os
import sys
import json
import logging
import asyncio
from typing import Dict, Any, List

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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tools.transcription import TranscriptionTool
from tools.stitching import StitchingTool
from tools.cutting import CuttingTool
from tools.rendering import RenderingTool
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

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

transcription_tool = TranscriptionTool(OPENAI_API_KEY or '', TRANSCRIPTS_DIR)
stitching_tool = StitchingTool(PROCESSED_DIR)
cutting_tool = CuttingTool(PROCESSED_DIR)
rendering_tool = RenderingTool(PROCESSED_DIR)


async def handle_generate_transcript(params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle generate_transcript tool call"""
    video_path = params.get('video_path')
    if not video_path:
        return {'status': 'error', 'error': 'Missing video_path parameter'}
    
    try:
        transcript = await transcription_tool.generate_transcript(video_path)
        return {'status': 'success', 'data': transcript}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


async def handle_stitch_clips(params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle stitch_clips tool call"""
    clip_paths = params.get('clip_paths', [])
    
    if not clip_paths:
        return {'status': 'error', 'error': 'Missing clip_paths parameter'}
    
    try:
        result = await stitching_tool.stitch_clips(clip_paths)
        return {'status': 'success', 'data': result}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


async def handle_cut_segment(params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle cut_segment tool call"""
    video_path = params.get('video_path')
    start_time = params.get('start_time')
    end_time = params.get('end_time')
    smart_render = params.get('smart_render', True)
    
    if not video_path or start_time is None or end_time is None:
        return {'status': 'error', 'error': 'Missing required parameters'}
    
    try:
        result = await cutting_tool.cut_segment(
            video_path,
            float(start_time),
            float(end_time),
            smart_render
        )
        return {'status': 'success', 'data': result}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


async def handle_remove_segment(params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle remove_segment tool call"""
    video_path = params.get('video_path')
    start_time = params.get('start_time')
    end_time = params.get('end_time')
    
    if not video_path or start_time is None or end_time is None:
        return {'status': 'error', 'error': 'Missing required parameters'}
    
    try:
        result = await cutting_tool.remove_segment(
            video_path,
            float(start_time),
            float(end_time)
        )
        return {'status': 'success', 'data': result}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


async def handle_render_timeline(params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle render_timeline tool call"""
    edit_instructions = params.get('edit_instructions', [])
    source_video = params.get('source_video')
    
    if not edit_instructions:
        return {'status': 'error', 'error': 'Missing edit_instructions parameter'}
    
    if not source_video:
        return {'status': 'error', 'error': 'Missing source_video parameter'}
    
    try:
        result = await rendering_tool.render_timeline(
            edit_instructions,
            source_video
        )
        return {'status': 'success', 'data': result}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


async def handle_generate_edit_instructions(params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle generate_edit_instructions tool call"""
    transcript = params.get('transcript', [])
    edits_to_make = params.get('edits_to_make', [])
    
    if not transcript:
        return {'status': 'error', 'error': 'Missing transcript parameter'}
    
    try:
        instructions = await rendering_tool.generate_edit_instructions(
            transcript,
            edits_to_make
        )
        return {'status': 'success', 'data': instructions}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


TOOL_HANDLERS = {
    'generate_transcript': handle_generate_transcript,
    'stitch_clips': handle_stitch_clips,
    'cut_segment': handle_cut_segment,
    'remove_segment': handle_remove_segment,
    'render_timeline': handle_render_timeline,
    'generate_edit_instructions': handle_generate_edit_instructions,
}


def get_available_tools() -> List[Dict[str, Any]]:
    """Get list of available tools for documentation"""
    return [
        {
            'name': 'generate_transcript',
            'description': 'Generate word-level transcript with timestamps using Whisper API',
            'parameters': {
                'type': 'object',
                'properties': {
                    'video_path': {
                        'type': 'string',
                        'description': 'Path to video file'
                    }
                },
                'required': ['video_path']
            }
        },
        {
            'name': 'stitch_clips',
            'description': 'Concatenate multiple video clips together',
            'parameters': {
                'type': 'object',
                'properties': {
                    'clip_paths': {
                        'type': 'array',
                        'items': {'type': 'string'},
                        'description': 'List of video file paths'
                    }
                },
                'required': ['clip_paths']
            }
        },
        {
            'name': 'cut_segment',
            'description': 'Cut a segment from a video',
            'parameters': {
                'type': 'object',
                'properties': {
                    'video_path': {'type': 'string'},
                    'start_time': {'type': 'number'},
                    'end_time': {'type': 'number'},
                    'smart_render': {'type': 'boolean', 'default': True}
                },
                'required': ['video_path', 'start_time', 'end_time']
            }
        },
        {
            'name': 'remove_segment',
            'description': 'Remove a segment from a video',
            'parameters': {
                'type': 'object',
                'properties': {
                    'video_path': {'type': 'string'},
                    'start_time': {'type': 'number'},
                    'end_time': {'type': 'number'}
                },
                'required': ['video_path', 'start_time', 'end_time']
            }
        },
        {
            'name': 'render_timeline',
            'description': 'Render final video from timeline edit instructions',
            'parameters': {
                'type': 'object',
                'properties': {
                    'edit_instructions': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'type': {'type': 'string', 'enum': ['keep', 'cut']},
                                'start': {'type': 'number'},
                                'end': {'type': 'number'}
                            }
                        }
                    },
                    'source_video': {'type': 'string'}
                },
                'required': ['edit_instructions', 'source_video']
            }
        },
        {
            'name': 'generate_edit_instructions',
            'description': 'Convert word-level edits to timeline instructions',
            'parameters': {
                'type': 'object',
                'properties': {
                    'transcript': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'word': {'type': 'string'},
                                'start': {'type': 'number'},
                                'end': {'type': 'number'}
                            }
                        }
                    },
                    'edits_to_make': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'type': {'type': 'string'},
                                'word_indices': {'type': 'array', 'items': {'type': 'number'}}
                            }
                        }
                    }
                },
                'required': ['transcript', 'edits_to_make']
            }
        }
    ]


if __name__ == '__main__':
    print("MCP HTTP Wrapper - Tool Handlers Loaded")
    print(f"Available tools: {list(TOOL_HANDLERS.keys())}")