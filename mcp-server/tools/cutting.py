import os
import subprocess
import asyncio
import uuid
from typing import Dict, Any

from .utils import ffmpeg_safe_path

class CuttingTool:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    async def cut_segment(
        self,
        video_path: str,
        start_time: float,
        end_time: float,
        smart_render: bool = True
    ) -> Dict[str, Any]:
        """
        Cut a segment from video.
        
        Args:
            video_path: Path to input video
            start_time: Start time in seconds
            end_time: End time in seconds
            smart_render: Use stream copy if possible (no re-encoding)
        
        Returns:
            Dictionary with output video path
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        duration = end_time - start_time
        if duration <= 0:
            raise ValueError(f"Invalid duration: {duration}")

        output_filename = f"cut_{uuid.uuid4().hex[:8]}.mp4"
        output_path = os.path.join(self.output_dir, output_filename)

        if smart_render:
            return await self._smart_cut(video_path, output_path, start_time, duration)
        else:
            return await self._reencoded_cut(video_path, output_path, start_time, duration)

    async def _smart_cut(
        self,
        video_path: str,
        output_path: str,
        start_time: float,
        duration: float
    ) -> Dict[str, Any]:
        """
        Frame-accurate cut with consistent A/V encoding.
        Re-encodes both video AND audio to ensure all segments have identical
        formats for seamless concatenation without A/V desync.
        """
        command = [
            'ffmpeg',
            '-ss', str(start_time),
            '-i', video_path,
            '-t', str(duration),
            # Video: re-encode for frame-accurate cuts
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '18',
            '-pix_fmt', 'yuv420p',
            # Audio: re-encode to consistent format (fixes desync from mixed sources)
            '-c:a', 'aac',
            '-ar', '48000',            # Fixed sample rate
            '-ac', '2',                # Stereo
            '-b:a', '192k',
            # Timestamp handling
            '-avoid_negative_ts', 'make_zero',
            '-async', '1',             # Sync audio to timestamps
            '-y',
            output_path
        ]

        result = subprocess.run(
            command,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"FFmpeg cut failed: {result.stderr}")

        return {
            'output_path': output_path,
            'duration': duration,
            'method': 'full_reencode'
        }

    async def _reencoded_cut(
        self,
        video_path: str,
        output_path: str,
        start_time: float,
        duration: float
    ) -> Dict[str, Any]:
        """
        Cut with re-encoding for precision and universal playback compatibility.
        """
        command = [
            'ffmpeg',
            '-ss', str(start_time),
            '-i', video_path,
            '-t', str(duration),
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',    # Force 8-bit 4:2:0 for universal playback
            '-preset', 'medium',      # Good balance of speed and compression
            '-crf', '23',             # Constant quality
            '-c:a', 'aac',
            '-b:a', '192k',           # Audio bitrate
            '-movflags', '+faststart', # Enable streaming
            '-y',
            output_path
        ]

        result = subprocess.run(
            command,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"FFmpeg cut failed: {result.stderr}")

        return {
            'output_path': output_path,
            'duration': duration,
            'method': 'reencoded'
        }

    async def remove_segment(
        self,
        video_path: str,
        start_time: float,
        end_time: float
    ) -> Dict[str, Any]:
        """
        Remove a segment from video by splitting and concatenating.
        
        Args:
            video_path: Path to input video
            start_time: Start time of segment to remove
            end_time: End time of segment to remove
        
        Returns:
            Dictionary with output video path
        """
        output_filename = f"removed_{uuid.uuid4().hex[:8]}.mp4"
        output_path = os.path.join(self.output_dir, output_filename)

        part1_filename = f"temp_part1_{uuid.uuid4().hex[:8]}.mp4"
        part2_filename = f"temp_part2_{uuid.uuid4().hex[:8]}.mp4"
        part1_path = os.path.join(self.output_dir, part1_filename)
        part2_path = os.path.join(self.output_dir, part2_filename)

        concat_file = os.path.join(self.output_dir, 'concat_remove.txt')

        try:
            await self._smart_cut(video_path, part1_path, 0, start_time)
            
            total_duration = await self._get_video_duration(video_path)
            part2_duration = total_duration - end_time
            if part2_duration > 0:
                await self._smart_cut(video_path, part2_path, end_time, part2_duration)

            with open(concat_file, 'w') as f:
                f.write(f"file '{ffmpeg_safe_path(part1_path)}'\n")
                if part2_duration > 0:
                    f.write(f"file '{ffmpeg_safe_path(part2_path)}'\n")

            command = [
                'ffmpeg',
                '-f', 'concat',
                '-safe', '0',
                '-i', concat_file,
                '-c', 'copy',
                '-y',
                output_path
            ]

            result = subprocess.run(
                command,
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                raise Exception(f"Segment removal failed: {result.stderr}")

            final_duration = await self._get_video_duration(output_path)

            return {
                'output_path': output_path,
                'duration': final_duration,
                'removed_duration': end_time - start_time
            }

        finally:
            for temp_file in [part1_path, part2_path, concat_file]:
                if os.path.exists(temp_file):
                    os.remove(temp_file)

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

        return float(result.stdout.strip())