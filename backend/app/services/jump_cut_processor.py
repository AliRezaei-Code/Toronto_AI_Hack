"""
Jump-Cut Processor - Automatic removal of filler words and silences.

This service creates an Edit Decision List (EDL) that removes:
- Filler words (um, uh, like, you know, etc.)
- Long silences (> 0.5 seconds)
- Verbal hesitations

The result is a "snappy" edit style popular on social media.
"""

import logging
from typing import List, Optional, Tuple
from dataclasses import dataclass

from app.models.director_models import (
    DiarizationResult,
    DiarizedWord,
    EditDecisionList,
    KeepRange,
    JumpCutEdit,
)
from app.models import Transcript, Word

logger = logging.getLogger(__name__)

# Configuration for jump-cut processing
DEFAULT_MIN_PAUSE = 0.5  # Minimum pause to consider as "silence"
DEFAULT_MAX_PAUSE = 2.0  # Maximum pause before forced cut
PADDING_BEFORE = 0.05  # Seconds of padding before speech
PADDING_AFTER = 0.08  # Seconds of padding after speech


@dataclass
class CutCandidate:
    """A potential cut point in the video."""

    start: float
    end: float
    reason: str
    confidence: float = 1.0


class JumpCutProcessor:
    """
    Processes transcripts to create jump-cut edit decision lists.

    Features:
    - Filler word removal
    - Silence trimming
    - Configurable aggressiveness
    - Zoom-cut markers for visual transitions
    """

    def __init__(
        self,
        min_pause: float = DEFAULT_MIN_PAUSE,
        max_pause: float = DEFAULT_MAX_PAUSE,
        remove_fillers: bool = True,
        padding_before: float = PADDING_BEFORE,
        padding_after: float = PADDING_AFTER,
    ):
        """
        Initialize the processor.

        Args:
            min_pause: Minimum silence duration to cut (seconds)
            max_pause: Maximum silence before forced cut
            remove_fillers: Whether to remove filler words
            padding_before: Audio padding before speech (seconds)
            padding_after: Audio padding after speech (seconds)
        """
        self.min_pause = min_pause
        self.max_pause = max_pause
        self.remove_fillers = remove_fillers
        self.padding_before = padding_before
        self.padding_after = padding_after

    def process_diarization(
        self,
        diarization: DiarizationResult,
        job_id: str,
        clip_id: Optional[str] = None,
    ) -> EditDecisionList:
        """
        Process a diarization result to create jump-cut EDL.

        Args:
            diarization: DiarizationResult with words and filler tags
            job_id: Associated job ID
            clip_id: Optional clip ID for sub-clips

        Returns:
            EditDecisionList with keep ranges and cut information
        """
        logger.info(f"[JumpCutProcessor] Processing {len(diarization.words)} words")

        words = diarization.words
        original_duration = diarization.duration

        if not words:
            return EditDecisionList(
                job_id=job_id,
                clip_id=clip_id,
                original_duration=original_duration,
                keep_ranges=[KeepRange(start=0, end=original_duration)],
                cuts=[],
                final_duration=original_duration,
                time_saved=0.0,
            )

        # Identify all cut candidates
        cuts = self._identify_cuts(words, original_duration)

        # Convert cuts to keep ranges
        keep_ranges = self._cuts_to_keep_ranges(cuts, original_duration)

        # Calculate final duration
        final_duration = sum(kr.end - kr.start for kr in keep_ranges)
        time_saved = original_duration - final_duration

        logger.info(
            f"[JumpCutProcessor] Original: {original_duration:.1f}s, "
            f"Final: {final_duration:.1f}s, Saved: {time_saved:.1f}s "
            f"({len(cuts)} cuts)"
        )

        return EditDecisionList(
            job_id=job_id,
            clip_id=clip_id,
            original_duration=original_duration,
            keep_ranges=keep_ranges,
            cuts=cuts,
            final_duration=final_duration,
            time_saved=time_saved,
        )

    def process_transcript(
        self,
        transcript: Transcript,
        job_id: str,
    ) -> EditDecisionList:
        """
        Process a standard Transcript to create jump-cut EDL.

        Args:
            transcript: Standard Transcript model
            job_id: Associated job ID

        Returns:
            EditDecisionList with keep ranges and cut information
        """
        # Flatten transcript words into a list with timing
        all_words: List[DiarizedWord] = []

        for clip in transcript.clips:
            for segment in clip.segments:
                for word in segment.words:
                    all_words.append(
                        DiarizedWord(
                            word=word.word,
                            start=word.start,
                            end=word.end,
                            confidence=1.0,
                            speaker_id=0,
                            is_filler=self._is_filler_word(word.word),
                        )
                    )

        # Create a pseudo-DiarizationResult
        original_duration = transcript.duration or (
            all_words[-1].end if all_words else 0.0
        )

        diarization = DiarizationResult(
            job_id=job_id,
            total_speakers=1,
            segments=[],
            words=all_words,
            filler_words=[w for w in all_words if w.is_filler],
            duration=original_duration,
        )

        return self.process_diarization(diarization, job_id)

    def _identify_cuts(
        self, words: List[DiarizedWord], total_duration: float
    ) -> List[JumpCutEdit]:
        """
        Identify all points where we should cut.
        """
        cuts: List[JumpCutEdit] = []

        for i, word in enumerate(words):
            # Cut filler words
            if self.remove_fillers and word.is_filler:
                cuts.append(
                    JumpCutEdit(
                        start=word.start,
                        end=word.end,
                        reason=f"filler_word:{word.word}",
                    )
                )

            # Check for silence between words
            if i > 0:
                prev_word = words[i - 1]
                gap = word.start - prev_word.end

                if gap >= self.min_pause:
                    # This is a significant pause - cut it
                    # Keep a small amount of silence for natural feel
                    cut_start = prev_word.end + self.padding_after
                    cut_end = word.start - self.padding_before

                    if cut_end > cut_start:
                        cuts.append(
                            JumpCutEdit(
                                start=cut_start,
                                end=cut_end,
                                reason=f"silence:{gap:.2f}s",
                            )
                        )

        # Handle leading silence
        if words and words[0].start > self.min_pause:
            cuts.insert(
                0,
                JumpCutEdit(
                    start=0,
                    end=max(0, words[0].start - self.padding_before),
                    reason="leading_silence",
                ),
            )

        # Handle trailing silence
        if words and (total_duration - words[-1].end) > self.min_pause:
            cuts.append(
                JumpCutEdit(
                    start=words[-1].end + self.padding_after,
                    end=total_duration,
                    reason="trailing_silence",
                )
            )

        # Merge overlapping cuts
        cuts = self._merge_overlapping_cuts(cuts)

        return cuts

    def _merge_overlapping_cuts(self, cuts: List[JumpCutEdit]) -> List[JumpCutEdit]:
        """Merge overlapping or adjacent cuts."""
        if not cuts:
            return cuts

        # Sort by start time
        cuts.sort(key=lambda c: c.start)

        merged: List[JumpCutEdit] = []
        current = cuts[0]

        for next_cut in cuts[1:]:
            # Check if cuts overlap or are adjacent
            if next_cut.start <= current.end + 0.01:  # Small tolerance
                # Merge cuts
                current = JumpCutEdit(
                    start=current.start,
                    end=max(current.end, next_cut.end),
                    reason=f"{current.reason}+{next_cut.reason}",
                )
            else:
                merged.append(current)
                current = next_cut

        merged.append(current)
        return merged

    def _cuts_to_keep_ranges(
        self, cuts: List[JumpCutEdit], total_duration: float
    ) -> List[KeepRange]:
        """Convert list of cuts to list of keep ranges."""
        if not cuts:
            return [KeepRange(start=0, end=total_duration)]

        keep_ranges: List[KeepRange] = []
        current_time = 0.0

        for cut in cuts:
            if cut.start > current_time:
                keep_ranges.append(
                    KeepRange(
                        start=current_time,
                        end=cut.start,
                    )
                )
            current_time = max(current_time, cut.end)

        # Add final keep range if needed
        if current_time < total_duration:
            keep_ranges.append(
                KeepRange(
                    start=current_time,
                    end=total_duration,
                )
            )

        # Filter out very short ranges (< 0.1s)
        keep_ranges = [kr for kr in keep_ranges if kr.end - kr.start >= 0.1]

        return keep_ranges

    def _is_filler_word(self, word: str) -> bool:
        """Check if a word is a filler word."""
        filler_words = {
            "um",
            "uh",
            "umm",
            "uhh",
            "er",
            "err",
            "ah",
            "ahh",
            "hmm",
            "hm",
            "mm",
            "mmm",
        }
        return word.lower().strip(".,!?") in filler_words


def get_zoom_cut_points(edl: EditDecisionList, max_points: int = 10) -> List[float]:
    """
    Get timestamps where zoom-cuts should be applied.

    Zoom-cuts are applied at edit points to mask the visual jump.

    Args:
        edl: Edit Decision List
        max_points: Maximum zoom-cut points to return

    Returns:
        List of timestamps where zoom should change
    """
    # Zoom-cuts should happen at the end of each keep range
    # (where content continues after a cut)
    zoom_points = []

    for i, keep_range in enumerate(edl.keep_ranges[:-1]):
        zoom_points.append(keep_range.end)

    # Limit to max_points (distribute evenly if needed)
    if len(zoom_points) > max_points:
        step = len(zoom_points) / max_points
        zoom_points = [zoom_points[int(i * step)] for i in range(max_points)]

    return zoom_points


async def create_jump_cut_edl(
    diarization: DiarizationResult,
    job_id: str,
    remove_fillers: bool = True,
    min_pause: float = 0.5,
) -> EditDecisionList:
    """
    Convenience function to create a jump-cut EDL.

    Args:
        diarization: Diarization result with words
        job_id: Associated job ID
        remove_fillers: Whether to remove filler words
        min_pause: Minimum silence to cut

    Returns:
        EditDecisionList with keep ranges
    """
    processor = JumpCutProcessor(
        min_pause=min_pause,
        remove_fillers=remove_fillers,
    )

    return processor.process_diarization(diarization, job_id)
