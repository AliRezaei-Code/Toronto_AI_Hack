import os
import json
import asyncio
import logging
from typing import Dict, List, Any
from openai import AsyncOpenAI, APIError, APIConnectionError, RateLimitError
import aiofiles

logger = logging.getLogger(__name__)

class TranscriptionTool:
    def __init__(self, openai_api_key: str, output_dir: str, timeout: int = 180):
        self.client = AsyncOpenAI(
            api_key=openai_api_key,
            timeout=timeout
        )
        self.output_dir = output_dir
        self.timeout = timeout
        os.makedirs(self.output_dir, exist_ok=True)

    async def generate_transcript(self, video_path: str) -> Dict[str, Any]:
        """
        Generate transcript with timestamps using OpenAI Whisper API.
        
        Includes retry logic for transient failures and timeout handling.
        
        Args:
            video_path: Path to the video file
        
        Returns:
            Dictionary with words array including timestamps
        """
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                with open(video_path, 'rb') as audio_file:
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