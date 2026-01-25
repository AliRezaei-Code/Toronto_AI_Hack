"""AI Director Models Package"""

from app.models.core_models import (
    # Core Models
    Word,
    Segment,
    Clip,
    Transcript,
    EditInstruction,
    # Request Models
    EditRequest,
    AgentQueryRequest,
    TranscriptEditRequest,
    # Response Models
    EditResponse,
    UploadResponse,
    JobStatus,
    HealthResponse,
    RootResponse,
    LimitsInfo,
    RecommendationsResponse,
    DeleteJobResponse,
    JobSummary,
    ListJobsResponse,
    ErrorResponse,
    # Smart Merge Models
    CreatorContext,
    SmartMergeRequest,
    SmartMergeSegment,
    SmartMergeResponse,
    # Internal Models
    AgentState,
    WordEdit,
    TimeRangeAnalysis,
)

from app.models.director_models import (
    # Enums
    HookType,
    LayoutType,
    CaptionStyle,
    Platform,
    DirectorJobStatus,
    # Diarization
    DiarizedWord,
    DiarizationSegment,
    DiarizationResult,
    # Viral Clips
    ViralClip,
    ViralClipSelection,
    # Face Tracking
    FaceCoordinate,
    FaceTrackingData,
    CropWindow,
    # Layout
    LayoutFrame,
    LayoutTimeline,
    # LiveKit
    LiveKitTrack,
    SynchronizedTrack,
    LiveKitSession,
    # Edit Decision List
    JumpCutEdit,
    KeepRange,
    EditDecisionList,
    # Remotion
    RemotionInputProps,
    # Jobs
    DirectorJob,
    # API Models
    DirectorUploadRequest,
    DirectorStatusResponse,
    SelectClipsRequest,
    SelectClipsResponse,
    RenderShortRequest,
    RenderShortResponse,
)

__all__ = [
    # Core Models
    "Word",
    "Segment",
    "Clip",
    "Transcript",
    "EditInstruction",
    # Request Models
    "EditRequest",
    "AgentQueryRequest",
    "TranscriptEditRequest",
    # Response Models
    "EditResponse",
    "UploadResponse",
    "JobStatus",
    "HealthResponse",
    "RootResponse",
    "LimitsInfo",
    "RecommendationsResponse",
    "DeleteJobResponse",
    "JobSummary",
    "ListJobsResponse",
    "ErrorResponse",
    # Smart Merge Models
    "CreatorContext",
    "SmartMergeRequest",
    "SmartMergeSegment",
    "SmartMergeResponse",
    # Internal Models
    "AgentState",
    "WordEdit",
    "TimeRangeAnalysis",
    # Enums
    "HookType",
    "LayoutType",
    "CaptionStyle",
    "Platform",
    "DirectorJobStatus",
    # Diarization
    "DiarizedWord",
    "DiarizationSegment",
    "DiarizationResult",
    # Viral Clips
    "ViralClip",
    "ViralClipSelection",
    # Face Tracking
    "FaceCoordinate",
    "FaceTrackingData",
    "CropWindow",
    # Layout
    "LayoutFrame",
    "LayoutTimeline",
    # LiveKit
    "LiveKitTrack",
    "SynchronizedTrack",
    "LiveKitSession",
    # Edit Decision List
    "JumpCutEdit",
    "KeepRange",
    "EditDecisionList",
    # Remotion
    "RemotionInputProps",
    # Jobs
    "DirectorJob",
    # API Models
    "DirectorUploadRequest",
    "DirectorStatusResponse",
    "SelectClipsRequest",
    "SelectClipsResponse",
    "RenderShortRequest",
    "RenderShortResponse",
]
