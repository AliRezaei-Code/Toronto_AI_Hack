from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any


# ============================================================================
# Core Models
# ============================================================================

class Word(BaseModel):
    """A single word from the transcript with timing information."""
    word: str = Field(..., description="The transcribed word", example="Hello")
    start: float = Field(..., description="Start time in seconds (absolute, relative to stitched video)", example=0.0)
    end: float = Field(..., description="End time in seconds (absolute, relative to stitched video)", example=0.5)

    model_config = ConfigDict(json_schema_extra={
        "example": {"word": "Hello", "start": 0.0, "end": 0.5}
    })


class Segment(BaseModel):
    """A phrase/sentence segment detected from speech pauses, containing nested words."""
    text: str = Field(..., description="The segment text", example="Hello world")
    start: float = Field(..., description="Start time in seconds (absolute)", example=0.0)
    end: float = Field(..., description="End time in seconds (absolute)", example=2.5)
    words: List[Word] = Field(default_factory=list, description="Words contained in this segment")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "text": "Hello world",
            "start": 0.0,
            "end": 2.5,
            "words": [
                {"word": "Hello", "start": 0.0, "end": 0.5},
                {"word": "world", "start": 0.6, "end": 1.0}
            ]
        }
    })


class Clip(BaseModel):
    """A video clip containing segments with nested words."""
    clip_index: int = Field(..., description="Index of this clip in the original upload order", example=0)
    duration: float = Field(..., description="Original clip duration in seconds", example=15.2)
    start_offset: float = Field(..., description="Where this clip starts in the stitched video", example=0.0)
    segments: List[Segment] = Field(default_factory=list, description="Phrase segments in this clip")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "clip_index": 0,
            "duration": 15.2,
            "start_offset": 0.0,
            "segments": []
        }
    })


class Transcript(BaseModel):
    """Hierarchical transcript: Clips -> Segments -> Words."""
    text: Optional[str] = Field(None, description="Full transcript text", example="Hello world, this is a test video.")
    duration: Optional[float] = Field(None, description="Total duration in seconds", example=30.5)
    clips: List[Clip] = Field(default_factory=list, description="Clips containing segments with nested words")


class EditInstruction(BaseModel):
    """Instruction for video editing operations."""
    type: str = Field(..., description="Type: 'keep' or 'cut'", example="cut")
    start: float = Field(..., description="Start time in seconds", example=5.0)
    end: float = Field(..., description="End time in seconds", example=10.0)


# ============================================================================
# Request Models
# ============================================================================

class EditRequest(BaseModel):
    """Request to edit a video using natural language."""
    job_id: str = Field(..., description="The job ID returned from upload", example="550e8400-e29b-41d4-a716-446655440000")
    query: str = Field(..., description="Natural language edit instruction", example="Remove all umms and ahhs")


class AgentQueryRequest(BaseModel):
    """Request body for the agent query endpoint."""
    job_id: str = Field(..., description="The job ID returned from upload", example="550e8400-e29b-41d4-a716-446655440000")
    query: str = Field(..., description="Natural language edit instruction", example="Cut out the section where I talk about pricing")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "job_id": "550e8400-e29b-41d4-a716-446655440000",
            "query": "Remove all filler words like um and uh"
        }
    })


class TranscriptEditRequest(BaseModel):
    """Request to edit transcript text directly."""
    job_id: str = Field(..., description="The job ID returned from upload", example="550e8400-e29b-41d4-a716-446655440000")
    edited_text: str = Field(..., description="The edited transcript text", example="Hello world, this is a test video.")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "job_id": "550e8400-e29b-41d4-a716-446655440000",
            "edited_text": "Hello world, this is a test video without filler words."
        }
    })


# ============================================================================
# Response Models
# ============================================================================

class EditResponse(BaseModel):
    """Response after successfully editing a video."""
    video_url: str = Field(..., description="URL to stream the edited video", example="/api/video/550e8400-e29b-41d4-a716-446655440000")
    transcript: Transcript = Field(..., description="Updated transcript after edit")
    message: str = Field(..., description="Human-readable message about the edit", example="Successfully removed 3 filler words")


class UploadResponse(BaseModel):
    """Response after successfully uploading video clips."""
    job_id: str = Field(..., description="Unique identifier for tracking the job", example="550e8400-e29b-41d4-a716-446655440000")
    message: str = Field(..., description="Status message", example="Videos uploaded and processing started")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "job_id": "550e8400-e29b-41d4-a716-446655440000",
            "message": "Videos uploaded and processing started"
        }
    })


class JobStatus(BaseModel):
    """Current status of a processing job."""
    status: str = Field(..., description="Job status: 'processing', 'completed', or 'error'", example="completed")
    video_url: Optional[str] = Field(None, description="URL to stream the video (when completed)", example="/api/video/550e8400-e29b-41d4-a716-446655440000")
    transcript: Optional[Transcript] = Field(None, description="Transcript data (when completed)")
    creator_context: Optional[Dict[str, str]] = Field(None, description="Auto-detected creator context for smart merge")
    error: Optional[str] = Field(None, description="Error message if status is 'error'")
    warning: Optional[str] = Field(None, description="Warning message (e.g., transcription unavailable)")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Health status", example="healthy")

    model_config = ConfigDict(json_schema_extra={
        "example": {"status": "healthy"}
    })


class RootResponse(BaseModel):
    """Root endpoint response with API info."""
    message: str = Field(..., description="Welcome message", example="Video Editor Backend API")
    version: str = Field(..., description="API version", example="2.0.0")
    endpoints: Dict[str, str] = Field(..., description="Available endpoints")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "message": "Video Editor Backend API",
            "version": "2.0.0",
            "endpoints": {
                "upload": "/api/upload",
                "status": "/api/job/{job_id}/status",
                "video": "/api/video/{job_id}",
                "transcript": "/api/transcript/{job_id}",
                "query": "/api/agent/query",
                "recommendations": "/api/recommendations"
            }
        }
    })


class LimitsInfo(BaseModel):
    """Upload limits information."""
    max_file_size_mb: float = Field(..., description="Maximum file size in MB", example=500.0)
    max_duration_seconds: int = Field(..., description="Maximum video duration in seconds", example=300)
    recommended_duration_seconds: int = Field(..., description="Recommended video duration", example=60)
    min_clips: int = Field(..., description="Minimum number of clips", example=3)
    max_clips: int = Field(..., description="Maximum number of clips", example=5)


class RecommendationsResponse(BaseModel):
    """Upload recommendations and guidelines."""
    recommendations: List[str] = Field(..., description="List of recommendations for optimal uploads")
    limits: LimitsInfo = Field(..., description="Upload limits")
    supported_formats: List[str] = Field(..., description="Supported video formats", example=[".mp4", ".mov", ".avi"])

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "recommendations": [
                "Use MP4 format for best compatibility",
                "Keep videos under 60 seconds for optimal processing",
                "Ensure good audio quality for accurate transcription"
            ],
            "limits": {
                "max_file_size_mb": 500.0,
                "max_duration_seconds": 300,
                "recommended_duration_seconds": 60,
                "min_clips": 3,
                "max_clips": 5
            },
            "supported_formats": [".mp4", ".mov", ".avi", ".mkv", ".webm"]
        }
    })


class DeleteJobResponse(BaseModel):
    """Response after deleting a job."""
    message: str = Field(..., description="Confirmation message", example="Job 550e8400-e29b-41d4-a716-446655440000 deleted")

    model_config = ConfigDict(json_schema_extra={
        "example": {"message": "Job 550e8400-e29b-41d4-a716-446655440000 deleted"}
    })


class JobSummary(BaseModel):
    """Summary of a job for listing."""
    job_id: str = Field(..., description="Unique job identifier", example="550e8400-e29b-41d4-a716-446655440000")
    status: Optional[str] = Field(None, description="Job status", example="completed")
    created_at: Optional[str] = Field(None, description="ISO timestamp of creation", example="2024-01-15T10:30:00")


class ListJobsResponse(BaseModel):
    """Response for listing all jobs."""
    jobs: List[JobSummary] = Field(..., description="List of job summaries")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "jobs": [
                {"job_id": "550e8400-e29b-41d4-a716-446655440000", "status": "completed", "created_at": "2024-01-15T10:30:00"},
                {"job_id": "660e8400-e29b-41d4-a716-446655440001", "status": "processing", "created_at": "2024-01-15T10:25:00"}
            ]
        }
    })


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str = Field(..., description="Error description", example="Job not found")

    model_config = ConfigDict(json_schema_extra={
        "example": {"detail": "Job not found"}
    })


# ============================================================================
# Smart Merge Models
# ============================================================================

class CreatorContext(BaseModel):
    """Auto-detected creator context for smart content optimization."""
    industry: str = Field(..., description="Industry/niche", example="tech/saas")
    role: str = Field(..., description="Creator's role", example="software engineer")
    target_audience: str = Field(..., description="Target audience", example="entrepreneurs")
    tone: str = Field(..., description="Content tone", example="professional")
    suggested_hook_style: str = Field(..., description="Recommended hook style", example="results-driven")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "industry": "tech/saas",
            "role": "software engineer",
            "target_audience": "entrepreneurs",
            "tone": "professional",
            "suggested_hook_style": "results-driven"
        }
    })


class SmartMergeRequest(BaseModel):
    """Request to perform smart merge on a job's video."""
    job_id: str = Field(..., description="The job ID to smart merge", example="550e8400-e29b-41d4-a716-446655440000")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "job_id": "550e8400-e29b-41d4-a716-446655440000"
        }
    })


class SmartMergeSegment(BaseModel):
    """A segment in the smart merge result with clip reference."""
    clip_index: int = Field(..., description="Index of source clip", example=0)
    start: float = Field(..., description="Start time in seconds (local to clip)", example=1.5)
    end: float = Field(..., description="End time in seconds (local to clip)", example=5.2)
    label: str = Field(..., description="Segment label/purpose", example="hook")


class SmartMergeResponse(BaseModel):
    """Response after smart merge completes."""
    video_url: str = Field(..., description="URL to the smart-merged video", example="/api/video/550e8400-e29b-41d4-a716-446655440000")
    transcript: Transcript = Field(..., description="Updated transcript after smart merge")
    creator_context: CreatorContext = Field(..., description="Detected creator context used for optimization")
    reasoning: str = Field(..., description="LLM reasoning for the merge decisions", example="Hook uses strong numbers to grab attention")
    segments_used: List[SmartMergeSegment] = Field(..., description="Segments included in order")
    estimated_duration: float = Field(..., description="Estimated final video duration", example=32.5)
    message: str = Field(..., description="Human-readable result message", example="Smart merge complete: 5 segments reordered with hook first")


# ============================================================================
# Internal/Agent State Models
# ============================================================================

class AgentState(BaseModel):
    """Internal state for the AI editing agent."""
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
    """Word-level edit instruction."""
    type: str = Field(..., description="Type: 'delete' or 'keep'")
    word_indices: List[int] = Field(default_factory=list)


class TimeRangeAnalysis(BaseModel):
    """Analysis result with time ranges to delete."""
    description: str = Field(..., description="Description of the analysis")
    time_ranges_to_delete: List[tuple[float, float]] = Field(default_factory=list)
    reason: str = Field(..., description="Reason for the edit")