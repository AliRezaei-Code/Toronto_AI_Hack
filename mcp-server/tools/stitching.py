import os
import subprocess
import asyncio
import uuid
from typing import List, Dict, Any

class StitchingTool:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

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
        if not clip_paths:
            raise ValueError("No clips provided for stitching")
        
        output_filename = f"stitched_{uuid.uuid4().hex[:8]}.mp4"
        output_path = os.path.join(self.output_dir, output_filename)

        if transition_type == 'cut' or len(clip_paths) == 1:
            return await self._simple_concat(clip_paths, output_path)
        else:
            return await self._crossfade_stitch(clip_paths, output_path, transition_duration)

    async def _simple_concat(self, clip_paths: List[str], output_path: str) -> Dict[str, Any]:
        """
        Simple concatenation using concat demuxer (no re-encoding).
        """
        concat_file = os.path.join(self.output_dir, 'concat_list.txt')
        
        with open(concat_file, 'w') as f:
            for clip in clip_paths:
                f.write(f"file '{os.path.abspath(clip)}'\n")

        command = [
            'ffmpeg',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_file,
            '-c', 'copy',
            '-y',
            output_path
        ]

        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode()
            os.remove(concat_file)
            raise Exception(f"FFmpeg concat failed: {error_msg}")

        os.remove(concat_file)

        return {
            'output_path': output_path,
            'duration': await self._get_video_duration(output_path),
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
        """
        if len(clip_paths) < 2:
            return await self._simple_concat(clip_paths, output_path)

        filter_complex = self._build_crossfade_filter(clip_paths, transition_duration)

        inputs = []
        for clip in clip_paths:
            inputs.extend(['-i', clip])

        command = [
            'ffmpeg',
            *inputs,
            '-filter_complex', filter_complex,
            '-preset', 'ultrafast',
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-y',
            output_path
        ]

        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode()
            raise Exception(f"FFmpeg crossfade failed: {error_msg}")

        return {
            'output_path': output_path,
            'duration': await self._get_video_duration(output_path),
            'method': 'crossfade',
            'transition_duration': transition_duration
        }

    def _build_crossfade_filter(self, clip_paths: List[str], duration: float) -> str:
        """
        Build FFmpeg filter complex for crossfade transitions.
        """
        filters = []
        inputs = []
        
        current_input = '0:v'
        
        for i in range(len(clip_paths) - 1):
            input1 = f'{i}:v'
            input2 = f'{i+1}:v'
            output = f'v{i}'
            
            filters.append(
                f'[{input1}][{input2}]xfade=transition=fade:duration={duration}:offset={self._get_clip_duration(clip_paths[i]) - duration}[{output}]'
            )
        
        audio_filter = f'[0:a][1:a]acrossfade=d={duration}[aout]' if len(clip_paths) == 2 else f'[0:a][1:a]acrossfade=d={duration}[aout]'
        
        return ';'.join(filters) + f';{audio_filter}'

    async def _get_video_duration(self, video_path: str) -> float:
        """
        Get video duration using FFprobe.
        """
        command = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            video_path
        ]

        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, _ = await process.communicate()
        return float(stdout.decode().strip())

    def _get_clip_duration(self, video_path: str) -> float:
        """
        Synchronous version for filter building.
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