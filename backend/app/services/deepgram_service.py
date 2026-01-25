"""
Deepgram Transcription Service - Speech-to-text with speaker diarization.

This service provides:
- High-accuracy transcription using Nova-2 model
- Speaker diarization (who spoke when)
- Filler word detection (um, uh, etc.)
- Word-level timestamps for precise editing
"""

import os
import json
import logging
import asyncio
from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path

import httpx

from app.models.director_models import (
    DiarizedWord,
    DiarizationSegment,
    DiarizationResult,
)

logger = logging.getLogger(__name__)

# Deepgram API configuration
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "your_deepgram_api_key_here")
DEEPGRAM_API_URL = "https://api.deepgram.com/v1/listen"

# Common filler words to detect
FILLER_WORDS = {
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
    "like",
    "you know",
    "basically",
    "actually",
    "literally",
    "right",
    "so",
    "well",
    "I mean",
}


class DeepgramService:
    """
    Service for transcribing audio/video with Deepgram Nova-2.

    Features:
    - Speaker diarization
    - Filler word detection
    - Word-level timestamps
    - Confidence scores
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or DEEPGRAM_API_KEY
        self.base_url = DEEPGRAM_API_URL

    async def transcribe_file(
        self,
        file_path: str,
        diarize: bool = True,
        detect_fillers: bool = True,
        language: str = "en",
        model: str = "nova-2",
    ) -> DiarizationResult:
        """
        Transcribe an audio/video file with diarization.

        Args:
            file_path: Path to audio/video file
            diarize: Enable speaker diarization
            detect_fillers: Detect and tag filler words
            language: Language code (default: en)
            model: Deepgram model (default: nova-2)

        Returns:
            DiarizationResult with words, segments, and speaker info
        """
        logger.info(f"[DeepgramService] Starting transcription: {file_path}")

        # Build query parameters
        params = {
            "model": model,
            "language": language,
            "punctuate": "true",
            "diarize": str(diarize).lower(),
            "filler_words": str(detect_fillers).lower(),
            "utterances": "true",
            "smart_format": "true",
            "paragraphs": "true",
        }

        # Read file and send to Deepgram
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Determine content type
        suffix = file_path.suffix.lower()
        content_types = {
            ".mp3": "audio/mp3",
            ".mp4": "video/mp4",
            ".wav": "audio/wav",
            ".m4a": "audio/m4a",
            ".webm": "audio/webm",
            ".mov": "video/quicktime",
            ".avi": "video/x-msvideo",
        }
        content_type = content_types.get(suffix, "audio/mp3")

        headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": content_type,
        }

        try:
            async with httpx.AsyncClient(timeout=300) as client:
                with open(file_path, "rb") as f:
                    file_content = f.read()

                logger.info(
                    f"[DeepgramService] Sending {len(file_content) / 1024 / 1024:.2f}MB to Deepgram"
                )

                response = await client.post(
                    self.base_url,
                    params=params,
                    headers=headers,
                    content=file_content,
                )

                if response.status_code != 200:
                    logger.error(
                        f"[DeepgramService] API error: {response.status_code} - {response.text}"
                    )
                    raise Exception(f"Deepgram API error: {response.status_code}")

                result = response.json()

        except httpx.TimeoutException:
            logger.error("[DeepgramService] Request timed out")
            raise Exception("Transcription request timed out")

        # Parse the response
        return self._parse_deepgram_response(result, str(file_path), detect_fillers)

    async def transcribe_url(
        self,
        audio_url: str,
        diarize: bool = True,
        detect_fillers: bool = True,
        language: str = "en",
        model: str = "nova-2",
    ) -> DiarizationResult:
        """
        Transcribe audio from a URL with diarization.

        Args:
            audio_url: URL to audio/video file
            diarize: Enable speaker diarization
            detect_fillers: Detect and tag filler words
            language: Language code
            model: Deepgram model

        Returns:
            DiarizationResult with words, segments, and speaker info
        """
        logger.info(f"[DeepgramService] Transcribing from URL: {audio_url}")

        params = {
            "model": model,
            "language": language,
            "punctuate": "true",
            "diarize": str(diarize).lower(),
            "filler_words": str(detect_fillers).lower(),
            "utterances": "true",
            "smart_format": "true",
        }

        headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": "application/json",
        }

        body = {"url": audio_url}

        try:
            async with httpx.AsyncClient(timeout=300) as client:
                response = await client.post(
                    self.base_url,
                    params=params,
                    headers=headers,
                    json=body,
                )

                if response.status_code != 200:
                    raise Exception(f"Deepgram API error: {response.status_code}")

                result = response.json()

        except httpx.TimeoutException:
            raise Exception("Transcription request timed out")

        return self._parse_deepgram_response(result, audio_url, detect_fillers)

    def _parse_deepgram_response(
        self, response: Dict[str, Any], source: str, detect_fillers: bool
    ) -> DiarizationResult:
        """
        Parse Deepgram API response into our data models.
        """
        try:
            # Extract channel data
            channels = response.get("results", {}).get("channels", [])
            if not channels:
                raise ValueError("No channels in Deepgram response")

            channel = channels[0]
            alternatives = channel.get("alternatives", [])
            if not alternatives:
                raise ValueError("No alternatives in Deepgram response")

            alternative = alternatives[0]

            # Get metadata
            metadata = response.get("metadata", {})
            duration = metadata.get("duration", 0.0)

            # Parse words with speaker info
            raw_words = alternative.get("words", [])
            words: List[DiarizedWord] = []
            filler_words: List[DiarizedWord] = []
            speakers_seen = set()

            for w in raw_words:
                word_text = w.get("word", "")
                is_filler = self._is_filler_word(word_text) if detect_fillers else False
                speaker_id = w.get("speaker", 0)
                speakers_seen.add(speaker_id)

                diarized_word = DiarizedWord(
                    word=word_text,
                    start=w.get("start", 0.0),
                    end=w.get("end", 0.0),
                    confidence=w.get("confidence", 1.0),
                    speaker_id=speaker_id,
                    is_filler=is_filler,
                    punctuated_word=w.get("punctuated_word", word_text),
                )

                words.append(diarized_word)

                if is_filler:
                    filler_words.append(diarized_word)

            # Parse utterances/paragraphs as segments
            utterances = alternative.get("paragraphs", {}).get("paragraphs", [])
            segments: List[DiarizationSegment] = []

            for para in utterances:
                for sentence in para.get("sentences", []):
                    speaker_id = para.get("speaker", 0)
                    start = sentence.get("start", 0.0)
                    end = sentence.get("end", 0.0)
                    text = sentence.get("text", "")

                    # Get words for this segment
                    segment_words = [
                        w for w in words if w.start >= start and w.end <= end
                    ]

                    segment = DiarizationSegment(
                        speaker_id=speaker_id,
                        start=start,
                        end=end,
                        confidence=sum(w.confidence for w in segment_words)
                        / max(len(segment_words), 1),
                        text=text,
                        words=segment_words,
                    )
                    segments.append(segment)

            # If no paragraphs, create segments from utterances
            if not segments:
                raw_utterances = response.get("results", {}).get("utterances", [])
                for utt in raw_utterances:
                    speaker_id = utt.get("speaker", 0)
                    start = utt.get("start", 0.0)
                    end = utt.get("end", 0.0)
                    text = utt.get("transcript", "")

                    segment_words = [
                        w for w in words if w.start >= start and w.end <= end
                    ]

                    segment = DiarizationSegment(
                        speaker_id=speaker_id,
                        start=start,
                        end=end,
                        confidence=utt.get("confidence", 1.0),
                        text=text,
                        words=segment_words,
                    )
                    segments.append(segment)

            logger.info(
                f"[DeepgramService] Parsed: {len(words)} words, "
                f"{len(segments)} segments, {len(speakers_seen)} speakers, "
                f"{len(filler_words)} fillers"
            )

            return DiarizationResult(
                job_id="",  # Will be set by caller
                total_speakers=len(speakers_seen),
                segments=segments,
                words=words,
                filler_words=filler_words,
                duration=duration,
            )

        except Exception as e:
            logger.error(f"[DeepgramService] Error parsing response: {e}")
            raise ValueError(f"Failed to parse Deepgram response: {e}")

    def _is_filler_word(self, word: str) -> bool:
        """Check if a word is a filler word."""
        word_lower = word.lower().strip(".,!?")
        return word_lower in FILLER_WORDS


# Fallback to existing Whisper transcription if Deepgram unavailable
class WhisperFallbackService:
    """
    Fallback transcription service using existing MCP Whisper endpoint.
    Does not provide diarization, but maintains compatibility.
    """

    def __init__(self, mcp_server_url: str = "http://localhost:9000"):
        self.mcp_server_url = mcp_server_url

    async def transcribe_file(self, file_path: str) -> DiarizationResult:
        """
        Transcribe using Whisper via MCP server (no diarization).
        """
        logger.info(f"[WhisperFallback] Transcribing: {file_path}")

        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(
                f"{self.mcp_server_url}/tool/generate_transcript",
                json={"video_path": file_path},
            )

            if response.status_code != 200:
                raise Exception(f"Whisper transcription failed: {response.text}")

            data = response.json().get("data", {})

        # Convert Whisper response to DiarizationResult
        words = []
        raw_words = data.get("words", [])

        for w in raw_words:
            word_text = w.get("word", "")
            is_filler = word_text.lower().strip(".,!?") in FILLER_WORDS

            words.append(
                DiarizedWord(
                    word=word_text,
                    start=w.get("start", 0.0),
                    end=w.get("end", 0.0),
                    confidence=1.0,
                    speaker_id=0,  # No diarization - assume single speaker
                    is_filler=is_filler,
                )
            )

        filler_words = [w for w in words if w.is_filler]

        # Create single segment (no diarization)
        segments = []
        if words:
            segments.append(
                DiarizationSegment(
                    speaker_id=0,
                    start=words[0].start,
                    end=words[-1].end,
                    confidence=1.0,
                    text=data.get("text", ""),
                    words=words,
                )
            )

        return DiarizationResult(
            job_id="",
            total_speakers=1,
            segments=segments,
            words=words,
            filler_words=filler_words,
            duration=data.get("duration", 0.0),
        )


async def get_transcription_service() -> DeepgramService | WhisperFallbackService:
    """
    Factory function to get the appropriate transcription service.
    Uses Deepgram if API key is configured, otherwise falls back to Whisper.
    """
    api_key = os.getenv("DEEPGRAM_API_KEY", "")

    if api_key and api_key != "your_deepgram_api_key_here":
        logger.info("[TranscriptionService] Using Deepgram Nova-2")
        return DeepgramService(api_key)
    else:
        logger.warning(
            "[TranscriptionService] No Deepgram key, falling back to Whisper"
        )
        mcp_url = os.getenv("MCP_SERVER_URL", "http://localhost:9000")
        return WhisperFallbackService(mcp_url)


# Convenience function for direct usage
async def transcribe_with_diarization(
    file_path: str,
    job_id: str = "",
) -> DiarizationResult:
    """
    Transcribe a file with speaker diarization.

    Args:
        file_path: Path to audio/video file
        job_id: Associated job ID

    Returns:
        DiarizationResult with speaker-labeled transcript
    """
    service = await get_transcription_service()
    result = await service.transcribe_file(file_path)
    result.job_id = job_id
    return result
