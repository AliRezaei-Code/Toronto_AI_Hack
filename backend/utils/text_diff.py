import difflib
import logging
from typing import List, Tuple

from app.models import Word

logger = logging.getLogger(__name__)


def calculate_text_edit_diff(original_text: str, edited_text: str) -> List[Tuple[str, str]]:
    """
    Calculate the differences between original and edited text.
    
    Args:
        original_text: The original transcript text
        edited_text: The edited transcript text
    
    Returns:
        List of tuples (operation, text) where operation is '-' (delete) or '+' (insert)
    """
    original_words = original_text.split()
    edited_words = edited_text.split()
    
    differ = difflib.SequenceMatcher(None, original_words, edited_words)
    diff = []
    
    for tag, i1, i2, j1, j2 in differ.get_opcodes():
        if tag == 'replace':
            for word in original_words[i1:i2]:
                diff.append(('-', word))
            for word in edited_words[j1:j2]:
                diff.append(('+', word))
        elif tag == 'delete':
            for word in original_words[i1:i2]:
                diff.append(('-', word))
        elif tag == 'insert':
            for word in edited_words[j1:j2]:
                diff.append(('+', word))
        
        tag == 'equal'
    
    return diff


def map_text_diff_to_timestamps(
    transcript_words: List[Word],
    diff: List[Tuple[str, str]]
) -> Tuple[List[Word], List[Tuple[float, float]]]:
    """
    Map text diff to transcript word timestamps.
    
    Args:
        transcript_words: Original transcript words with timestamps
        diff: Text diff operations
    
    Returns:
        Tuple of (updated_words, time_ranges_to_delete)
    """
    updated_words = []
    time_ranges_to_delete = []
    transcript_idx = 0
    
    for operation, text in diff:
        if operation == '-':
            if transcript_idx < len(transcript_words):
                word = transcript_words[transcript_idx]
                time_ranges_to_delete.append((word.start, word.end))
                transcript_idx += 1
        elif operation == '+':
            new_word = Word(
                word=text,
                start=0.0,
                end=0.1
            )
            if updated_words:
                last_word = updated_words[-1]
                new_word.start = last_word.end
                new_word.end = last_word.end + 0.1
            updated_words.append(new_word)
        else:
            if transcript_idx < len(transcript_words):
                updated_words.append(transcript_words[transcript_idx])
                transcript_idx += 1
    
    if transcript_idx < len(transcript_words):
        updated_words.extend(transcript_words[transcript_idx:])
    
    recalculate_timestamps(updated_words)
    
    return updated_words, time_ranges_to_delete


def recalculate_timestamps(words: List[Word]) -> None:
    """
    Recalculate timestamps for a list of words.
    
    Args:
        words: List of words with timestamps to recalculate
    """
    for i, word in enumerate(words):
        if i == 0:
            word.start = 0.0
            word.end = 0.3
        else:
            prev_word = words[i - 1]
            word.start = prev_word.end
            word.end = prev_word.end + 0.3


def generate_transcript_from_words(words: List[Word]) -> str:
    """
    Generate transcript text from a list of words.
    
    Args:
        words: List of words
    
    Returns:
        Transcript text
    """
    return ' '.join([w.word for w in words])


def find_word_by_position(words: List[Word], position: float) -> int:
    """
    Find the word index at a given time position.
    
    Args:
        words: List of words with timestamps
        position: Time position in seconds
    
    Returns:
        Index of the word at that position, or -1 if not found
    """
    for i, word in enumerate(words):
        if word.start <= position <= word.end:
            return i
    return -1


def split_transcript_by_ranges(
    words: List[Word],
    ranges: List[Tuple[float, float]]
) -> Tuple[List[Word], List[Word]]:
    """
    Split transcript into kept and removed words based on time ranges.
    
    Args:
        words: List of words with timestamps
        ranges: Time ranges to remove
    
    Returns:
        Tuple of (kept_words, removed_words)
    """
    kept_words = []
    removed_words = []
    
    for word in words:
        word_center = (word.start + word.end) / 2
        is_removed = False
        
        for range_start, range_end in ranges:
            if range_start <= word_center <= range_end:
                is_removed = True
                break
        
        if is_removed:
            removed_words.append(word)
        else:
            kept_words.append(word)
    
    return kept_words, removed_words