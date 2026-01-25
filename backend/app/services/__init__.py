"""AI Director Services Package"""

from app.services.deepgram_service import (
    DeepgramService,
    WhisperFallbackService,
    get_transcription_service,
    transcribe_with_diarization,
)

from app.services.viral_clip_selector import (
    ViralClipSelector,
    select_viral_clips,
)

from app.services.jump_cut_processor import (
    JumpCutProcessor,
    get_zoom_cut_points,
    create_jump_cut_edl,
)

from app.services.remotion_composer import (
    RemotionComposer,
    get_composer,
)

from app.services.livekit_service import (
    LiveKitService,
    TrackSynchronizer,
    get_livekit_service,
    get_track_synchronizer,
)

__all__ = [
    # Deepgram
    "DeepgramService",
    "WhisperFallbackService",
    "get_transcription_service",
    "transcribe_with_diarization",
    # Viral Clip Selector
    "ViralClipSelector",
    "select_viral_clips",
    # Jump-Cut Processor
    "JumpCutProcessor",
    "get_zoom_cut_points",
    "create_jump_cut_edl",
    # Remotion Composer
    "RemotionComposer",
    "get_composer",
    # LiveKit
    "LiveKitService",
    "TrackSynchronizer",
    "get_livekit_service",
    "get_track_synchronizer",
]
