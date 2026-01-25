"""
AI Director Models - Data models for the autonomous video repurposing pipeline.

These models support:
- Viral clip selection and scoring
- Face tracking and smart cropping
- Speaker diarization
- LiveKit multi-track synchronization
- Layout timeline for dynamic compositions
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================================================
# Enums
# ============================================================================


class HookType(str, Enum):
    """Types of hooks for viral content"""

    QUESTION = "question"
    SHOCK = "shock"
    STORY = "story"
    RESULT = "result"
    CONTROVERSY = "controversy"
    PROMISE = "promise"


class LayoutType(str, Enum):
    """Layout types for multi-speaker compositions"""

    SINGLE_SPEAKER = "single_speaker"
    SPLIT_SCREEN = "split_screen"
    REACTION_SHOT = "reaction_shot"
    PICTURE_IN_PICTURE = "pip"


class CaptionStyle(str, Enum):
    """Caption styling presets"""

    HORMOZI = "hormozi"
    MRBEAST = "mrbeast"
    MINIMAL = "minimal"
    CLASSIC = "classic"


class Platform(str, Enum):
    """Target social media platforms"""

    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"


# ============================================================================
# Diarization Models
# ============================================================================


class DiarizedWord(BaseModel):
    """A word with speaker identification from Deepgram"""

    word: str = Field(..., description="The transcribed word")
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    confidence: float = Field(default=1.0, description="Confidence score 0-1")
    speaker_id: Optional[int] = Field(
        None, description="Speaker identifier (0, 1, 2...)"
    )
    is_filler: bool = Field(
        default=False, description="Whether this is a filler word (um, uh, etc.)"
    )
    punctuated_word: Optional[str] = Field(None, description="Word with punctuation")


class DiarizationSegment(BaseModel):
    """A continuous segment from a single speaker"""

    speaker_id: int = Field(..., description="Speaker identifier")
    start: float = Field(..., description="Segment start time in seconds")
    end: float = Field(..., description="Segment end time in seconds")
    confidence: float = Field(default=1.0, description="Confidence score")
    text: str = Field(..., description="Full text of the segment")
    words: List[DiarizedWord] = Field(
        default_factory=list, description="Words in this segment"
    )


class DiarizationResult(BaseModel):
    """Complete diarization result for a video"""

    job_id: str = Field(..., description="Associated job ID")
    total_speakers: int = Field(..., description="Number of detected speakers")
    segments: List[DiarizationSegment] = Field(default_factory=list)
    words: List[DiarizedWord] = Field(
        default_factory=list, description="All words with speaker IDs"
    )
    filler_words: List[DiarizedWord] = Field(
        default_factory=list, description="Detected filler words"
    )
    duration: float = Field(..., description="Total audio duration in seconds")


# ============================================================================
# Viral Clip Selection Models
# ============================================================================


class ViralClip(BaseModel):
    """An AI-selected viral clip segment with scoring"""

    id: str = Field(..., description="Unique clip identifier")
    job_id: str = Field(..., description="Parent job ID")
    start_time: float = Field(..., description="Start time in seconds")
    end_time: float = Field(..., description="End time in seconds")
    duration: float = Field(..., description="Clip duration in seconds")
    virality_score: float = Field(..., ge=0, le=100, description="Virality score 0-100")
    hook_type: HookType = Field(..., description="Type of hook used")
    hook_strength: float = Field(
        ..., ge=0, le=100, description="How strong the opening hook is"
    )
    suggested_titles: List[str] = Field(
        default_factory=list, description="3 title variations"
    )
    emphasis_words: List[str] = Field(
        default_factory=list, description="Words to highlight in captions"
    )
    summary: str = Field(..., description="Brief summary of the clip content")
    speakers: List[int] = Field(
        default_factory=list, description="Speaker IDs appearing in clip"
    )
    transcript_text: str = Field(..., description="Full transcript text of the clip")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class ViralClipSelection(BaseModel):
    """Result of viral clip selection for a job"""

    job_id: str
    clips: List[ViralClip] = Field(default_factory=list)
    total_analyzed_duration: float = Field(..., description="Total duration analyzed")
    selection_reasoning: str = Field(..., description="LLM reasoning for selections")
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Face Tracking Models
# ============================================================================


class FaceCoordinate(BaseModel):
    """Normalized face bounding box for one frame"""

    frame: int = Field(..., description="Frame number")
    timestamp: float = Field(..., description="Timestamp in seconds")
    face_id: int = Field(
        default=0, description="Face identifier (0 or 1 for speaker 0/1)"
    )
    x: float = Field(..., ge=0, le=1, description="X coordinate (normalized 0-1)")
    y: float = Field(..., ge=0, le=1, description="Y coordinate (normalized 0-1)")
    width: float = Field(..., ge=0, le=1, description="Width (normalized 0-1)")
    height: float = Field(..., ge=0, le=1, description="Height (normalized 0-1)")
    confidence: float = Field(
        default=1.0, ge=0, le=1, description="Detection confidence"
    )


class FaceTrackingData(BaseModel):
    """Complete face tracking data for a video"""

    job_id: str = Field(..., description="Associated job ID")
    video_path: str = Field(..., description="Path to source video")
    fps: float = Field(..., description="Video frames per second")
    total_frames: int = Field(..., description="Total frame count")
    width: int = Field(..., description="Video width in pixels")
    height: int = Field(..., description="Video height in pixels")
    coordinates: List[FaceCoordinate] = Field(default_factory=list)
    smoothed: bool = Field(default=False, description="Whether smoothing was applied")


class CropWindow(BaseModel):
    """Calculated crop coordinates for SmartCrop component"""

    x: float = Field(..., description="X offset in source pixels")
    y: float = Field(..., description="Y offset in source pixels")
    width: float = Field(..., description="Crop width in source pixels")
    height: float = Field(..., description="Crop height in source pixels")
    scale: float = Field(default=1.0, description="Scale factor to apply")


# ============================================================================
# Layout Timeline Models
# ============================================================================


class LayoutFrame(BaseModel):
    """Layout decision for a single frame"""

    frame: int = Field(..., description="Frame number")
    timestamp: float = Field(..., description="Timestamp in seconds")
    layout_type: LayoutType = Field(..., description="Which layout to use")
    active_speaker: int = Field(..., description="Currently speaking person")
    visible_speakers: List[int] = Field(
        default_factory=list, description="Speakers to show"
    )
    crop_windows: Dict[int, CropWindow] = Field(
        default_factory=dict, description="Crop per speaker"
    )


class LayoutTimeline(BaseModel):
    """Frame-by-frame layout decisions for a clip"""

    job_id: str
    clip_id: str
    fps: float = Field(default=30.0)
    total_frames: int
    layouts: List[LayoutFrame] = Field(default_factory=list)


# ============================================================================
# LiveKit Multi-Track Models
# ============================================================================


class LiveKitTrack(BaseModel):
    """Individual participant track from LiveKit egress"""

    participant_id: str = Field(..., description="Unique participant ID")
    participant_name: str = Field(..., description="Display name")
    video_path: str = Field(..., description="Path to video file")
    audio_path: Optional[str] = Field(
        None, description="Path to separate audio (if available)"
    )
    start_offset_ms: int = Field(..., description="Milliseconds from room start")
    duration_ms: int = Field(..., description="Track duration in milliseconds")
    started_at: int = Field(..., description="Unix timestamp in nanoseconds")
    speaker_id: Optional[int] = Field(
        None, description="Mapped speaker ID from diarization"
    )


class SynchronizedTrack(BaseModel):
    """Track aligned to global timeline for Remotion"""

    participant_id: str
    video_path: str
    offset_frames: int = Field(..., description="Frame offset for Remotion Sequence")
    duration_frames: int = Field(..., description="Duration in frames")
    speaker_id: int = Field(..., description="Mapped speaker ID")


class LiveKitSession(BaseModel):
    """Complete LiveKit recording session"""

    room_name: str
    job_id: str
    tracks: List[LiveKitTrack] = Field(default_factory=list)
    synchronized_tracks: List[SynchronizedTrack] = Field(default_factory=list)
    total_duration_ms: int
    started_at: datetime
    ended_at: Optional[datetime] = None


# ============================================================================
# Jump-Cut / Edit Decision List Models
# ============================================================================


class JumpCutEdit(BaseModel):
    """A single jump-cut edit (removal of filler/silence)"""

    start: float = Field(..., description="Start of content to REMOVE")
    end: float = Field(..., description="End of content to REMOVE")
    reason: str = Field(..., description="Why this was cut (filler, silence, etc.)")


class KeepRange(BaseModel):
    """A range of content to KEEP after jump-cutting"""

    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    clip_index: Optional[int] = Field(
        None, description="Source clip index if multi-clip"
    )


class EditDecisionList(BaseModel):
    """Complete edit decision list for jump-cut processing"""

    job_id: str
    clip_id: Optional[str] = None
    original_duration: float
    keep_ranges: List[KeepRange] = Field(default_factory=list)
    cuts: List[JumpCutEdit] = Field(default_factory=list)
    final_duration: float = Field(..., description="Duration after cuts")
    time_saved: float = Field(..., description="How much time was cut")


# ============================================================================
# Remotion Composition Models
# ============================================================================


class RemotionInputProps(BaseModel):
    """Input props for Remotion AI Director composition"""

    job_id: str
    clip_id: str
    video_sources: List[str] = Field(
        default_factory=list, description="Video file URLs/paths"
    )
    transcript: Dict[str, Any] = Field(default_factory=dict)
    diarization: Optional[DiarizationResult] = None
    face_tracking: Optional[FaceTrackingData] = None
    viral_clip: Optional[ViralClip] = None
    edit_decision_list: Optional[EditDecisionList] = None
    layout_timeline: Optional[LayoutTimeline] = None
    caption_style: CaptionStyle = Field(default=CaptionStyle.HORMOZI)
    platform: Platform = Field(default=Platform.TIKTOK)
    include_captions: bool = Field(default=True)
    music_url: Optional[str] = None
    music_volume: float = Field(default=0.1, ge=0, le=1)


# ============================================================================
# AI Director Job Models
# ============================================================================


class DirectorJobStatus(str, Enum):
    """Status of an AI Director job"""

    QUEUED = "queued"
    TRANSCRIBING = "transcribing"
    DIARIZING = "diarizing"
    SELECTING_CLIPS = "selecting_clips"
    TRACKING_FACES = "tracking_faces"
    GENERATING_LAYOUT = "generating_layout"
    RENDERING = "rendering"
    COMPLETED = "completed"
    FAILED = "failed"


class DirectorJob(BaseModel):
    """AI Director processing job"""

    job_id: str
    status: DirectorJobStatus = Field(default=DirectorJobStatus.QUEUED)
    job_type: Literal["upload", "livekit"] = Field(default="upload")

    # Input data
    input_videos: List[str] = Field(default_factory=list)
    livekit_session: Optional[LiveKitSession] = None

    # Processing results
    diarization_result: Optional[DiarizationResult] = None
    viral_clips: List[ViralClip] = Field(default_factory=list)
    face_tracking_data: Optional[FaceTrackingData] = None

    # Status flags
    transcription_complete: bool = Field(default=False)
    diarization_complete: bool = Field(default=False)
    clip_selection_complete: bool = Field(default=False)
    face_tracking_complete: bool = Field(default=False)
    remotion_compositions_generated: bool = Field(default=False)

    # Output
    shorts_rendered: List[str] = Field(
        default_factory=list, description="S3/local URLs to rendered shorts"
    )

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    progress_percent: float = Field(default=0.0, ge=0, le=100)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


# ============================================================================
# Request/Response Models for API
# ============================================================================


class DirectorUploadRequest(BaseModel):
    """Request to process videos through AI Director"""

    include_captions: bool = Field(default=True)
    caption_style: CaptionStyle = Field(default=CaptionStyle.HORMOZI)
    target_platform: Platform = Field(default=Platform.TIKTOK)
    max_clips: int = Field(
        default=5, ge=1, le=10, description="Max viral clips to generate"
    )
    min_clip_duration: float = Field(
        default=30.0, description="Minimum clip duration in seconds"
    )
    max_clip_duration: float = Field(
        default=90.0, description="Maximum clip duration in seconds"
    )
    remove_fillers: bool = Field(default=True, description="Auto-remove um/uh/silence")
    enable_face_tracking: bool = Field(default=True)


class DirectorStatusResponse(BaseModel):
    """Status response for AI Director job"""

    job_id: str
    status: DirectorJobStatus
    progress_percent: float
    current_step: str
    viral_clips_found: int = Field(default=0)
    shorts_rendered: int = Field(default=0)
    estimated_time_remaining: Optional[int] = Field(
        None, description="Seconds remaining"
    )
    error: Optional[str] = None


class SelectClipsRequest(BaseModel):
    """Request to select viral clips from a job"""

    job_id: str
    max_clips: int = Field(default=5, ge=1, le=10)
    min_duration: float = Field(default=30.0)
    max_duration: float = Field(default=90.0)
    hook_types: Optional[List[HookType]] = Field(
        None, description="Filter by hook types"
    )


class SelectClipsResponse(BaseModel):
    """Response containing selected viral clips"""

    job_id: str
    clips: List[ViralClip]
    selection_reasoning: str
    total_duration_analyzed: float


class RenderShortRequest(BaseModel):
    """Request to render a single viral short"""

    job_id: str
    clip_id: str
    caption_style: CaptionStyle = Field(default=CaptionStyle.HORMOZI)
    platform: Platform = Field(default=Platform.TIKTOK)
    include_captions: bool = Field(default=True)
    output_format: Literal["mp4", "webm"] = Field(default="mp4")


class RenderShortResponse(BaseModel):
    """Response after rendering a short"""

    job_id: str
    clip_id: str
    video_url: str
    duration: float
    render_time_seconds: float
