import os
import subprocess
import asyncio
import uuid
import json
import logging
from typing import List, Dict, Any, Optional

from .utils import ffmpeg_safe_path

logger = logging.getLogger(__name__)


class ClipInfo:
    """Container for clip metadata retrieved in a single ffprobe call."""
    def __init__(self, duration: float, has_video: bool, has_audio: bool):
        self.duration = duration
        self.has_video = has_video
        self.has_audio = has_audio


class StitchingTool:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        logger.info(f"StitchingTool initialized with output_dir: {output_dir}")

    async def stitch_clips(
        self,
        clip_paths: List[str],
        transition_type: str = 'crossfade',
        transition_duration: float = 0.5
    ) -> Dict[str, Any]:
        """
        Concatenate video clips with crossfade transition.
        
        Args:
            clip_paths: List of video file paths
            transition_type: Type of transition ('crossfade', 'cut')
            transition_duration: Duration of transition in seconds
        
        Returns:
            Dictionary with output video path
        """
        logger.info(f"=== stitch_clips START ===")
        logger.info(f"clip_paths ({len(clip_paths)} clips): {clip_paths}")
        logger.info(f"transition_type: {transition_type}, duration: {transition_duration}")
        
        if not clip_paths:
            logger.error("No clips provided for stitching")
            raise ValueError("No clips provided for stitching")
        
        # Validate all clips exist
        for i, clip in enumerate(clip_paths):
            if not os.path.exists(clip):
                logger.error(f"Clip {i} not found: {clip}")
                raise FileNotFoundError(f"Clip file not found: {clip}")
            logger.info(f"Clip {i} exists: {clip} (size: {os.path.getsize(clip)} bytes)")
        
        output_filename = f"stitched_{uuid.uuid4().hex[:8]}.mp4"
        output_path = os.path.join(self.output_dir, output_filename)
        logger.info(f"Output path: {output_path}")

        try:
            if transition_type == 'cut' or len(clip_paths) == 1:
                logger.info("Using simple_concat method")
                result = await self._simple_concat(clip_paths, output_path)
            else:
                logger.info("Using crossfade_stitch method")
                result = await self._crossfade_stitch(clip_paths, output_path, transition_duration)
            
            logger.info(f"=== stitch_clips SUCCESS === Result: {result}")
            return result
        except Exception as e:
            logger.exception(f"=== stitch_clips FAILED === Error: {e}")
            raise

    async def _simple_concat(self, clip_paths: List[str], output_path: str) -> Dict[str, Any]:
        """
        Simple concatenation using concat demuxer (no re-encoding).
        """
        logger.info(f"_simple_concat: Starting with {len(clip_paths)} clips")
        concat_file = os.path.join(self.output_dir, 'concat_list.txt')
        
        with open(concat_file, 'w') as f:
            for clip in clip_paths:
                safe_path = ffmpeg_safe_path(clip)
                f.write(f"file '{safe_path}'\n")
                logger.debug(f"Added to concat file: {safe_path}")

        command = [
            'ffmpeg',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_file,
            '-c', 'copy',
            '-y',
            output_path
        ]

        logger.info(f"_simple_concat: Running FFmpeg command: {' '.join(command)}")
        
        result = subprocess.run(
            command,
            capture_output=True,
            text=True
        )

        logger.info(f"_simple_concat: FFmpeg exit code: {result.returncode}")
        if result.stderr:
            logger.info(f"_simple_concat: FFmpeg stderr:\n{result.stderr}")

        if result.returncode != 0:
            logger.error(f"_simple_concat: FFmpeg FAILED with code {result.returncode}")
            logger.error(f"_simple_concat: Command was: {' '.join(command)}")
            logger.error(f"_simple_concat: Full stderr:\n{result.stderr}")
            try:
                os.remove(concat_file)
            except Exception:
                pass
            raise Exception(f"FFmpeg concat failed (exit code {result.returncode}): {result.stderr}")

        try:
            os.remove(concat_file)
        except Exception as e:
            logger.warning(f"Could not remove concat file: {e}")

        duration = await self._get_video_duration(output_path)
        logger.info(f"_simple_concat: Success! Output duration: {duration}s")
        
        return {
            'output_path': output_path,
            'duration': duration,
            'method': 'simple_concat'
        }

    async def _crossfade_stitch(
        self,
        clip_paths: List[str],
        output_path: str,
        transition_duration: float
    ) -> Dict[str, Any]:
        """
        Stitch clips with crossfade transition.
        Optimized with single ffprobe call per clip and faster encoding settings.
        """
        logger.info(f"_crossfade_stitch: Starting with {len(clip_paths)} clips, transition={transition_duration}s")
        
        if len(clip_paths) < 2:
            logger.info("_crossfade_stitch: Less than 2 clips, falling back to simple_concat")
            return await self._simple_concat(clip_paths, output_path)

        # Get all clip info in a single ffprobe call per clip (instead of 3-4 calls)
        logger.info("_crossfade_stitch: Checking clip properties...")
        clip_infos: List[ClipInfo] = []
        for i, clip in enumerate(clip_paths):
            info = self._get_clip_info(clip)
            clip_infos.append(info)
            logger.info(f"  Clip {i}: duration={info.duration:.2f}s, has_video={info.has_video}, has_audio={info.has_audio}")
            if not info.has_video:
                logger.error(f"Clip {i} has no video stream: {clip}")
                raise ValueError(f"Clip {i} has no video stream: {clip}")
            if not info.has_audio:
                logger.warning(f"Clip {i} has no audio stream: {clip} - this may cause crossfade to fail")

        try:
            # Pass pre-fetched durations to avoid redundant ffprobe calls
            durations = [info.duration for info in clip_infos]
            filter_complex, video_out, audio_out = self._build_crossfade_filter_with_durations(
                clip_paths, durations, transition_duration
            )
            logger.info(f"_crossfade_stitch: Filter complex built successfully")
            logger.debug(f"_crossfade_stitch: filter_complex={filter_complex}")
            logger.info(f"_crossfade_stitch: video_out=[{video_out}], audio_out=[{audio_out}]")
        except Exception as e:
            logger.exception(f"_crossfade_stitch: Failed to build filter complex: {e}")
            raise

        inputs = []
        for clip in clip_paths:
            inputs.extend(['-i', clip])
        
        # Optimized encoding settings for better performance
        command = [
            'ffmpeg',
            '-threads', '0',          # Auto-detect optimal thread count
            *inputs,
            '-filter_complex', filter_complex,
            '-map', f'[{video_out}]',
            '-map', f'[{audio_out}]',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',   # Fastest encoding preset
            '-tune', 'fastdecode',    # Optimize for fast decoding
            '-crf', '23',             # Constant quality (good balance)
            '-c:a', 'aac',
            '-b:a', '128k',           # Fixed audio bitrate
            '-movflags', '+faststart', # Enable streaming
            '-y',
            output_path
        ]

        # Log the full command for debugging
        logger.info(f"_crossfade_stitch: Running FFmpeg command:")
        logger.info(f"  {' '.join(command)}")
        
        result = subprocess.run(
            command,
            capture_output=True,
            text=True
        )
        logger.info(f"_crossfade_stitch: FFmpeg process completed")

        logger.info(f"_crossfade_stitch: FFmpeg exit code: {result.returncode}")
        
        # Always log stderr as it contains progress info and warnings
        if result.stderr:
            # Log last 2000 chars of stderr to avoid flooding logs
            stderr_preview = result.stderr[-2000:] if len(result.stderr) > 2000 else result.stderr
            logger.info(f"_crossfade_stitch: FFmpeg stderr (last 2000 chars):\n{stderr_preview}")

        if result.returncode != 0:
            logger.error(f"_crossfade_stitch: FFmpeg FAILED with exit code {result.returncode}")
            logger.error(f"_crossfade_stitch: Full command was:\n  {' '.join(command)}")
            logger.error(f"_crossfade_stitch: Filter complex was:\n  {filter_complex}")
            logger.error(f"_crossfade_stitch: Full stderr:\n{result.stderr}")
            raise Exception(
                f"FFmpeg crossfade failed (exit code {result.returncode}).\n"
                f"Filter: {filter_complex}\n"
                f"Error: {result.stderr[-1000:]}"  # Last 1000 chars of error
            )

        # Verify output file was created
        if not os.path.exists(output_path):
            logger.error(f"_crossfade_stitch: Output file was not created: {output_path}")
            raise Exception(f"FFmpeg completed but output file not found: {output_path}")
        
        output_size = os.path.getsize(output_path)
        if output_size == 0:
            logger.error(f"_crossfade_stitch: Output file is empty: {output_path}")
            raise Exception(f"FFmpeg created empty output file: {output_path}")
        
        duration = await self._get_video_duration(output_path)
        logger.info(f"_crossfade_stitch: Success! Output: {output_path} (size={output_size}, duration={duration:.2f}s)")

        return {
            'output_path': output_path,
            'duration': duration,
            'method': 'crossfade',
            'transition_duration': transition_duration
        }

    def _build_crossfade_filter(self, clip_paths: List[str], duration: float) -> tuple:
        """
        Build FFmpeg filter complex for crossfade transitions.
        Legacy method - fetches durations internally.
        
        Returns:
            Tuple of (filter_complex_string, video_output_label, audio_output_label)
        """
        # Get all clip durations
        durations = [self._get_clip_duration(clip) for clip in clip_paths]
        return self._build_crossfade_filter_with_durations(clip_paths, durations, duration)

    def _build_crossfade_filter_with_durations(
        self,
        clip_paths: List[str],
        durations: List[float],
        transition_duration: float
    ) -> tuple:
        """
        Build FFmpeg filter complex for crossfade transitions using pre-fetched durations.
        This avoids redundant ffprobe calls when durations are already known.
        
        Args:
            clip_paths: List of video file paths
            durations: Pre-fetched durations for each clip
            transition_duration: Duration of crossfade transition
        
        Returns:
            Tuple of (filter_complex_string, video_output_label, audio_output_label)
        """
        n_clips = len(clip_paths)
        logger.info(f"_build_crossfade_filter: Building filter for {n_clips} clips with {transition_duration}s transitions")
        
        for i, dur in enumerate(durations):
            logger.info(f"  Clip {i} duration: {dur:.3f}s")
        
        video_filters = []
        audio_filters = []
        
        # Build video crossfade chain
        # First crossfade: [0:v][1:v] -> [v0]
        # Second crossfade: [v0][2:v] -> [v1]
        # etc.
        cumulative_offset = 0
        current_video = '0:v'
        
        for i in range(n_clips - 1):
            next_video = f'{i+1}:v'
            output_label = f'v{i}'
            
            # Offset is cumulative duration minus transition overlaps
            offset = cumulative_offset + durations[i] - transition_duration
            # Round to avoid floating point issues
            offset = round(offset, 3)
            
            filter_str = f'[{current_video}][{next_video}]xfade=transition=fade:duration={transition_duration}:offset={offset}[{output_label}]'
            video_filters.append(filter_str)
            logger.debug(f"  Video filter {i}: {filter_str}")
            
            # Update for next iteration
            cumulative_offset = offset
            current_video = output_label
        
        final_video_label = f'v{n_clips - 2}'
        
        # Build audio crossfade chain
        # First crossfade: [0:a][1:a] -> [a0]
        # Second crossfade: [a0][2:a] -> [a1]
        # etc.
        # Note: acrossfade doesn't use offset - it crossfades end of first with start of second
        current_audio = '0:a'
        
        for i in range(n_clips - 1):
            next_audio = f'{i+1}:a'
            output_label = f'a{i}'
            
            filter_str = f'[{current_audio}][{next_audio}]acrossfade=d={transition_duration}:c1=tri:c2=tri[{output_label}]'
            audio_filters.append(filter_str)
            logger.debug(f"  Audio filter {i}: {filter_str}")
            
            current_audio = output_label
        
        final_audio_label = f'a{n_clips - 2}'
        
        filter_complex = ';'.join(video_filters + audio_filters)
        
        logger.info(f"_build_crossfade_filter: Built {len(video_filters)} video + {len(audio_filters)} audio filters")
        logger.info(f"_build_crossfade_filter: Final labels: video=[{final_video_label}], audio=[{final_audio_label}]")
        
        return filter_complex, final_video_label, final_audio_label

    def _get_clip_info(self, video_path: str) -> ClipInfo:
        """
        Get all clip metadata in a single ffprobe call (duration, has_video, has_audio).
        This is much more efficient than making 3 separate calls.
        """
        result = subprocess.run(
            [
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration:stream=codec_type',
                '-of', 'json',
                video_path
            ],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.error(f"_get_clip_info: FFprobe failed for {video_path}: {result.stderr}")
            raise Exception(f"FFprobe failed for {video_path}: {result.stderr}")
        
        try:
            data = json.loads(result.stdout)
            
            # Get duration from format
            duration = float(data.get('format', {}).get('duration', 0))
            
            # Check streams for video and audio
            has_video = False
            has_audio = False
            for stream in data.get('streams', []):
                codec_type = stream.get('codec_type', '')
                if codec_type == 'video':
                    has_video = True
                elif codec_type == 'audio':
                    has_audio = True
            
            return ClipInfo(duration=duration, has_video=has_video, has_audio=has_audio)
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error(f"_get_clip_info: Failed to parse ffprobe output for {video_path}: {e}")
            raise Exception(f"Failed to parse clip info for {video_path}: {e}")

    async def _get_video_duration(self, video_path: str) -> float:
        """
        Get video duration using FFprobe.
        """
        info = self._get_clip_info(video_path)
        return info.duration

    def _get_clip_duration(self, video_path: str) -> float:
        """
        Get clip duration (kept for compatibility).
        """
        info = self._get_clip_info(video_path)
        return info.duration