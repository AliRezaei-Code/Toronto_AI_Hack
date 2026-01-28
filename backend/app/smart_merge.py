"""
Smart Merge Module

LLM-powered one-shot operation that analyzes transcript segments,
reorders them with the strongest hook first, and trims for tight pacing.
"""

import os
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.models import Transcript, CreatorContext, EditInstruction, SmartMergeSegment

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Use GPT-4o for main smart merge (better reasoning)
llm = ChatOpenAI(
    model='gpt-4o',
    temperature=0.3,
    api_key=OPENAI_API_KEY,
    timeout=90,
    max_retries=2,
)


def _build_smart_merge_prompt(transcript: Transcript, context: CreatorContext) -> str:
    """Build the smart merge prompt with transcript and context."""
    
    # Build a simplified transcript representation for the LLM
    # Timestamps are LOCAL to each clip (not absolute)
    # We convert from ABSOLUTE (after build_hierarchical_transcript) back to LOCAL
    # by subtracting the clip's start_offset
    segments_info = []
    for clip in transcript.clips:
        clip_offset = clip.start_offset
        for segment in clip.segments:
            # Convert ABSOLUTE timestamps back to LOCAL (relative to clip start)
            local_start = segment.start - clip_offset
            local_end = segment.end - clip_offset
            segments_info.append({
                "clip_index": clip.clip_index,
                "text": segment.text,
                "start": round(local_start, 2),
                "end": round(local_end, 2),
                "duration": round(local_end - local_start, 2)
            })
    
    transcript_json = json.dumps(segments_info, indent=2)
    
    return f"""You are a professional video editor optimizing content for {context.target_audience} in the {context.industry} space.

The creator is a {context.role}. Their content works best with {context.suggested_hook_style} hooks.
The overall tone should be {context.tone}.

TASK: Analyze the transcript segments and create an optimized edit that:
1. HOOK FIRST: Identify the most attention-grabbing segment and place it first
2. LOGICAL FLOW: Order remaining segments for narrative flow (intro -> body -> conclusion)  
3. TIGHT CUTS: Use the exact timestamps - we'll cut at word boundaries for snappy pacing

SEGMENTS (timestamps are LOCAL to each clip, not absolute):
{transcript_json}

GUIDELINES:
- For {context.suggested_hook_style} hooks: 
  - results-driven: Lead with numbers, achievements, outcomes
  - story-driven: Lead with compelling personal moment
  - question-hook: Lead with intriguing question or problem
  - shock-value: Lead with surprising or contrarian statement
- Remove redundant segments that say the same thing
- Keep segments that add unique value
- Aim for punchy, engaging flow
- Strip as much dead space as possible
- If there is duplicate content make sure to keep the most relevant one and remove the duplicate.

Return ONLY valid JSON (no markdown):
{{
  "reasoning": "Brief explanation of why this order works for the audience",
  "segments": [
    {{"clip_index": <int>, "start": <float>, "end": <float>, "label": "<hook|intro|body|conclusion>"}},
    ...
  ],
  "estimated_duration": <total seconds of kept segments>
}}

IMPORTANT: 
- ALWAYS include "clip_index" in each segment - this tells us which source clip to cut from
- Include only relevant segments (keep content under 30s) in the "segments" array
- Omit segments you want to cut (do not include them)
- The "clip_index", "start" and "end" must match exact values from the input
- Order the segments array in the final playback order (hook first)"""


async def analyze_and_reorder_segments(
    transcript: Transcript,
    context: CreatorContext
) -> Dict[str, Any]:
    """
    Analyze transcript and determine optimal segment ordering with tight cuts.
    
    Args:
        transcript: Hierarchical transcript with clips -> segments -> words
        context: Detected creator context for optimization
    
    Returns:
        Dict with:
        - reasoning: LLM explanation
        - segments: List of SmartMergeSegment in playback order (with clip_index)
        - estimated_duration: Total duration of kept segments
    """
    prompt = _build_smart_merge_prompt(transcript, context)
    
    try:
        response = await asyncio.wait_for(
            llm.ainvoke([
                SystemMessage(content="You are a video editing AI. Return only valid JSON."),
                HumanMessage(content=prompt)
            ]),
            timeout=60
        )
        
        result_text = response.content.strip()

        logger.info(f"Smart merge LLM response: {result_text[:500]}...")
        
        # Clean up markdown if present
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
        result_text = result_text.strip()
        
        analysis = json.loads(result_text)
        
        reasoning = analysis.get('reasoning', 'Optimized for engagement')
        raw_segments = analysis.get('segments', [])
        estimated_duration = analysis.get('estimated_duration', 0)
        
        # Build segments with clip_index
        kept_segments = []
        
        for seg in raw_segments:
            # Skip cut segments if any
            if seg.get('label', '').lower() == 'cut':
                continue
            
            clip_index = int(seg.get('clip_index', 0))
            start = float(seg['start'])
            end = float(seg['end'])
            label = seg.get('label', 'body')
            
            kept_segments.append(SmartMergeSegment(
                clip_index=clip_index,
                start=start,
                end=end,
                label=label
            ))
        
        # Recalculate duration from kept segments
        if kept_segments:
            estimated_duration = sum(seg.end - seg.start for seg in kept_segments)
        
        logger.info(f"Smart merge: keeping {len(kept_segments)} segments, ~{estimated_duration:.1f}s total")
        
        return {
            'reasoning': reasoning,
            'segments': kept_segments,
            'estimated_duration': round(estimated_duration, 2)
        }
        
    except asyncio.TimeoutError:
        logger.error("Smart merge LLM call timed out")
        raise Exception("Smart merge timed out - please try again")
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse smart merge response: {e}")
        raise Exception("Failed to parse smart merge response")
        
    except Exception as e:
        logger.error(f"Smart merge failed: {e}")
        raise


def build_transcript_from_segments(
    original_transcript: Transcript,
    kept_segments: List[SmartMergeSegment]
) -> Transcript:
    """
    Build a new transcript from the kept segments in their new order.
    
    This creates a simplified transcript structure reflecting the reordered video.
    Segments now include clip_index for direct lookup.
    """
    from app.models import Clip, Segment, Word
    
    # Create a lookup for original segments by (clip_index, LOCAL_start, LOCAL_end)
    # We convert ABSOLUTE timestamps back to LOCAL for matching with LLM output
    original_segments_map = {}
    for clip in original_transcript.clips:
        clip_offset = clip.start_offset
        for segment in clip.segments:
            # Convert ABSOLUTE to LOCAL for the lookup key
            local_start = round(segment.start - clip_offset, 2)
            local_end = round(segment.end - clip_offset, 2)
            key = (clip.clip_index, local_start, local_end)
            original_segments_map[key] = segment
    
    # Build new clips based on kept segments order
    new_clips = []
    current_offset = 0.0
    total_words_added = 0

    for i, kept_seg in enumerate(kept_segments):
        key = (kept_seg.clip_index, round(kept_seg.start, 2), round(kept_seg.end, 2))

        if key in original_segments_map:
            logger.info(f"[build_transcript] Segment {i}: found match for key {key}")
            orig_segment = original_segments_map[key]

            # Adjust word timestamps relative to new position
            # Use orig_segment.start (ABSOLUTE) since word timestamps are also ABSOLUTE
            segment_start_absolute = orig_segment.start
            new_words = []
            for word in orig_segment.words:
                new_words.append(Word(
                    word=word.word,
                    start=current_offset + (word.start - segment_start_absolute),
                    end=current_offset + (word.end - segment_start_absolute)
                ))
            
            segment_duration = kept_seg.end - kept_seg.start
            
            new_segment = Segment(
                text=orig_segment.text,
                start=current_offset,
                end=current_offset + segment_duration,
                words=new_words
            )
            
            new_clip = Clip(
                clip_index=i,
                duration=segment_duration,
                start_offset=current_offset,
                segments=[new_segment]
            )
            new_clips.append(new_clip)
            total_words_added += len(new_words)

            current_offset += segment_duration
        else:
            logger.warning(f"[build_transcript] Segment {i}: NO MATCH for key {key}")
            logger.warning(f"[build_transcript] Available keys: {list(original_segments_map.keys())[:5]}...")

    logger.info(f"[build_transcript] Total: {len(new_clips)} clips, {total_words_added} words, {current_offset:.2f}s duration")

    # Build full text
    full_text = ' '.join(
        seg.text for clip in new_clips for seg in clip.segments
    )
    
    return Transcript(
        text=full_text,
        duration=current_offset,
        clips=new_clips
    )
