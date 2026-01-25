import os
import json
import subprocess
import asyncio
import logging
import uuid
from typing import Dict, List, Any
from openai import AsyncOpenAI, APIError, APIConnectionError, RateLimitError
import aiofiles

logger = logging.getLogger(__name__)

# OpenAI Whisper API file size limit (25 MB)
MAX_FILE_SIZE = 25 * 1024 * 1024

class TranscriptionTool:
    def __init__(self, openai_api_key: str, output_dir: str, timeout: int = 180):
        self.client = AsyncOpenAI(
            api_key=openai_api_key,
            timeout=timeout
        )
        self.output_dir = output_dir
        self.timeout = timeout
        os.makedirs(self.output_dir, exist_ok=True)

    def _extract_and_compress_audio(self, video_path: str) -> str:
        """
        Extract audio from video and compress it to stay under Whisper's 25 MB limit.
        
        Args:
            video_path: Path to the video file
            
        Returns:
            Path to the compressed audio file (mp3)
        """
        audio_filename = f"temp_audio_{uuid.uuid4().hex[:8]}.mp3"
        audio_path = os.path.join(self.output_dir, audio_filename)
        
        # Get video duration to calculate appropriate bitrate
        duration_result = subprocess.run(
            [
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                video_path
            ],
            capture_output=True,
            text=True
        )
        
        duration = float(duration_result.stdout.strip()) if duration_result.returncode == 0 else 300
        
        # Calculate max bitrate to stay under 25 MB
        # Formula: bitrate (kbps) = (max_size_bytes * 8) / (duration_seconds * 1000)
        # Use 90% of limit for safety margin
        max_bitrate = int((MAX_FILE_SIZE * 0.9 * 8) / (duration * 1000))
        # Clamp between 32 kbps (minimum quality) and 128 kbps (good quality for speech)
        bitrate = max(32, min(128, max_bitrate))
        
        logger.info(f"Extracting audio from {video_path} (duration: {duration:.1f}s, bitrate: {bitrate}k)")
        
        # Extract audio as mono MP3 with calculated bitrate
        command = [
            'ffmpeg',
            '-i', video_path,
            '-vn',                    # No video
            '-acodec', 'libmp3lame',  # MP3 codec
            '-ac', '1',               # Mono (half the size of stereo)
            '-ar', '16000',           # 16kHz sample rate (good for speech)
            '-b:a', f'{bitrate}k',    # Calculated bitrate
            '-y',                     # Overwrite output
            audio_path
        ]
        
        result = subprocess.run(command, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"FFmpeg audio extraction failed: {result.stderr}")
            raise Exception(f"Failed to extract audio: {result.stderr}")
        
        # Verify file size
        file_size = os.path.getsize(audio_path)
        logger.info(f"Extracted audio: {audio_path} ({file_size / (1024*1024):.2f} MB)")
        
        if file_size > MAX_FILE_SIZE:
            # If still too large, try again with lower bitrate
            logger.warning(f"Audio still too large ({file_size} bytes), re-compressing with lower bitrate")
            os.remove(audio_path)
            
            # Recalculate with lower bitrate
            new_bitrate = int(bitrate * MAX_FILE_SIZE / file_size * 0.9)
            new_bitrate = max(24, new_bitrate)  # Minimum 24 kbps
            
            command[command.index(f'{bitrate}k')] = f'{new_bitrate}k'
            result = subprocess.run(command, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise Exception(f"Failed to re-compress audio: {result.stderr}")
            
            file_size = os.path.getsize(audio_path)
            logger.info(f"Re-compressed audio: {audio_path} ({file_size / (1024*1024):.2f} MB)")
        
        return audio_path

    async def generate_transcript(self, video_path: str) -> Dict[str, Any]:
        """
        Generate transcript with timestamps using OpenAI Whisper API.
        
        Extracts and compresses audio from video before sending to API.
        Includes retry logic for transient failures and timeout handling.
        
        Args:
            video_path: Path to the video file
        
        Returns:
            Dictionary with words array including timestamps
        """
        # Extract and compress audio first
        audio_path = None
        try:
            audio_path = self._extract_and_compress_audio(video_path)
            file_to_transcribe = audio_path
            logger.info(f"Using extracted audio for transcription: {audio_path}")
        except Exception as e:
            logger.warning(f"Audio extraction failed, using original file: {e}")
            file_to_transcribe = video_path
        
        max_retries = 3
        last_error = None
        
        try:
            for attempt in range(max_retries):
                try:
                    with open(file_to_transcribe, 'rb') as audio_file:
                        transcript = await asyncio.wait_for(
                            self.client.audio.transcriptions.create(
                                file=audio_file,
                                model='whisper-1',
                                response_format='verbose_json',
                                timestamp_granularities=['word']
                            ),
                            timeout=self.timeout
                        )
                        
                        words = []
                        if hasattr(transcript, 'words') and transcript.words is not None:
                            for word in transcript.words:
                                words.append({
                                    'word': word.word,
                                    'start': word.start,
                                    'end': word.end
                                })
                        
                        result = {
                            'text': transcript.text if hasattr(transcript, 'text') else '',
                            'words': words,
                            'duration': transcript.duration if hasattr(transcript, 'duration') else 0.0
                        }
                        
                        logger.info(f"Transcription succeeded for: {video_path}")
                        return result
                        
                except asyncio.TimeoutError:
                    last_error = f"Transcription timed out after {self.timeout}s"
                    logger.warning(f"{last_error} (attempt {attempt + 1}/{max_retries})")
                    
                except RateLimitError as e:
                    last_error = f"OpenAI rate limit exceeded: {str(e)}"
                    logger.warning(f"{last_error} (attempt {attempt + 1}/{max_retries})")
                    
                except APIConnectionError as e:
                    last_error = f"Connection error: {str(e)}"
                    logger.warning(f"{last_error} (attempt {attempt + 1}/{max_retries})")
                    
                except APIError as e:
                    last_error = f"API error: {str(e)}"
                    logger.error(f"{last_error} (attempt {attempt + 1}/{max_retries})")
                    
                except Exception as e:
                    last_error = f"Unexpected error: {str(e)}"
                    logger.error(f"{last_error} (attempt {attempt + 1}/{max_retries})")
                
                if attempt < max_retries - 1:
                    delay = (2 ** attempt) * 2.0
                    logger.info(f"Retrying in {delay}s...")
                    await asyncio.sleep(delay)
            
            raise Exception(f"Transcription failed after {max_retries} attempts: {last_error}")
        
        finally:
            # Clean up temporary audio file
            if audio_path and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                    logger.debug(f"Cleaned up temporary audio file: {audio_path}")
                except Exception as e:
                    logger.warning(f"Failed to clean up temp audio file: {e}")

    async def save_transcript(self, transcript: Dict[str, Any], job_id: str) -> str:
        """
        Save transcript to JSON file.
        
        Args:
            transcript: Transcript dictionary
            job_id: Job identifier
        
        Returns:
            Path to saved transcript file
        """
        output_path = os.path.join(self.output_dir, f"{job_id}.json")
        
        async with aiofiles.open(output_path, 'w') as f:
            await f.write(json.dumps(transcript, indent=2))
        
        logger.info(f"Transcript saved to: {output_path}")
        return output_path

    async def load_transcript(self, job_id: str) -> Dict[str, Any]:
        """
        Load transcript from JSON file.
        
        Args:
            job_id: Job identifier
        
        Returns:
            Transcript dictionary
        """
        file_path = os.path.join(self.output_dir, f"{job_id}.json")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Transcript not found for job: {job_id}")
        
        async with aiofiles.open(file_path, 'r') as f:
            content = await f.read()
        
        return json.loads(content)