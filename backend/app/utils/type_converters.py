"""
Type conversion utilities for transcript data structures.

Converts between dict representations (from JSON/API responses) and
Pydantic models (Word, Segment, Clip, Transcript).
"""

from typing import List, Union, Dict, Any
from app.models import Word, Segment, Clip, Transcript


def dict_to_word(data: Union[Dict[str, Any], Word]) -> Word:
    """
    Convert dict or Word to Word model.

    Args:
        data: Either a dict with word/start/end keys or an existing Word instance

    Returns:
        Word model instance
    """
    if isinstance(data, Word):
        return data
    return Word(
        word=data.get("word", ""),
        start=float(data.get("start", 0.0)),
        end=float(data.get("end", 0.0))
    )


def dict_to_segment(data: Union[Dict[str, Any], Segment]) -> Segment:
    """
    Convert dict or Segment to Segment model.

    Args:
        data: Either a dict with text/start/end/words keys or an existing Segment instance

    Returns:
        Segment model instance with nested Word objects
    """
    if isinstance(data, Segment):
        return data
    words = [dict_to_word(w) for w in data.get("words", [])]
    return Segment(
        text=data.get("text", ""),
        start=float(data.get("start", 0.0)),
        end=float(data.get("end", 0.0)),
        words=words
    )


def dict_to_clip(data: Union[Dict[str, Any], Clip]) -> Clip:
    """
    Convert dict or Clip to Clip model.

    Args:
        data: Either a dict with clip_index/duration/start_offset/segments keys
              or an existing Clip instance

    Returns:
        Clip model instance with nested Segment objects
    """
    if isinstance(data, Clip):
        return data
    segments = [dict_to_segment(s) for s in data.get("segments", [])]
    return Clip(
        clip_index=int(data.get("clip_index", 0)),
        duration=float(data.get("duration", 0.0)),
        start_offset=float(data.get("start_offset", 0.0)),
        segments=segments
    )


def words_to_transcript(
    words: List[Union[Dict[str, Any], Word]],
    text: str = "",
    duration: float = 0.0
) -> Transcript:
    """
    Convert a flat word list to a hierarchical Transcript structure.

    Creates a single Clip with a single Segment containing all words.
    This is useful when working with agent results that return flat word lists.

    Args:
        words: List of Word objects or dicts with word/start/end keys
        text: Optional full transcript text (generated from words if not provided)
        duration: Optional total duration (calculated from words if not provided)

    Returns:
        Transcript model with proper Clip -> Segment -> Word hierarchy
    """
    if not words:
        return Transcript(text=text or "", duration=duration, clips=[])

    word_models = [dict_to_word(w) for w in words]

    # Generate text from words if not provided
    if not text:
        text = " ".join(w.word for w in word_models)

    # Calculate duration from words if not provided
    if not duration and word_models:
        duration = word_models[-1].end - word_models[0].start

    # Create single segment containing all words
    segment = Segment(
        text=text,
        start=word_models[0].start if word_models else 0.0,
        end=word_models[-1].end if word_models else 0.0,
        words=word_models
    )

    # Create single clip containing the segment
    clip = Clip(
        clip_index=0,
        duration=duration,
        start_offset=0.0,
        segments=[segment]
    )

    return Transcript(
        text=text,
        duration=duration,
        clips=[clip]
    )


def extract_words_from_transcript(transcript: Transcript) -> List[Word]:
    """
    Extract a flat list of Word objects from a hierarchical Transcript.

    Iterates through all clips and segments to collect words in order.

    Args:
        transcript: Transcript model with nested Clip/Segment/Word structure

    Returns:
        Flat list of Word objects in order of appearance
    """
    words: List[Word] = []
    for clip in transcript.clips:
        for segment in clip.segments:
            words.extend(segment.words)
    return words
