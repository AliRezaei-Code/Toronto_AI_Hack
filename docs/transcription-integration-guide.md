# Integration Guide: Transcription MCP

> See [readme.md](readme.md) for overall project architecture and PRD.

## Overview

This guide covers integrating the Transcription MCP with the existing Assembly Agent MCP Orchestrator, FFmpeg MCP, and After Effects MCP to enable end-to-end subtitle generation and burning.

## Prerequisites

- Assembly Agent MCP Orchestrator running
- FFmpeg MCP deployed with audio extraction capability
- Object Storage (S3/R2) configured
- MongoDB Atlas connection
- GPU server for Transcription MCP (or CPU fallback)

## Integration Steps

### 1. Register Transcription MCP in Tool Registry

Add the Transcription MCP to the Tool Registry JSON:

```json
{
  "tools": [
    {
      "id": "transcription-mcp",
      "name": "Transcription MCP",
      "description": "Speech-to-text transcription with subtitle generation using Faster-Whisper",
      "version": "1.0.0",
      "endpoint": "https://transcription-mcp.your-domain.com",
      "methods": [
        {
          "name": "transcribe",
          "description": "Transcribe audio from video/audio file",
          "async": true,
          "timeout_seconds": 300
        },
        {
          "name": "get_transcription_status",
          "description": "Check status of async transcription job",
          "async": false
        },
        {
          "name": "get_supported_languages",
          "description": "List supported transcription languages",
          "async": false
        }
      ],
      "capabilities": ["transcribe", "subtitle_generation", "word_timestamps"],
      "input_types": ["video/mp4", "video/mov", "audio/wav", "audio/mp3"],
      "output_types": ["text/srt", "text/vtt", "application/json"],
      "requires_gpu": true,
      "fallback_endpoint": "https://transcription-mcp-cpu.your-domain.com"
    }
  ]
}
```

### 2. Update Assembly Agent Orchestrator

#### Add Transcription to Workflow Pipeline

```python
# assembly_agent/workflows/video_edit.py

from typing import Optional
from dataclasses import dataclass

@dataclass
class TranscriptionConfig:
    enabled: bool = True
    model: str = "large-v3"
    language: Optional[str] = None  # Auto-detect if None
    word_timestamps: bool = True
    output_formats: list = None

    def __post_init__(self):
        if self.output_formats is None:
            self.output_formats = ["srt", "vtt", "json"]


async def process_video_with_transcription(
    video_id: str,
    video_url: str,
    transcription_config: TranscriptionConfig,
    subtitle_style: str = "viral_tiktok"
) -> dict:
    """
    Main workflow integrating transcription with video editing.
    """
    result = {
        "video_id": video_id,
        "transcription": None,
        "edited_video_url": None,
        "errors": []
    }

    # Step 1: Run transcription
    if transcription_config.enabled:
        try:
            transcription = await invoke_transcription_mcp(
                media_url=video_url,
                options={
                    "model": transcription_config.model,
                    "language": transcription_config.language,
                    "output_formats": transcription_config.output_formats,
                    "word_timestamps": transcription_config.word_timestamps
                }
            )
            result["transcription"] = transcription

            # Store in MongoDB
            await store_transcription(video_id, transcription)

        except TranscriptionError as e:
            result["errors"].append(f"Transcription failed: {e}")
            # Continue without subtitles

    # Step 2: Burn subtitles if transcription succeeded
    if result["transcription"] and not result["errors"]:
        try:
            edited_url = await invoke_ffmpeg_mcp(
                method="burn_subtitles",
                params={
                    "video_url": video_url,
                    "subtitle_url": result["transcription"]["subtitle_files"]["srt"],
                    "style": get_subtitle_style(subtitle_style)
                }
            )
            result["edited_video_url"] = edited_url

        except FFmpegError as e:
            result["errors"].append(f"Subtitle burning failed: {e}")

    return result
```

#### MCP Invocation Helper

```python
# assembly_agent/mcp_client.py

import httpx
from typing import Any, Dict

class MCPClient:
    def __init__(self, registry: Dict[str, Any]):
        self.registry = registry
        self.client = httpx.AsyncClient(timeout=300)

    async def invoke(self, tool_id: str, method: str, params: Dict) -> Dict:
        tool = self.registry["tools"].get(tool_id)
        if not tool:
            raise ValueError(f"Tool {tool_id} not found in registry")

        endpoint = f"{tool['endpoint']}/{method}"

        response = await self.client.post(
            endpoint,
            json=params,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()

    async def invoke_transcription(self, media_url: str, options: Dict) -> Dict:
        return await self.invoke(
            "transcription-mcp",
            "transcribe",
            {"media_url": media_url, "options": options}
        )

    async def invoke_ffmpeg_burn_subtitles(
        self,
        video_url: str,
        subtitle_url: str,
        style: Dict
    ) -> str:
        result = await self.invoke(
            "ffmpeg-mcp",
            "burn_subtitles",
            {
                "video_url": video_url,
                "subtitle_url": subtitle_url,
                "style": style
            }
        )
        return result["output_url"]
```

### 3. Update FFmpeg MCP

Add subtitle burning capability to the existing FFmpeg MCP.

#### New Method: `burn_subtitles`

```python
# ffmpeg_mcp/handlers/subtitles.py

import subprocess
from pathlib import Path
from typing import Dict, Optional

def burn_subtitles(
    video_path: str,
    subtitle_path: str,
    output_path: str,
    style: Optional[Dict] = None
) -> str:
    """
    Burn subtitles into video using FFmpeg.

    Args:
        video_path: Path to input video
        subtitle_path: Path to SRT/ASS subtitle file
        output_path: Path for output video
        style: Optional style configuration

    Returns:
        Path to output video
    """
    # Default style
    default_style = {
        "font": "Montserrat",
        "size": 24,
        "color": "FFFFFF",
        "outline_color": "000000",
        "outline_width": 2,
        "position": "center"
    }
    style = {**default_style, **(style or {})}

    # Build FFmpeg filter
    force_style = (
        f"FontName={style['font']},"
        f"FontSize={style['size']},"
        f"PrimaryColour=&H{style['color']}&,"
        f"OutlineColour=&H{style['outline_color']}&,"
        f"Outline={style['outline_width']},"
        f"Alignment={get_alignment(style['position'])}"
    )

    cmd = [
        "ffmpeg",
        "-i", video_path,
        "-vf", f"subtitles={subtitle_path}:force_style='{force_style}'",
        "-c:a", "copy",
        "-y",
        output_path
    ]

    subprocess.run(cmd, check=True, capture_output=True)
    return output_path


def get_alignment(position: str) -> int:
    """Convert position string to ASS alignment value."""
    alignments = {
        "bottom_left": 1,
        "bottom": 2,
        "bottom_right": 3,
        "center_left": 4,
        "center": 5,
        "center_right": 6,
        "top_left": 7,
        "top": 8,
        "top_right": 9
    }
    return alignments.get(position, 5)
```

#### API Endpoint

```python
# ffmpeg_mcp/routes.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, List

router = APIRouter()

class BurnSubtitlesRequest(BaseModel):
    video_url: str
    subtitle_url: str
    style: Optional[Dict] = None
    output_format: str = "mp4"

class BurnSubtitlesResponse(BaseModel):
    output_url: str
    duration_seconds: float

@router.post("/burn_subtitles", response_model=BurnSubtitlesResponse)
async def burn_subtitles_endpoint(request: BurnSubtitlesRequest):
    """Burn subtitles into video."""
    try:
        # Download video and subtitle from object storage
        video_path = await download_from_storage(request.video_url)
        subtitle_path = await download_from_storage(request.subtitle_url)

        # Generate output path
        output_path = generate_output_path(video_path, "_subtitled")

        # Burn subtitles
        burn_subtitles(
            video_path=video_path,
            subtitle_path=subtitle_path,
            output_path=output_path,
            style=request.style
        )

        # Upload to storage
        output_url = await upload_to_storage(output_path)

        return BurnSubtitlesResponse(
            output_url=output_url,
            duration_seconds=get_video_duration(output_path)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 4. Android App Integration

#### API Endpoints for Mobile

```kotlin
// Android API service interface

interface VideoEditApi {
    @POST("videos/{videoId}/transcribe")
    suspend fun requestTranscription(
        @Path("videoId") videoId: String,
        @Body options: TranscriptionOptions
    ): TranscriptionJob

    @GET("videos/{videoId}/transcription")
    suspend fun getTranscription(
        @Path("videoId") videoId: String
    ): TranscriptionResult

    @GET("transcription-jobs/{jobId}")
    suspend fun getTranscriptionStatus(
        @Path("jobId") jobId: String
    ): TranscriptionJobStatus

    @POST("videos/{videoId}/burn-subtitles")
    suspend fun burnSubtitles(
        @Path("videoId") videoId: String,
        @Body options: SubtitleBurnOptions
    ): EditedVideo
}

data class TranscriptionOptions(
    val model: String = "large-v3",
    val language: String? = null,
    val wordTimestamps: Boolean = true
)

data class SubtitleBurnOptions(
    val stylePreset: String = "viral_tiktok",
    val customStyle: SubtitleStyle? = null
)
```

#### Workflow Example

```kotlin
// Example usage in Android app

class VideoEditViewModel : ViewModel() {

    suspend fun processVideoWithSubtitles(videoId: String) {
        // 1. Request transcription
        val job = api.requestTranscription(
            videoId,
            TranscriptionOptions(wordTimestamps = true)
        )

        // 2. Poll for completion
        var status = api.getTranscriptionStatus(job.jobId)
        while (status.status == "processing") {
            delay(2000)
            status = api.getTranscriptionStatus(job.jobId)
            updateProgress(status.progress)
        }

        if (status.status == "failed") {
            showError("Transcription failed: ${status.error}")
            return
        }

        // 3. Get transcription result
        val transcription = api.getTranscription(videoId)

        // 4. Show subtitle preview
        showSubtitlePreview(transcription.wordTimings)

        // 5. User selects style and confirms
        val selectedStyle = awaitStyleSelection()

        // 6. Burn subtitles
        val editedVideo = api.burnSubtitles(
            videoId,
            SubtitleBurnOptions(stylePreset = selectedStyle)
        )

        // 7. Show result
        showEditedVideo(editedVideo.url)
    }
}
```

### 5. Retention Editing Corpus Integration

Add transcription-aware suggestions to the corpus:

```json
{
  "transcription_suggestions": {
    "hooks": {
      "pattern": "first_5_seconds",
      "rules": [
        {
          "if": "transcript.segments[0].text.length > 50",
          "suggest": "Consider shortening your opening hook - viral content starts fast",
          "action": "highlight_segment",
          "segment_id": 0
        },
        {
          "if": "transcript.segments[0].words.some(w => w.confidence < 0.7)",
          "suggest": "Audio clarity issue detected in hook - consider re-recording",
          "action": "flag_for_review"
        }
      ]
    },
    "pacing": {
      "pattern": "words_per_minute",
      "optimal_range": [140, 180],
      "rules": [
        {
          "if": "calculated_wpm < 140",
          "suggest": "Pacing is slow - consider cutting pauses or speeding up 1.1x"
        },
        {
          "if": "calculated_wpm > 180",
          "suggest": "Pacing is fast - ensure subtitles are readable"
        }
      ]
    },
    "subtitle_styles": {
      "auto_select": {
        "if": "transcript.language == 'en' && calculated_wpm > 150",
        "recommend": "viral_tiktok",
        "reason": "Fast-paced English content works well with animated word highlights"
      }
    }
  }
}
```

## Testing

### Unit Tests

```python
# tests/test_transcription_integration.py

import pytest
from assembly_agent.workflows import process_video_with_transcription

@pytest.mark.asyncio
async def test_transcription_workflow():
    result = await process_video_with_transcription(
        video_id="test_123",
        video_url="s3://test-bucket/test_video.mp4",
        transcription_config=TranscriptionConfig(model="small"),  # Use small for tests
        subtitle_style="professional"
    )

    assert result["transcription"] is not None
    assert result["transcription"]["language"] == "en"
    assert len(result["transcription"]["word_timings"]) > 0
    assert result["edited_video_url"] is not None
    assert not result["errors"]


@pytest.mark.asyncio
async def test_transcription_fallback_on_failure():
    # Test with invalid video
    result = await process_video_with_transcription(
        video_id="test_invalid",
        video_url="s3://test-bucket/nonexistent.mp4",
        transcription_config=TranscriptionConfig()
    )

    assert "Transcription failed" in result["errors"][0]
    # Workflow should continue without subtitles
```

### Integration Tests

```python
# tests/integration/test_full_workflow.py

@pytest.mark.integration
async def test_upload_transcribe_burn_download():
    # 1. Upload test video
    video_url = await upload_test_video("sample_30s.mp4")

    # 2. Process with transcription
    result = await process_video_with_transcription(
        video_id="integration_test",
        video_url=video_url,
        transcription_config=TranscriptionConfig()
    )

    # 3. Verify output
    assert result["edited_video_url"]

    # 4. Download and verify subtitles are visible
    output_path = await download_video(result["edited_video_url"])
    frames = extract_frames(output_path, [5, 15, 25])  # Sample frames

    # Basic check: frames should differ from original
    # (subtitles add visual content)
    for frame in frames:
        assert has_text_overlay(frame)
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Transcription timeout | Large video file | Increase timeout or chunk audio |
| Low confidence scores | Background noise | Flag for review, suggest audio cleanup |
| Subtitle timing drift | Variable frame rate | Ensure CFR before processing |
| FFmpeg style not applying | Invalid ASS format | Validate style parameters |

### Debug Logging

Enable verbose logging for troubleshooting:

```python
import logging

logging.getLogger("assembly_agent").setLevel(logging.DEBUG)
logging.getLogger("transcription_mcp").setLevel(logging.DEBUG)
logging.getLogger("ffmpeg_mcp").setLevel(logging.DEBUG)
```

--

**Related Documents:**
- [Transcription MCP Spec](transcription-mcp-spec.md)
- [Architecture Update](architecture-transcription.md)
- [MongoDB Schema](mongodb-transcription-schema.md)
- [Subtitle Style Presets](subtitle-style-presets.md)
