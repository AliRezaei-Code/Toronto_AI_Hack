"""
Remotion Composer Service - Generates Remotion input props from AI Director data.

This service:
1. Takes AI Director job results (diarization, viral clips, face tracking)
2. Generates inputProps JSON for Remotion compositions
3. Triggers Remotion render via CLI or Remotion Lambda
4. Manages rendered video output and storage
"""

import json
import subprocess
import os
import tempfile
from typing import Dict, Any, List, Optional, Literal
from datetime import datetime
import logging
import httpx

from ..models.director_models import (
    DirectorJob,
    ViralClip,
    DiarizationResult,
    DiarizedWord,
    FaceTrackingData,
    LayoutTimeline,
    EditDecisionList,
    CaptionStyle,
    Platform,
    RemotionInputProps,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RemotionComposer:
    """
    Generates Remotion compositions from AI Director processing results.

    Supports:
    - Local Remotion CLI rendering
    - Remotion Lambda rendering (for production scale)
    - Input props generation for all AI Director data types
    """

    def __init__(
        self,
        remotion_project_path: str = "../frontend",
        output_dir: str = "./rendered_shorts",
        use_lambda: bool = False,
        lambda_function_name: Optional[str] = None,
        lambda_region: str = "us-east-1",
    ):
        """
        Initialize the Remotion composer.

        Args:
            remotion_project_path: Path to the frontend Remotion project
            output_dir: Directory to save rendered videos
            use_lambda: Whether to use Remotion Lambda for rendering
            lambda_function_name: AWS Lambda function name for Remotion
            lambda_region: AWS region for Lambda
        """
        self.remotion_project_path = os.path.abspath(remotion_project_path)
        self.output_dir = os.path.abspath(output_dir)
        self.use_lambda = use_lambda
        self.lambda_function_name = lambda_function_name
        self.lambda_region = lambda_region

        os.makedirs(self.output_dir, exist_ok=True)

    def generate_input_props(
        self,
        job: DirectorJob,
        clip: ViralClip,
        diarization: Optional[DiarizationResult] = None,
        face_tracking: Optional[FaceTrackingData] = None,
        layout_timeline: Optional[LayoutTimeline] = None,
        edl: Optional[EditDecisionList] = None,
        caption_style: CaptionStyle = CaptionStyle.HORMOZI,
        platform: Platform = Platform.TIKTOK,
        include_captions: bool = True,
        music_url: Optional[str] = None,
        music_volume: float = 0.1,
    ) -> Dict[str, Any]:
        """
        Generate Remotion inputProps from AI Director data.

        Returns a dictionary matching the AIDirectedShortProps TypeScript interface.
        """
        # Convert diarized words to Remotion format
        words = []
        if diarization:
            for word in diarization.words:
                words.append(
                    {
                        "word": word.word,
                        "start": word.start,
                        "end": word.end,
                        "confidence": word.confidence,
                        "speaker_id": word.speaker_id,
                        "is_filler": word.is_filler,
                        "punctuated_word": word.punctuated_word,
                    }
                )

        # Filter words to clip time range
        clip_words = [
            w
            for w in words
            if w["start"] >= clip.start_time and w["end"] <= clip.end_time
        ]

        # Convert face tracking data
        face_tracking_data = {}
        if face_tracking:
            for coord in face_tracking.coordinates:
                face_id = coord.face_id
                if face_id not in face_tracking_data:
                    face_tracking_data[face_id] = []
                face_tracking_data[face_id].append(
                    {
                        "frame": coord.frame,
                        "timestamp": coord.timestamp,
                        "face_id": coord.face_id,
                        "x": coord.x,
                        "y": coord.y,
                        "width": coord.width,
                        "height": coord.height,
                        "confidence": coord.confidence,
                    }
                )

        # Convert layout timeline
        layout_frames = []
        if layout_timeline:
            for layout in layout_timeline.layouts:
                layout_frames.append(
                    {
                        "frame": layout.frame,
                        "timestamp": layout.timestamp,
                        "layout_type": layout.layout_type.value,
                        "active_speaker": layout.active_speaker,
                        "visible_speakers": layout.visible_speakers,
                    }
                )

        # Convert EDL
        edit_decision_list = None
        if edl:
            edit_decision_list = {
                "job_id": edl.job_id,
                "clip_id": edl.clip_id,
                "original_duration": edl.original_duration,
                "keep_ranges": [
                    {"start": kr.start, "end": kr.end, "clip_index": kr.clip_index}
                    for kr in edl.keep_ranges
                ],
                "final_duration": edl.final_duration,
                "time_saved": edl.time_saved,
            }

        # Build input props
        input_props = {
            "jobId": job.job_id,
            "clipId": clip.id,
            "videoSources": job.input_videos,
            "viralClip": {
                "id": clip.id,
                "job_id": clip.job_id,
                "start_time": clip.start_time,
                "end_time": clip.end_time,
                "duration": clip.duration,
                "virality_score": clip.virality_score,
                "hook_type": clip.hook_type.value,
                "hook_strength": clip.hook_strength,
                "suggested_titles": clip.suggested_titles,
                "emphasis_words": clip.emphasis_words,
                "summary": clip.summary,
                "speakers": clip.speakers,
                "transcript_text": clip.transcript_text,
            },
            "words": clip_words,
            "faceTrackingData": face_tracking_data,
            "layoutTimeline": layout_frames,
            "editDecisionList": edit_decision_list,
            "sourceWidth": face_tracking.width if face_tracking else 1920,
            "sourceHeight": face_tracking.height if face_tracking else 1080,
            "captionStyle": caption_style.value,
            "platform": platform.value,
            "includeCaptions": include_captions,
            "musicUrl": music_url,
            "musicVolume": music_volume,
            "mainVolume": 1.0,
        }

        return input_props

    def get_composition_id(self, platform: Platform) -> str:
        """Get the Remotion composition ID for a platform."""
        platform_compositions = {
            Platform.TIKTOK: "AIDirectedShort-TikTok",
            Platform.INSTAGRAM: "AIDirectedShort-Reels",
            Platform.YOUTUBE: "AIDirectedShort-Shorts",
        }
        return platform_compositions.get(platform, "AIDirectedShort-TikTok")

    def calculate_duration_frames(
        self,
        clip: ViralClip,
        edl: Optional[EditDecisionList] = None,
        fps: int = 30,
    ) -> int:
        """Calculate total frames for the composition."""
        if edl:
            return int(edl.final_duration * fps)
        return int(clip.duration * fps)

    async def render_short(
        self,
        job: DirectorJob,
        clip: ViralClip,
        diarization: Optional[DiarizationResult] = None,
        face_tracking: Optional[FaceTrackingData] = None,
        layout_timeline: Optional[LayoutTimeline] = None,
        edl: Optional[EditDecisionList] = None,
        caption_style: CaptionStyle = CaptionStyle.HORMOZI,
        platform: Platform = Platform.TIKTOK,
        include_captions: bool = True,
        music_url: Optional[str] = None,
        output_format: Literal["mp4", "webm"] = "mp4",
    ) -> Dict[str, Any]:
        """
        Render a viral short using Remotion.

        Returns:
            Dict with video_url, duration, render_time_seconds
        """
        start_time = datetime.utcnow()

        # Generate input props
        input_props = self.generate_input_props(
            job=job,
            clip=clip,
            diarization=diarization,
            face_tracking=face_tracking,
            layout_timeline=layout_timeline,
            edl=edl,
            caption_style=caption_style,
            platform=platform,
            include_captions=include_captions,
            music_url=music_url,
        )

        # Output filename
        output_filename = f"{job.job_id}_{clip.id}_{platform.value}.{output_format}"
        output_path = os.path.join(self.output_dir, output_filename)

        # Calculate duration
        duration_frames = self.calculate_duration_frames(clip, edl)

        if self.use_lambda:
            result = await self._render_with_lambda(
                input_props=input_props,
                composition_id=self.get_composition_id(platform),
                duration_frames=duration_frames,
                output_path=output_path,
            )
        else:
            result = await self._render_with_cli(
                input_props=input_props,
                composition_id=self.get_composition_id(platform),
                duration_frames=duration_frames,
                output_path=output_path,
                output_format=output_format,
            )

        end_time = datetime.utcnow()
        render_time = (end_time - start_time).total_seconds()

        return {
            "video_url": output_path,
            "duration": clip.duration,
            "render_time_seconds": render_time,
            "job_id": job.job_id,
            "clip_id": clip.id,
        }

    async def _render_with_cli(
        self,
        input_props: Dict[str, Any],
        composition_id: str,
        duration_frames: int,
        output_path: str,
        output_format: str = "mp4",
    ) -> Dict[str, Any]:
        """Render using local Remotion CLI."""

        # Write input props to temp file
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".json",
            delete=False,
        ) as f:
            json.dump(input_props, f)
            props_path = f.name

        try:
            # Build Remotion CLI command
            cmd = [
                "npx",
                "remotion",
                "render",
                composition_id,
                output_path,
                "--props",
                props_path,
                "--frames",
                f"0-{duration_frames - 1}",
            ]

            if output_format == "webm":
                cmd.extend(["--codec", "vp8"])
            else:
                cmd.extend(["--codec", "h264"])

            logger.info(f"Running Remotion render: {' '.join(cmd)}")

            # Run render
            process = subprocess.run(
                cmd,
                cwd=self.remotion_project_path,
                capture_output=True,
                text=True,
            )

            if process.returncode != 0:
                logger.error(f"Remotion render failed: {process.stderr}")
                raise RuntimeError(f"Render failed: {process.stderr}")

            logger.info(f"Render complete: {output_path}")

            return {"output_path": output_path, "success": True}

        finally:
            # Clean up temp props file
            os.unlink(props_path)

    async def _render_with_lambda(
        self,
        input_props: Dict[str, Any],
        composition_id: str,
        duration_frames: int,
        output_path: str,
    ) -> Dict[str, Any]:
        """
        Render using Remotion Lambda.

        Requires:
        - REMOTION_AWS_ACCESS_KEY_ID
        - REMOTION_AWS_SECRET_ACCESS_KEY
        - Lambda function deployed via @remotion/lambda
        """
        # This would use the Remotion Lambda SDK
        # For now, we'll implement a placeholder that calls the render API

        if not self.lambda_function_name:
            raise ValueError("Lambda function name required for Lambda rendering")

        # In production, use @remotion/lambda renderMediaOnLambda
        logger.warning("Lambda rendering not yet implemented, falling back to CLI")
        return await self._render_with_cli(
            input_props=input_props,
            composition_id=composition_id,
            duration_frames=duration_frames,
            output_path=output_path,
        )

    def generate_composition_config(
        self,
        job: DirectorJob,
        clip: ViralClip,
        platform: Platform = Platform.TIKTOK,
    ) -> Dict[str, Any]:
        """
        Generate a Remotion composition config for the Studio preview.

        This can be saved and used to preview the composition in Remotion Studio.
        """
        return {
            "compositionId": self.get_composition_id(platform),
            "durationInFrames": self.calculate_duration_frames(clip),
            "fps": 30,
            "width": 1080,
            "height": 1920,
            "inputProps": {},  # Will be filled by generate_input_props
        }


# Singleton instance for use in API routes
_composer: Optional[RemotionComposer] = None


def get_composer() -> RemotionComposer:
    """Get or create the Remotion composer instance."""
    global _composer
    if _composer is None:
        _composer = RemotionComposer(
            remotion_project_path=os.getenv("REMOTION_PROJECT_PATH", "../frontend"),
            output_dir=os.getenv("RENDERED_SHORTS_DIR", "./rendered_shorts"),
            use_lambda=os.getenv("USE_REMOTION_LAMBDA", "false").lower() == "true",
            lambda_function_name=os.getenv("REMOTION_LAMBDA_FUNCTION"),
            lambda_region=os.getenv("AWS_REGION", "us-east-1"),
        )
    return _composer
