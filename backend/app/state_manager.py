import os
import json
import asyncio
from typing import Dict, List, Optional, Any
from pathlib import Path
import aiofiles

from app.models import AgentState, Transcript, Word, EditInstruction

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
        Save transcript to JSON file.
        """
        transcript_file = self.state_dir / f"{job_id}_transcript.json"
        
        transcript_dict = {
            'text': transcript.text,
            'words': [w.model_dump() for w in transcript.words],
            'duration': transcript.duration
        }
        
        async with aiofiles.open(transcript_file, 'w') as f:
            await f.write(json.dumps(transcript_dict, indent=2))
    
    async def load_transcript(self, job_id: str) -> Optional[Transcript]:
        """
        Load transcript from JSON file.
        """
        transcript_file = self.state_dir / f"{job_id}_transcript.json"
        
        if not transcript_file.exists():
            return None
        
        async with aiofiles.open(transcript_file, 'r') as f:
            content = await f.read()
        
        data = json.loads(content)
        
        return Transcript(
            text=data.get('text'),
            words=[Word(**w) for w in data.get('words', [])],
            duration=data.get('duration')
        )
    
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
        for suffix in ['_state.json', '_transcript.json', '_job.json']:
            file_path = self.state_dir / f"{job_id}{suffix}"
            if file_path.exists():
                file_path.unlink()