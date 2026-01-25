"""
Segmentation utility for building hierarchical transcripts.
Structure: Clips -> Segments -> Words

This runs per-clip BEFORE stitching for natural phrase boundary detection,
then builds the full hierarchical transcript with proper timestamp offsets.
"""
from typing import List, Dict, Any


def segment_clip_into_phrases(
    words: List[Dict[str, Any]], 
    min_pause_seconds: float = 0.5,
    min_phrase_words: int = 2
) -> List[Dict[str, Any]]:
    """
    Segment a single clip's words into phrases based on pause detection.
    Words are nested inside each segment (not referenced by indices).
    
    Args:
        words: List of word dicts with 'word', 'start', 'end' keys
        min_pause_seconds: Minimum gap between words to trigger new segment
        min_phrase_words: Minimum words per phrase (avoids single-word segments)
    
    Returns:
        List of segment dicts with 'text', 'start', 'end', 'words' (nested)
    """
    if not words:
        return []
    
    segments = []
    current_segment_start_idx = 0
    
    for i in range(1, len(words)):
        prev_word = words[i - 1]
        curr_word = words[i]
        
        # Calculate gap between previous word end and current word start
        gap = curr_word['start'] - prev_word['end']
        
        # If gap exceeds threshold, finalize current segment
        if gap >= min_pause_seconds:
            segment_words = words[current_segment_start_idx:i]
            
            # Only create segment if it has minimum words
            if len(segment_words) >= min_phrase_words:
                segments.append({
                    'text': ' '.join(w['word'].strip() for w in segment_words),
                    'start': segment_words[0]['start'],
                    'end': segment_words[-1]['end'],
                    'words': segment_words  # Nested words, not indices
                })
            
            current_segment_start_idx = i
    
    # Don't forget the last segment
    if current_segment_start_idx < len(words):
        segment_words = words[current_segment_start_idx:]
        if len(segment_words) >= min_phrase_words:
            segments.append({
                'text': ' '.join(w['word'].strip() for w in segment_words),
                'start': segment_words[0]['start'],
                'end': segment_words[-1]['end'],
                'words': segment_words
            })
    
    return segments


def build_hierarchical_transcript(clip_data: List[dict]) -> dict:
    """
    Build hierarchical transcript from per-clip data.
    
    All timestamps are made ABSOLUTE (relative to the final stitched video).
    Each clip stores its start_offset for calculating clip-relative times if needed.
    
    Args:
        clip_data: List of dicts, each containing:
            - 'clip_index': int
            - 'text': str
            - 'words': List[dict] (raw words from transcription)
            - 'segments': List[dict] (from segment_clip_into_phrases)
            - 'duration': float
    
    Returns:
        Hierarchical dict with:
            - 'text': str (combined full text)
            - 'duration': float (total duration)
            - 'clips': List[dict] (clips with segments containing nested words)
    """
    clips = []
    cumulative_offset = 0.0
    all_texts = []
    
    for clip in clip_data:
        clip_index = clip.get('clip_index', len(clips))
        clip_duration = clip.get('duration', 0.0)
        clip_text = clip.get('text', '')
        segments = clip.get('segments', [])
        
        all_texts.append(clip_text)
        
        # Build segments with absolute timestamps and nested words
        offset_segments = []
        for segment in segments:
            # Offset all word timestamps
            offset_words = []
            for word in segment.get('words', []):
                offset_words.append({
                    'word': word['word'],
                    'start': word['start'] + cumulative_offset,
                    'end': word['end'] + cumulative_offset
                })
            
            offset_segments.append({
                'text': segment['text'],
                'start': segment['start'] + cumulative_offset,
                'end': segment['end'] + cumulative_offset,
                'words': offset_words
            })
        
        clips.append({
            'clip_index': clip_index,
            'duration': clip_duration,
            'start_offset': cumulative_offset,
            'segments': offset_segments
        })
        
        cumulative_offset += clip_duration
    
    return {
        'text': ' '.join(all_texts),
        'duration': cumulative_offset,
        'clips': clips
    }
