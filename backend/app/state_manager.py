import os
import json
import asyncio
from typing import Dict, List, Optional, Any
from pathlib import Path
import aiofiles

from app.models import AgentState, Transcript, Word, Segment, Clip, EditInstruction, CreatorContext

class StateManager:
    """
    Manages ephemeral state stored in JSON files.
    """
    
    def __init__(self, state_dir: str):
        self.state_dir = Path(state_dir)
        self.state_dir.mkdir(parents=True, exist_ok=True)
    
    async def save_agent_state(self, job_id: str, state: AgentState) -> None:
        """
        Save agent state to JSON file.
        """
        state_file = self.state_dir / f"{job_id}_state.json"
        state_dict = state.model_dump()
        
        async with aiofiles.open(state_file, 'w') as f:
            await f.write(json.dumps(state_dict, indent=2))
    
    async def load_agent_state(self, job_id: str) -> Optional[AgentState]:
        """
        Load agent state from JSON file.
        """
        state_file = self.state_dir / f"{job_id}_state.json"
        
        if not state_file.exists():
            return None
        
        async with aiofiles.open(state_file, 'r') as f:
            content = await f.read()
        
        state_dict = json.loads(content)
        return AgentState(**state_dict)
    
    async def save_transcript(self, job_id: str, transcript: Transcript) -> None:
        """
        Save hierarchical transcript to JSON file.
        Structure: Transcript -> Clips -> Segments -> Words
        """
        transcript_file = self.state_dir / f"{job_id}_transcript.json"
        
        # Build hierarchical dict structure
        clips_data = []
        for clip in transcript.clips:
            segments_data = []
            for segment in clip.segments:
                segments_data.append({
                    'text': segment.text,
                    'start': segment.start,
                    'end': segment.end,
                    'words': [w.model_dump() for w in segment.words]
                })
            clips_data.append({
                'clip_index': clip.clip_index,
                'duration': clip.duration,
                'start_offset': clip.start_offset,
                'segments': segments_data
            })
        
        transcript_dict = {
            'text': transcript.text,
            'duration': transcript.duration,
            'clips': clips_data
        }
        
        async with aiofiles.open(transcript_file, 'w') as f:
            await f.write(json.dumps(transcript_dict, indent=2))
    
    async def load_transcript(self, job_id: str) -> Optional[Transcript]:
        """
        Load hierarchical transcript from JSON file.
        Structure: Transcript -> Clips -> Segments -> Words
        """
        print("Loading transcript for job_id:", job_id)
        transcript_file = self.state_dir / f"{job_id}_transcript.json"
        print("Transcript file path:", transcript_file.absolute())
        if not transcript_file.exists():
            return None
        
        async with aiofiles.open(transcript_file, 'r') as f:
            content = await f.read()
        
        data = json.loads(content)
        
        # Build hierarchical Pydantic models
        clips = []
        for clip_data in data.get('clips', []):
            segments = []
            for seg_data in clip_data.get('segments', []):
                segments.append(Segment(
                    text=seg_data['text'],
                    start=seg_data['start'],
                    end=seg_data['end'],
                    words=[Word(**w) for w in seg_data.get('words', [])]
                ))
            clips.append(Clip(
                clip_index=clip_data['clip_index'],
                duration=clip_data['duration'],
                start_offset=clip_data['start_offset'],
                segments=segments
            ))
        
        return Transcript(
            text=data.get('text'),
            duration=data.get('duration'),
            clips=clips
        )
    
    async def save_context(self, job_id: str, context: CreatorContext) -> None:
        """
        Save creator context to JSON file.
        """
        context_file = self.state_dir / f"{job_id}_context.json"
        
        async with aiofiles.open(context_file, 'w') as f:
            await f.write(json.dumps(context.model_dump(), indent=2))
    
    async def load_context(self, job_id: str) -> Optional[CreatorContext]:
        """
        Load creator context from JSON file.
        """
        context_file = self.state_dir / f"{job_id}_context.json"
        print("Loading context from:", context_file.absolute())
        if not context_file.exists():
            return None
        
        async with aiofiles.open(context_file, 'r') as f:
            content = await f.read()
        
        data = json.loads(content)
        return CreatorContext(**data)
    
    async def save_job(self, job_id: str, job_data: Dict[str, Any]) -> None:
        """
        Save job metadata to JSON file.
        """
        job_file = self.state_dir / f"{job_id}_job.json"
        
        async with aiofiles.open(job_file, 'w') as f:
            await f.write(json.dumps(job_data, indent=2))
    
    async def load_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Load job metadata from JSON file.
        """
        job_file = self.state_dir / f"{job_id}_job.json"
        
        if not job_file.exists():
            return None
        
        async with aiofiles.open(job_file, 'r') as f:
            content = await f.read()
        
        return json.loads(content)
    
    async def list_jobs(self) -> List[str]:
        """
        List all job IDs.
        """
        job_files = list(self.state_dir.glob('*_job.json'))
        return [f.stem.replace('_job', '') for f in job_files]
    
    async def delete_job(self, job_id: str) -> None:
        """
        Delete all files associated with a job.
        """
        for suffix in ['_state.json', '_transcript.json', '_job.json', '_context.json']:
            file_path = self.state_dir / f"{job_id}{suffix}"
            if file_path.exists():
                file_path.unlink()