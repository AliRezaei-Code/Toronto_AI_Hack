"""
LiveKit Service - Manages LiveKit room recordings for AI Director.

This service handles:
- Creating and managing LiveKit rooms for podcast/interview recording
- Starting/stopping Track Composite Egress for recording
- Retrieving individual participant tracks after recording
- Synchronizing multi-track recordings for Remotion processing
"""

import os
import time
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
import httpx

try:
    from livekit import api, rtc

    LIVEKIT_AVAILABLE = True
except ImportError:
    LIVEKIT_AVAILABLE = False

from ..models.director_models import (
    LiveKitTrack,
    LiveKitSession,
    SynchronizedTrack,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LiveKitService:
    """
    LiveKit integration service for multi-participant recording.

    Supports:
    - Room creation with auto-recording via Egress
    - Track Composite Egress for high-quality individual tracks
    - Room Composite Egress as fallback
    - Automatic track synchronization for Remotion
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        host: Optional[str] = None,
    ):
        """
        Initialize LiveKit service.

        Args:
            api_key: LiveKit API key (or LIVEKIT_API_KEY env var)
            api_secret: LiveKit API secret (or LIVEKIT_API_SECRET env var)
            host: LiveKit server URL (or LIVEKIT_HOST env var)
        """
        self.api_key = api_key or os.getenv("LIVEKIT_API_KEY")
        self.api_secret = api_secret or os.getenv("LIVEKIT_API_SECRET")
        self.host = host or os.getenv("LIVEKIT_HOST", "wss://localhost:7880")

        if not LIVEKIT_AVAILABLE:
            logger.warning(
                "LiveKit SDK not installed. Install with: pip install livekit"
            )
            self._livekit_api = None
        elif self.api_key and self.api_secret:
            self._livekit_api = api.LiveKitAPI(
                url=self.host.replace("wss://", "https://").replace("ws://", "http://"),
                api_key=self.api_key,
                api_secret=self.api_secret,
            )
        else:
            logger.warning("LiveKit credentials not configured")
            self._livekit_api = None

        # Track active sessions
        self._active_sessions: Dict[str, LiveKitSession] = {}
        self._active_egress: Dict[str, str] = {}  # room_name -> egress_id

    @property
    def is_configured(self) -> bool:
        """Check if LiveKit is properly configured."""
        return self._livekit_api is not None

    async def create_room(
        self,
        room_name: str,
        empty_timeout: int = 300,  # 5 minutes
        max_participants: int = 10,
        metadata: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a new LiveKit room for recording.

        Returns room info including connection details.
        """
        if not self.is_configured:
            raise RuntimeError("LiveKit not configured")

        try:
            room = await self._livekit_api.room.create_room(
                api.CreateRoomRequest(
                    name=room_name,
                    empty_timeout=empty_timeout,
                    max_participants=max_participants,
                    metadata=metadata,
                )
            )

            logger.info(f"Created LiveKit room: {room_name}")

            return {
                "room_name": room.name,
                "sid": room.sid,
                "created_at": datetime.utcnow().isoformat(),
                "max_participants": max_participants,
            }

        except Exception as e:
            logger.error(f"Failed to create room: {e}")
            raise

    async def create_access_token(
        self,
        room_name: str,
        participant_name: str,
        participant_identity: Optional[str] = None,
        can_publish: bool = True,
        can_subscribe: bool = True,
        ttl_seconds: int = 3600,
    ) -> str:
        """
        Create an access token for a participant to join a room.

        Returns JWT token string.
        """
        if not self.api_key or not self.api_secret:
            raise RuntimeError("LiveKit credentials not configured")

        identity = participant_identity or participant_name

        token = api.AccessToken(
            api_key=self.api_key,
            api_secret=self.api_secret,
        )

        token.with_identity(identity)
        token.with_name(participant_name)
        token.with_ttl(ttl_seconds)

        # Grant permissions
        grant = api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=can_publish,
            can_subscribe=can_subscribe,
            can_publish_data=True,
        )
        token.with_grants(grant)

        return token.to_jwt()

    async def start_recording(
        self,
        room_name: str,
        job_id: str,
        output_prefix: str = "",
        use_track_composite: bool = True,
    ) -> Dict[str, Any]:
        """
        Start recording a LiveKit room.

        Uses Track Composite Egress by default for individual speaker tracks,
        falls back to Room Composite for combined output.

        Returns egress info including egress_id.
        """
        if not self.is_configured:
            raise RuntimeError("LiveKit not configured")

        if not output_prefix:
            output_prefix = f"recordings/{job_id}/{room_name}"

        try:
            if use_track_composite:
                # Track Composite: Records each participant's track separately
                # Best for multi-speaker editing
                egress_info = (
                    await self._livekit_api.egress.start_track_composite_egress(
                        api.TrackCompositeEgressRequest(
                            room_name=room_name,
                            file=api.EncodedFileOutput(
                                file_type=api.EncodedFileType.MP4,
                                filepath=f"{output_prefix}/{{track_id}}.mp4",
                            ),
                            audio_track_id="",  # Record all audio tracks
                            video_track_id="",  # Record all video tracks
                        )
                    )
                )
            else:
                # Room Composite: Records everything as single video
                egress_info = (
                    await self._livekit_api.egress.start_room_composite_egress(
                        api.RoomCompositeEgressRequest(
                            room_name=room_name,
                            file=api.EncodedFileOutput(
                                file_type=api.EncodedFileType.MP4,
                                filepath=f"{output_prefix}/composite.mp4",
                            ),
                            layout="speaker",  # Focus on active speaker
                        )
                    )
                )

            egress_id = egress_info.egress_id
            self._active_egress[room_name] = egress_id

            # Initialize session tracking
            self._active_sessions[room_name] = LiveKitSession(
                room_name=room_name,
                job_id=job_id,
                tracks=[],
                synchronized_tracks=[],
                total_duration_ms=0,
                started_at=datetime.utcnow(),
            )

            logger.info(f"Started recording for room {room_name}: {egress_id}")

            return {
                "egress_id": egress_id,
                "room_name": room_name,
                "job_id": job_id,
                "status": "recording",
                "started_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Failed to start recording: {e}")
            raise

    async def stop_recording(
        self,
        room_name: str,
    ) -> Dict[str, Any]:
        """
        Stop recording a LiveKit room.

        Returns final egress info with output file locations.
        """
        if not self.is_configured:
            raise RuntimeError("LiveKit not configured")

        egress_id = self._active_egress.get(room_name)
        if not egress_id:
            raise ValueError(f"No active recording for room: {room_name}")

        try:
            egress_info = await self._livekit_api.egress.stop_egress(
                api.StopEgressRequest(egress_id=egress_id)
            )

            # Update session
            if room_name in self._active_sessions:
                session = self._active_sessions[room_name]
                session.ended_at = datetime.utcnow()
                if session.started_at:
                    session.total_duration_ms = int(
                        (session.ended_at - session.started_at).total_seconds() * 1000
                    )

            del self._active_egress[room_name]

            logger.info(f"Stopped recording for room {room_name}")

            # Extract file outputs
            outputs = []
            if hasattr(egress_info, "file") and egress_info.file:
                outputs.append(
                    {
                        "type": "file",
                        "path": egress_info.file.filename,
                        "size": egress_info.file.size,
                        "duration": egress_info.file.duration,
                    }
                )

            return {
                "egress_id": egress_id,
                "room_name": room_name,
                "status": "completed",
                "outputs": outputs,
                "ended_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Failed to stop recording: {e}")
            raise

    async def get_recording_status(
        self,
        room_name: str,
    ) -> Dict[str, Any]:
        """Get status of an active recording."""
        if not self.is_configured:
            raise RuntimeError("LiveKit not configured")

        egress_id = self._active_egress.get(room_name)
        if not egress_id:
            return {"room_name": room_name, "status": "not_recording"}

        try:
            egress_list = await self._livekit_api.egress.list_egress(
                api.ListEgressRequest(egress_id=egress_id)
            )

            if egress_list.items:
                egress = egress_list.items[0]
                return {
                    "egress_id": egress_id,
                    "room_name": room_name,
                    "status": str(egress.status),
                    "started_at": self._active_sessions.get(room_name, {}).started_at,
                }

            return {"room_name": room_name, "status": "unknown"}

        except Exception as e:
            logger.error(f"Failed to get recording status: {e}")
            return {"room_name": room_name, "status": "error", "error": str(e)}

    async def list_room_participants(
        self,
        room_name: str,
    ) -> List[Dict[str, Any]]:
        """List current participants in a room."""
        if not self.is_configured:
            raise RuntimeError("LiveKit not configured")

        try:
            response = await self._livekit_api.room.list_participants(
                api.ListParticipantsRequest(room=room_name)
            )

            return [
                {
                    "identity": p.identity,
                    "name": p.name,
                    "sid": p.sid,
                    "state": str(p.state),
                    "joined_at": p.joined_at,
                    "tracks": [
                        {
                            "sid": t.sid,
                            "type": str(t.type),
                            "name": t.name,
                            "muted": t.muted,
                        }
                        for t in p.tracks
                    ],
                }
                for p in response.participants
            ]

        except Exception as e:
            logger.error(f"Failed to list participants: {e}")
            return []

    async def close_room(
        self,
        room_name: str,
    ) -> bool:
        """Close a LiveKit room and disconnect all participants."""
        if not self.is_configured:
            raise RuntimeError("LiveKit not configured")

        try:
            # Stop recording if active
            if room_name in self._active_egress:
                await self.stop_recording(room_name)

            await self._livekit_api.room.delete_room(
                api.DeleteRoomRequest(room=room_name)
            )

            if room_name in self._active_sessions:
                del self._active_sessions[room_name]

            logger.info(f"Closed room: {room_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to close room: {e}")
            return False

    def get_session(self, room_name: str) -> Optional[LiveKitSession]:
        """Get the LiveKit session for a room."""
        return self._active_sessions.get(room_name)


class TrackSynchronizer:
    """
    Synchronizes multi-track recordings from LiveKit for Remotion.

    Handles:
    - Aligning tracks by start time
    - Mapping participants to speaker IDs
    - Converting to frame-based offsets for Remotion Sequences
    """

    def __init__(self, fps: float = 30.0):
        self.fps = fps

    def synchronize_tracks(
        self,
        tracks: List[LiveKitTrack],
        diarization_mapping: Optional[Dict[str, int]] = None,
    ) -> List[SynchronizedTrack]:
        """
        Synchronize LiveKit tracks for Remotion rendering.

        Args:
            tracks: List of LiveKit tracks with timing info
            diarization_mapping: Map of participant_id -> speaker_id

        Returns:
            List of synchronized tracks with frame offsets
        """
        if not tracks:
            return []

        # Find the earliest start time
        min_start = min(t.start_offset_ms for t in tracks)

        synchronized = []
        for i, track in enumerate(tracks):
            # Calculate frame offset from the earliest track
            offset_ms = track.start_offset_ms - min_start
            offset_frames = int((offset_ms / 1000.0) * self.fps)

            # Calculate duration in frames
            duration_frames = int((track.duration_ms / 1000.0) * self.fps)

            # Get speaker ID from diarization mapping or use index
            speaker_id = i
            if diarization_mapping and track.participant_id in diarization_mapping:
                speaker_id = diarization_mapping[track.participant_id]
            elif track.speaker_id is not None:
                speaker_id = track.speaker_id

            synchronized.append(
                SynchronizedTrack(
                    participant_id=track.participant_id,
                    video_path=track.video_path,
                    offset_frames=offset_frames,
                    duration_frames=duration_frames,
                    speaker_id=speaker_id,
                )
            )

        return synchronized

    def generate_remotion_sequences(
        self,
        synchronized_tracks: List[SynchronizedTrack],
    ) -> List[Dict[str, Any]]:
        """
        Generate Remotion Sequence configurations for synchronized tracks.

        Returns list of sequence configs to be passed to Remotion composition.
        """
        return [
            {
                "participantId": track.participant_id,
                "src": track.video_path,
                "from": track.offset_frames,
                "durationInFrames": track.duration_frames,
                "speakerId": track.speaker_id,
            }
            for track in synchronized_tracks
        ]


# Singleton instances
_livekit_service: Optional[LiveKitService] = None
_track_synchronizer: Optional[TrackSynchronizer] = None


def get_livekit_service() -> LiveKitService:
    """Get or create the LiveKit service instance."""
    global _livekit_service
    if _livekit_service is None:
        _livekit_service = LiveKitService()
    return _livekit_service


def get_track_synchronizer(fps: float = 30.0) -> TrackSynchronizer:
    """Get or create the track synchronizer instance."""
    global _track_synchronizer
    if _track_synchronizer is None or _track_synchronizer.fps != fps:
        _track_synchronizer = TrackSynchronizer(fps=fps)
    return _track_synchronizer
