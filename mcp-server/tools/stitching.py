import os
import subprocess
import asyncio
import uuid
import logging
from typing import List, Dict, Any

from .utils import ffmpeg_safe_path

logger = logging.getLogger(__name__)


class StitchingTool:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        logger.info(f"StitchingTool initialized with output_dir: {output_dir}")

    async def _run_ffmpeg(self, command: List[str]) -> tuple:
        """
        Run FFmpeg command in a cross-platform, non-blocking way.
        Uses asyncio.to_thread() to run subprocess.run() in a thread pool.
        """
        def _run_sync():
            return subprocess.run(command, capture_output=True, text=True)
        
        result = await asyncio.to_thread(_run_sync)
        return result.returncode, result.stdout or '', result.stderr or ''

    async def stitch_clips(self, clip_paths: List[str]) -> Dict[str, Any]:
        """
        Concatenate video clips using simple cuts (no transitions).
        
        Args:
            clip_paths: List of video file paths
        
        Returns:
            Dictionary with output video path
        """
        logger.info(f"=== stitch_clips START ===")
        logger.info(f"clip_paths ({len(clip_paths)} clips): {clip_paths}")
        
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
            result = await self._simple_concat(clip_paths, output_path)
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
        
        # Run FFmpeg using cross-platform async helper
        return_code, _, stderr_text = await self._run_ffmpeg(command)

        logger.info(f"_simple_concat: FFmpeg exit code: {return_code}")
        if stderr_text:
            logger.info(f"_simple_concat: FFmpeg stderr:\n{stderr_text}")

        if return_code != 0:
            logger.error(f"_simple_concat: FFmpeg FAILED with code {return_code}")
            logger.error(f"_simple_concat: Command was: {' '.join(command)}")
            logger.error(f"_simple_concat: Full stderr:\n{stderr_text}")
            try:
                os.remove(concat_file)
            except Exception:
                pass
            raise Exception(f"FFmpeg concat failed (exit code {return_code}): {stderr_text}")

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

    async def _get_video_duration(self, video_path: str) -> float:
        """
        Get video duration using FFprobe.
        """
        result = subprocess.run(
            [
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                video_path
            ],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.error(f"_get_video_duration: FFprobe failed for {video_path}: {result.stderr}")
            return 0.0
        
        try:
            return float(result.stdout.strip())
        except ValueError:
            logger.error(f"_get_video_duration: Could not parse duration for {video_path}")
            return 0.0
