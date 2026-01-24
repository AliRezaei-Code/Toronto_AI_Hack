from pydantic import BaseModel, Field
from typing import List, Optional

class Word(BaseModel):
    word: str
    start: float
    end: float

class Transcript(BaseModel):
    text: Optional[str] = None
    words: List[Word] = []
    duration: Optional[float] = None

class EditInstruction(BaseModel):
    type: str = Field(..., description="Type: 'keep' or 'cut'")
    start: float
    end: float

class EditRequest(BaseModel):
    job_id: str
    query: str

class EditResponse(BaseModel):
    video_url: str
    transcript: Transcript
    message: str

class UploadResponse(BaseModel):
    job_id: str
    message: str

class JobStatus(BaseModel):
    status: str = Field(..., description="processing, completed, or error")
    video_url: Optional[str] = None
    transcript: Optional[Transcript] = None
    error: Optional[str] = None

class AgentState(BaseModel):
    job_id: str
    current_transcript: Optional[List[Word]] = None
    current_video_path: Optional[str] = None
    user_query: str = ""
    edit_intent: Optional[str] = None
    time_ranges_to_delete: List[tuple[float, float]] = []
    edit_instructions: List[EditInstruction] = []
    result_video_path: Optional[str] = None
    result_transcript: Optional[List[Word]] = None
    message: str = ""

class WordEdit(BaseModel):
    type: str = Field(..., description="Type: 'delete' or 'keep'")
    word_indices: List[int] = Field(default_factory=list)

class TimeRangeAnalysis(BaseModel):
    description: str
    time_ranges_to_delete: List[tuple[float, float]] = Field(default_factory=list)
    reason: str