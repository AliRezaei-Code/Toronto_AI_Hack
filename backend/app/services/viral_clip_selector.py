"""
Viral Clip Selector - LLM-powered selection of high-engagement video segments.

This service analyzes transcripts to identify segments with viral potential
based on hook strength, story arc, emotional valence, and self-containment.
"""

import os
import json
import logging
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime

from openai import AsyncOpenAI

from app.models.director_models import (
    ViralClip,
    ViralClipSelection,
    HookType,
    DiarizationResult,
)
from app.models import Transcript, Clip, Segment

logger = logging.getLogger(__name__)

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your_openai_api_key_here")


VIRAL_SELECTION_PROMPT = """You are an expert viral video editor for TikTok, Instagram Reels, and YouTube Shorts.

Your task is to analyze the transcript below and identify {max_clips} segments (each {min_duration}-{max_duration} seconds) that have the highest potential to go viral.

## Selection Criteria

1. **Strong Hook (First 3 Seconds)**
   - Question hooks: "Did you know that...?" "What if I told you...?"
   - Shock hooks: Surprising statistics, controversial opinions
   - Story hooks: "So this one time..." "Here's what happened when..."
   - Result hooks: "I made $X doing this..." "This increased our sales by..."

2. **Self-Contained Story Arc**
   - Clear beginning, middle, and end
   - No external context required (don't reference "this chart" without showing it)
   - Complete thought that stands alone

3. **High Emotional Energy**
   - Excitement, surprise, controversy, humor
   - Moments of tension or resolution
   - Personal stories with emotional stakes

4. **Quotable/Shareable**
   - Contains memorable phrases
   - Actionable advice or insight
   - "I need to save this" factor

## Output Format

Return a JSON object with this structure:
{{
    "clips": [
        {{
            "start_time": 45.2,
            "end_time": 102.5,
            "virality_score": 85,
            "hook_type": "result",
            "hook_strength": 90,
            "summary": "Speaker shares how they 10x'd their revenue with one change",
            "suggested_titles": [
                "This ONE change 10x'd my revenue",
                "The secret to scaling your business",
                "Why most entrepreneurs fail (and how to avoid it)"
            ],
            "emphasis_words": ["10x", "revenue", "secret", "change"],
            "speakers": [0],
            "reasoning": "Strong result-driven hook with specific numbers. Complete story with clear takeaway."
        }}
    ],
    "selection_reasoning": "Overall explanation of why these clips were selected..."
}}

## Important Rules

1. Timestamps must be EXACT - use the word-level timestamps provided
2. Each clip must be between {min_duration} and {max_duration} seconds
3. Clips should NOT overlap
4. Avoid segments that heavily reference visual content ("look at this graph")
5. Prioritize segments where the speaker's energy is highest
6. Virality score should reflect realistic viral potential (80+ is exceptional)

## Speaker Information
{speaker_info}

## Transcript
{transcript}

Now identify the {max_clips} most viral-worthy segments:"""


class ViralClipSelector:
    """
    Selects viral-worthy clips from transcripts using GPT-4o.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or OPENAI_API_KEY
        self.client = AsyncOpenAI(api_key=self.api_key)

    async def select_clips(
        self,
        transcript: Transcript | DiarizationResult,
        job_id: str,
        max_clips: int = 5,
        min_duration: float = 30.0,
        max_duration: float = 90.0,
        hook_types: Optional[List[HookType]] = None,
    ) -> ViralClipSelection:
        """
        Analyze transcript and select viral clips.

        Args:
            transcript: Transcript or DiarizationResult to analyze
            job_id: Associated job ID
            max_clips: Maximum number of clips to select
            min_duration: Minimum clip duration in seconds
            max_duration: Maximum clip duration in seconds
            hook_types: Filter by specific hook types (optional)

        Returns:
            ViralClipSelection with scored clips
        """
        logger.info(f"[ViralClipSelector] Analyzing transcript for job {job_id}")

        # Format transcript for LLM
        transcript_text, speaker_info, total_duration = self._format_transcript(
            transcript
        )

        # Build the prompt
        prompt = VIRAL_SELECTION_PROMPT.format(
            max_clips=max_clips,
            min_duration=int(min_duration),
            max_duration=int(max_duration),
            speaker_info=speaker_info,
            transcript=transcript_text,
        )

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                temperature=0.3,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at identifying viral video content. Always respond with valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
            )

            result = json.loads(response.choices[0].message.content)

        except Exception as e:
            logger.error(f"[ViralClipSelector] LLM error: {e}")
            raise Exception(f"Failed to select viral clips: {e}")

        # Parse LLM response into ViralClip objects
        clips = []
        for clip_data in result.get("clips", []):
            try:
                # Validate hook type
                hook_type_str = clip_data.get("hook_type", "story").lower()
                try:
                    hook_type = HookType(hook_type_str)
                except ValueError:
                    hook_type = HookType.STORY

                # Filter by requested hook types
                if hook_types and hook_type not in hook_types:
                    continue

                # Get transcript text for this clip
                start_time = clip_data.get("start_time", 0)
                end_time = clip_data.get("end_time", 0)
                clip_transcript = self._extract_clip_transcript(
                    transcript, start_time, end_time
                )

                clip = ViralClip(
                    id=str(uuid.uuid4())[:8],
                    job_id=job_id,
                    start_time=start_time,
                    end_time=end_time,
                    duration=end_time - start_time,
                    virality_score=clip_data.get("virality_score", 50),
                    hook_type=hook_type,
                    hook_strength=clip_data.get("hook_strength", 50),
                    suggested_titles=clip_data.get("suggested_titles", []),
                    emphasis_words=clip_data.get("emphasis_words", []),
                    summary=clip_data.get("summary", ""),
                    speakers=clip_data.get("speakers", [0]),
                    transcript_text=clip_transcript,
                )

                # Validate duration
                if min_duration <= clip.duration <= max_duration:
                    clips.append(clip)
                else:
                    logger.warning(
                        f"[ViralClipSelector] Clip duration {clip.duration}s "
                        f"outside range {min_duration}-{max_duration}s, skipping"
                    )

            except Exception as e:
                logger.warning(f"[ViralClipSelector] Failed to parse clip: {e}")
                continue

        # Sort by virality score
        clips.sort(key=lambda c: c.virality_score, reverse=True)

        # Limit to max_clips
        clips = clips[:max_clips]

        logger.info(f"[ViralClipSelector] Selected {len(clips)} viral clips")

        return ViralClipSelection(
            job_id=job_id,
            clips=clips,
            total_analyzed_duration=total_duration,
            selection_reasoning=result.get("selection_reasoning", ""),
        )

    def _format_transcript(
        self, transcript: Transcript | DiarizationResult
    ) -> tuple[str, str, float]:
        """
        Format transcript for LLM analysis with timestamps.

        Returns:
            Tuple of (formatted_transcript, speaker_info, total_duration)
        """
        lines = []
        total_duration = 0.0
        speakers = set()

        if isinstance(transcript, DiarizationResult):
            # Format diarization result
            for segment in transcript.segments:
                timestamp = f"[{segment.start:.1f}s - {segment.end:.1f}s]"
                speaker = f"Speaker {segment.speaker_id}"
                speakers.add(segment.speaker_id)
                lines.append(f"{timestamp} {speaker}: {segment.text}")

            total_duration = transcript.duration
            speaker_info = f"Total speakers detected: {transcript.total_speakers}"

        elif isinstance(transcript, Transcript):
            # Format hierarchical transcript
            for clip in transcript.clips:
                for segment in clip.segments:
                    timestamp = f"[{segment.start:.1f}s - {segment.end:.1f}s]"
                    lines.append(f"{timestamp} {segment.text}")

            total_duration = transcript.duration or 0.0
            speaker_info = "Speaker diarization not available (single speaker assumed)"

        else:
            raise ValueError(f"Unknown transcript type: {type(transcript)}")

        return "\n".join(lines), speaker_info, total_duration

    def _extract_clip_transcript(
        self,
        transcript: Transcript | DiarizationResult,
        start_time: float,
        end_time: float,
    ) -> str:
        """Extract transcript text for a specific time range."""
        words = []

        if isinstance(transcript, DiarizationResult):
            for word in transcript.words:
                if start_time <= word.start <= end_time:
                    words.append(word.word)

        elif isinstance(transcript, Transcript):
            for clip in transcript.clips:
                for segment in clip.segments:
                    for word in segment.words:
                        if start_time <= word.start <= end_time:
                            words.append(word.word)

        return " ".join(words)


async def select_viral_clips(
    transcript: Transcript | DiarizationResult,
    job_id: str,
    max_clips: int = 5,
    min_duration: float = 30.0,
    max_duration: float = 90.0,
) -> ViralClipSelection:
    """
    Convenience function to select viral clips from a transcript.

    Args:
        transcript: Transcript or DiarizationResult
        job_id: Associated job ID
        max_clips: Maximum clips to select
        min_duration: Minimum duration per clip
        max_duration: Maximum duration per clip

    Returns:
        ViralClipSelection with scored clips
    """
    selector = ViralClipSelector()
    return await selector.select_clips(
        transcript=transcript,
        job_id=job_id,
        max_clips=max_clips,
        min_duration=min_duration,
        max_duration=max_duration,
    )
