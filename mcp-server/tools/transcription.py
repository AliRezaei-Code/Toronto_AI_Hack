import os
import json
import asyncio
from typing import Dict, List, Any
from openai import AsyncOpenAI
import aiofiles

class TranscriptionTool:
    def __init__(self, openai_api_key: str, output_dir: str):
        self.client = AsyncOpenAI(api_key=openai_api_key)
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    async def generate_transcript(self, video_path: str) -> Dict[str, Any]:
        """
        Generate transcript with timestamps using OpenAI Whisper API.
        
        Args:
            video_path: Path to the video file
        
        Returns:
            Dictionary with words array including timestamps
        """
        try:
            audio_file = open(video_path, 'rb')
            
            transcript = await self.client.audio.transcriptions.create(
                file=audio_file,
                model='whisper-1',
                response_format='verbose_json',
                timestamp_granularities=['word']
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
                'text': transcript.text,
                'words': words,
                'duration': transcript.duration
            }
            
            audio_file.close()
            
            return result
            
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")

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