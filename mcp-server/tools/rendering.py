import os
import json
import subprocess
import asyncio
import uuid
from typing import List, Dict, Any

from .utils import ffmpeg_safe_path

class RenderingTool:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    async def render_from_clips(
        self,
        segments: List[Dict[str, Any]],
        clip_paths: List[str]
    ) -> Dict[str, Any]:
        """
        Render video from multiple source clips directly (no pre-stitch needed).
        
        Args:
            segments: List of segments to include, each referencing a clip by index
                [
                    {'clip_index': 0, 'start': 1.5, 'end': 5.2, 'label': 'hook'},
                    {'clip_index': 2, 'start': 0.0, 'end': 3.1, 'label': 'body'},
                    ...
                ]
            clip_paths: List of source clip paths (indexed by clip_index)
        
        Returns:
            Dictionary with output video path and duration
        """
        if not segments:
            raise ValueError("No segments provided")
        
        if not clip_paths:
            raise ValueError("No clip paths provided")
        
        from .cutting import CuttingTool
        
        cut_tool = CuttingTool(self.output_dir)
        temp_segments = []
        concat_file = os.path.join(self.output_dir, f'clips_concat_{uuid.uuid4().hex[:8]}.txt')
        output_filename = f"rendered_{uuid.uuid4().hex[:8]}.mp4"
        output_path = os.path.join(self.output_dir, output_filename)
        
        try:
            for i, segment in enumerate(segments):
                clip_index = segment.get('clip_index', 0)
                start = segment.get('start', 0.0)
                end = segment.get('end', 0.0)
                duration = end - start
                
                if clip_index >= len(clip_paths):
                    raise ValueError(f"Invalid clip_index {clip_index}, only {len(clip_paths)} clips available")
                
                source_clip = clip_paths[clip_index]
                temp_filename = f"temp_clip_{i}_{uuid.uuid4().hex[:8]}.mp4"
                temp_path = os.path.join(self.output_dir, temp_filename)
                
                await cut_tool._smart_cut(
                    source_clip,
                    temp_path,
                    start,
                    duration
                )
                
                temp_segments.append(temp_path)
            
            # Concatenate all segments
            with open(concat_file, 'w') as f:
                for segment_path in temp_segments:
                    f.write(f"file '{ffmpeg_safe_path(segment_path)}'\n")
            
            command = [
                'ffmpeg',
                '-f', 'concat',
                '-safe', '0',
                '-i', concat_file,
                '-c', 'copy',
                '-movflags', '+faststart',  # Enable streaming
                '-y',
                output_path
            ]
            
            result = subprocess.run(
                command,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(f"Multi-clip render failed: {result.stderr}")
            
            final_duration = await self._get_video_duration(output_path)
            
            return {
                'output_path': output_path,
                'duration': final_duration,
                'segments_count': len(segments)
            }
        
        finally:
            # Cleanup temp files
            for temp_file in temp_segments:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            if os.path.exists(concat_file):
                os.remove(concat_file)

    async def render_timeline(
        self,
        edit_instructions: List[Dict[str, Any]],
        source_video: str
    ) -> Dict[str, Any]:
        """
        Render final video from edit instruction timeline.
        
        Args:
            edit_instructions: List of edit operations
                [
                    {
                        'type': 'keep' | 'cut',
                        'start': float,
                        'end': float
                    },
                    ...
                ]
            source_video: Path to source video
        
        Returns:
            Dictionary with output video path
        """
        if not edit_instructions:
            raise ValueError("No edit instructions provided")
        print("Edit Instructions:", edit_instructions)
        keep_segments = [e for e in edit_instructions if e['type'] == 'keep']
        cut_segments = [e for e in edit_instructions if e['type'] == 'cut']

        # Convert cut instructions to keep instructions if needed
        if not keep_segments and cut_segments:
            # Get video duration
            video_duration = await self._get_video_duration(source_video)
            
            # Sort and merge overlapping cut segments
            sorted_cuts = sorted(cut_segments, key=lambda x: x['start'])
            merged_cuts = []
            if sorted_cuts:
                current_start = sorted_cuts[0]['start']
                current_end = sorted_cuts[0]['end']
                
                for cut in sorted_cuts[1:]:
                    if cut['start'] <= current_end:
                        # Merge overlapping or adjacent cuts
                        current_end = max(current_end, cut['end'])
                    else:
                        # Finalize current cut range
                        merged_cuts.append((current_start, current_end))
                        current_start = cut['start']
                        current_end = cut['end']
                merged_cuts.append((current_start, current_end))
            
            # Create keep segments for everything NOT in the cut ranges
            keep_segments = []
            last_end = 0.0
            
            for cut_start, cut_end in merged_cuts:
                if last_end < cut_start:
                    # There's a gap before this cut - keep it
                    keep_segments.append({
                        'type': 'keep',
                        'start': last_end,
                        'end': cut_start
                    })
                last_end = max(last_end, cut_end)
            
            # Keep everything after the last cut
            if last_end < video_duration:
                keep_segments.append({
                    'type': 'keep',
                    'start': last_end,
                    'end': video_duration
                })
            
            if not keep_segments:
                raise ValueError("No segments to keep in timeline after converting cuts")

        if not keep_segments:
            raise ValueError("No segments to keep in timeline")

        output_filename = f"rendered_{uuid.uuid4().hex[:8]}.mp4"
        output_path = os.path.join(self.output_dir, output_filename)

        if len(keep_segments) == 1 and not cut_segments:
            return await self._single_segment_render(
                source_video,
                output_path,
                keep_segments[0]['start'],
                keep_segments[0]['end']
            )
        else:
            return await self._multi_segment_render(
                source_video,
                output_path,
                keep_segments
            )

    async def _single_segment_render(
        self,
        source_video: str,
        output_path: str,
        start: float,
        end: float
    ) -> Dict[str, Any]:
        """
        Render single segment.
        """
        duration = end - start
        
        command = [
            'ffmpeg',
            '-ss', str(start),
            '-i', source_video,
            '-t', str(duration),
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
            raise Exception(f"Single segment render failed: {result.stderr}")

        return {
            'output_path': output_path,
            'duration': duration
        }

    async def _multi_segment_render(
        self,
        source_video: str,
        output_path: str,
        segments: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Render multiple segments by concatenating.
        """
        from .cutting import CuttingTool
        
        cut_tool = CuttingTool(self.output_dir)
        temp_segments = []
        concat_file = os.path.join(self.output_dir, 'render_concat.txt')

        try:
            for i, segment in enumerate(segments):
                duration = segment['end'] - segment['start']
                temp_filename = f"temp_seg_{i}_{uuid.uuid4().hex[:8]}.mp4"
                temp_path = os.path.join(self.output_dir, temp_filename)
                
                await cut_tool._smart_cut(
                    source_video,
                    temp_path,
                    segment['start'],
                    duration
                )
                
                temp_segments.append(temp_path)

            with open(concat_file, 'w') as f:
                for segment_path in temp_segments:
                    f.write(f"file '{ffmpeg_safe_path(segment_path)}'\n")

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
                raise Exception(f"Multi-segment render failed: {result.stderr}")

            final_duration = await self._get_video_duration(output_path)

            return {
                'output_path': output_path,
                'duration': final_duration,
                'segments_count': len(segments)
            }

        finally:
            for temp_file in temp_segments + [concat_file]:
                if os.path.exists(temp_file):
                    os.remove(temp_file)

    async def generate_edit_instructions(
        self,
        transcript: List[Dict[str, Any]],
        edits_to_make: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Generate FFmpeg edit instructions from word-level edits.
        
        Args:
            transcript: List of words with timestamps
            edits_to_make: List of edit operations
                [
                    {'type': 'delete', 'word_indices': [0, 1, 2]},
                    {'type': 'keep', 'word_indices': [3, 4, 5]}
                ]
        
        Returns:
            List of timeline edit instructions
        """
        timeline_instructions = []
        
        if not transcript:
            return timeline_instructions

        current_start = transcript[0]['start']
        i = 0
        word_map = {idx: word for idx, word in enumerate(transcript)}

        deleted_indices = set()
        for edit in edits_to_make:
            if edit.get('type') == 'delete':
                deleted_indices.update(edit.get('word_indices', []))

        last_kept_end = transcript[0]['start']

        for word_idx, word in enumerate(transcript):
            word_start = word['start']
            word_end = word['end']

            if word_idx in deleted_indices:
                continue

            if word_start > last_kept_end + 0.01:
                timeline_instructions.append({
                    'type': 'cut',
                    'start': last_kept_end,
                    'end': word_start
                })
            
            last_kept_end = word_end

        total_duration = transcript[-1]['end']
        if last_kept_end < total_duration:
            timeline_instructions.append({
                'type': 'keep',
                'start': last_kept_end,
                'end': total_duration
            })

        keep_segments = [e for e in timeline_instructions if e['type'] == 'keep']
        
        return keep_segments

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