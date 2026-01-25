"""
Context Detector Module

Auto-detects creator context (industry, role, audience, tone) from transcript text
using a fast LLM model. Runs in parallel during transcription for zero-latency impact.
"""

import os
import json
import logging
import asyncio
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.models import CreatorContext

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Use GPT-4o-mini for fast, cheap context detection
fast_llm = ChatOpenAI(
    model='gpt-4o-mini',
    temperature=0.1,
    api_key=OPENAI_API_KEY,
    timeout=30,
    max_retries=2,
)

CONTEXT_DETECTION_PROMPT = """Analyze this transcript and determine the creator's context.

Return ONLY valid JSON with these exact fields:
{
  "industry": "<industry/niche like tech, fitness, beauty, finance, education, etc>",
  "role": "<creator's role like software engineer, coach, influencer, founder, etc>",
  "target_audience": "<who they're speaking to like entrepreneurs, developers, consumers, etc>",
  "tone": "<content tone like professional, casual, educational, motivational, etc>",
  "suggested_hook_style": "<best hook style: results-driven, story-driven, question-hook, or shock-value>"
}

Guidelines for suggested_hook_style:
- results-driven: Use when transcript mentions numbers, achievements, or outcomes (e.g., "$300 million", "10x growth")
- story-driven: Use when transcript is narrative/personal story focused
- question-hook: Use when content is educational or problem-solving focused
- shock-value: Use when content has surprising or contrarian takes

Transcript:
"""


async def detect_creator_context(transcript_text: str) -> Optional[CreatorContext]:
    """
    Detect creator context from transcript text using a fast LLM model.
    
    Args:
        transcript_text: The transcript text to analyze (typically from first clip)
    
    Returns:
        CreatorContext if detection succeeds, None if it fails
    """
    if not transcript_text or len(transcript_text.strip()) < 20:
        logger.warning("Transcript too short for context detection")
        return _get_default_context()
    
    # Truncate to first ~500 words for speed
    words = transcript_text.split()
    truncated_text = ' '.join(words[:500])
    
    try:
        response = await asyncio.wait_for(
            fast_llm.ainvoke([
                SystemMessage(content="You are a content analyst. Return only valid JSON, no markdown."),
                HumanMessage(content=f"{CONTEXT_DETECTION_PROMPT}{truncated_text}")
            ]),
            timeout=15  # 15 second timeout for fast response
        )
        
        result_text = response.content.strip()
        
        # Clean up potential markdown formatting
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
        result_text = result_text.strip()
        
        context_data = json.loads(result_text)
        
        context = CreatorContext(
            industry=context_data.get('industry', 'general'),
            role=context_data.get('role', 'creator'),
            target_audience=context_data.get('target_audience', 'general audience'),
            tone=context_data.get('tone', 'professional'),
            suggested_hook_style=context_data.get('suggested_hook_style', 'results-driven')
        )
        
        logger.info(f"Context detected: industry={context.industry}, role={context.role}, hook_style={context.suggested_hook_style}")
        return context
        
    except asyncio.TimeoutError:
        logger.warning("Context detection timed out, using defaults")
        return _get_default_context()
        
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse context JSON: {e}")
        return _get_default_context()
        
    except Exception as e:
        logger.error(f"Context detection failed: {e}")
        return _get_default_context()


def _get_default_context() -> CreatorContext:
    """Return sensible default context when detection fails."""
    return CreatorContext(
        industry="general",
        role="creator",
        target_audience="general audience",
        tone="professional",
        suggested_hook_style="results-driven"
    )
