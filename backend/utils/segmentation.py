"""
Segmentation utility for building hierarchical transcripts.
Structure: Clips -> Segments -> Words

This runs per-clip BEFORE stitching for natural phrase boundary detection,
then builds the full hierarchical transcript with proper timestamp offsets.
"""
from typing import List, Dict, Any


def segment_clip_into_phrases(
    words: List[Dict[str, Any]], 
    min_pause_seconds: float = 0.3,
    min_phrase_words: int = 2,
    max_segment_duration: float = 8.0
) -> List[Dict[str, Any]]:
    """
    Segment a single clip's words into phrases using multiple strategies:
    1. Pause detection (gaps between words)
    2. Sentence boundary detection (periods, question marks, etc.)
    3. Maximum duration enforcement (force splits if segment too long)
    
    Words are nested inside each segment (not referenced by indices).
    
    Args:
        words: List of word dicts with 'word', 'start', 'end' keys
        min_pause_seconds: Minimum gap between words to trigger new segment (default: 0.3s)
        min_phrase_words: Minimum words per phrase (avoids single-word segments)
        max_segment_duration: Maximum duration in seconds before forcing a split (default: 8.0s)
    
    Returns:
        List of segment dicts with 'text', 'start', 'end', 'words' (nested)
    """
    if not words:
        return []
    
    # Sentence-ending punctuation
    SENTENCE_ENDINGS = {'.', '?', '!', '。', '？', '！'}
    
    segments = []
    current_segment_start_idx = 0
    
    def _finalize_segment(start_idx: int, end_idx: int) -> None:
        """Helper to create and append a segment."""
        if end_idx <= start_idx:
            return
        
        segment_words = words[start_idx:end_idx]
        
        # Only create segment if it has minimum words
        if len(segment_words) >= min_phrase_words:
            segments.append({
                'text': ' '.join(w['word'].strip() for w in segment_words),
                'start': segment_words[0]['start'],
                'end': segment_words[-1]['end'],
                'words': segment_words  # Nested words, not indices
            })
    
    for i in range(1, len(words)):
        prev_word = words[i - 1]
        curr_word = words[i]
        
        # Calculate gap between previous word end and current word start
        gap = curr_word['start'] - prev_word['end']
        
        # Check current segment duration
        current_segment_duration = curr_word['start'] - words[current_segment_start_idx]['start']
        
        # Check if previous word ends a sentence
        prev_word_text = prev_word.get('word', '').strip()
        is_sentence_end = any(prev_word_text.endswith(punct) for punct in SENTENCE_ENDINGS)
        
        should_split = False
        split_reason = None
        
        # Strategy 1: Pause detection (lower threshold)
        if gap >= min_pause_seconds:
            should_split = True
            split_reason = 'pause'
        
        # Strategy 2: Sentence boundary detection
        elif is_sentence_end and i - current_segment_start_idx >= min_phrase_words:
            should_split = True
            split_reason = 'sentence_end'
        
        # Strategy 3: Maximum duration enforcement
        elif current_segment_duration >= max_segment_duration:
            # Find a good split point (prefer sentence end, otherwise use pause, otherwise mid-sentence)
            best_split_idx = i
            # Look backwards for a sentence end within the last 3 words
            for j in range(max(current_segment_start_idx + 1, i - 2), i + 1):
                if j > 0 and j <= len(words):
                    prev_w = words[j - 1].get('word', '').strip()
                    if any(prev_w.endswith(punct) for punct in SENTENCE_ENDINGS):
                        best_split_idx = j
                        split_reason = 'max_duration_sentence'
                        break
            
            if best_split_idx == i:
                # No sentence end found, split at current position
                split_reason = 'max_duration'
            
            should_split = True
            # Finalize segment at the best split point
            _finalize_segment(current_segment_start_idx, best_split_idx)
            current_segment_start_idx = best_split_idx
            continue  # Skip the rest of the loop iteration
        
        if should_split:
            _finalize_segment(current_segment_start_idx, i)
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
    
    # Fallback: If no segments were created (shouldn't happen, but safety check)
    if not segments and words:
        # Force at least one segment
        segments.append({
            'text': ' '.join(w['word'].strip() for w in words),
            'start': words[0]['start'],
            'end': words[-1]['end'],
            'words': words
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
    clips: List[Dict[str, Any]] = []
    cumulative_offset = 0.0
    all_texts: List[str] = []
    
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
