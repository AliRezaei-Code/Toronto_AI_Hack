import os
import logging
from typing import List, Tuple, Optional
from pathlib import Path
import subprocess

logger = logging.getLogger(__name__)


class VideoValidator:
    """Validates video files for upload."""
    
    # Supported video formats
    SUPPORTED_FORMATS = {'.mp4', '.mov', '.webm', '.avi'}
    
    # File size limits (in bytes)
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    MIN_FILE_SIZE = 1 * 1024  # 1KB
    
    # Duration limits (in seconds)
    MAX_DURATION = 300  # 5 minutes (hard limit)
    RECOMMENDED_DURATION = 30  # 30 seconds (recommended)
    
    # Resolution limits
    MIN_HEIGHT = 144
    MAX_HEIGHT = 4320  # 8K
    
    def __init__(self):
        self.ffprobe_available = self._check_ffprobe()
    
    def _check_ffprobe(self) -> bool:
        """Check if ffprobe is available for video analysis."""
        try:
            subprocess.run(
                ['ffprobe', '-version'],
                capture_output=True,
                check=True
            )
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("ffprobe not available - limited validation")
            return False
    
    def validate_file(
        self,
        file_path: str,
        check_duration: bool = True
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate a video file.
        
        Args:
            file_path: Path to the video file
            check_duration: Whether to check video duration
        
        Returns:
            Tuple of (is_valid, error_message)
            - is_valid: True if file passes validation
            - error_message: Error message if invalid, None otherwise
        """
        if not os.path.exists(file_path):
            return (False, f"File does not exist: {file_path}")
        
        # Check file size
        size = os.path.getsize(file_path)
        if size < self.MIN_FILE_SIZE:
            return (False, f"File too small: {size} bytes (minimum: {self.MIN_FILE_SIZE})")
        
        if size > self.MAX_FILE_SIZE:
            return (False, f"File too large: {size / (1024*1024):.1f}MB (maximum: {self.MAX_FILE_SIZE / (1024*1024)}MB)")
        
        # Check file extension
        ext = Path(file_path).suffix.lower()
        if ext not in self.SUPPORTED_FORMATS:
            return (False, f"Unsupported format: {ext}. Supported formats: {', '.join(self.SUPPORTED_FORMATS)}")
        
        # Check duration and metadata if ffprobe is available
        if check_duration and self.ffprobe_available:
            try:
                height,duration = self._get_video_metadata(file_path)
                print(f"Video duration: {duration:.1f}s, height: {height}px")
                
                if duration > self.MAX_DURATION:
                    return (False, f"Video too long: {duration:.1f}s (maximum: {self.MAX_DURATION}s)")
                
                if duration > self.RECOMMENDED_DURATION:
                    logger.warning(f"Video exceeds recommended duration: {duration:.1f}s (recommended: {self.RECOMMENDED_DURATION}s)")
                
                if height < self.MIN_HEIGHT:
                    return (False, f"Video resolution too low: {height}p (minimum: {self.MIN_HEIGHT}p)")
                
                if height > self.MAX_HEIGHT:
                    logger.warning(f"Video has very high resolution: {height}p. Processing may be slow.")
                
            except Exception as e:
                logger.error(f"Error checking video metadata: {str(e)}")
                # Continue validation - metadata check shouldn't fail upload
        
        return (True, None)
    
    def validate_files(self, file_paths: List[str]) -> Tuple[bool, List[str]]:
        """
        Validate multiple video files.
        
        Args:
            file_paths: List of video file paths
        
        Returns:
            Tuple of (all_valid, errors)
            - all_valid: True if all files pass validation
            - errors: List of error messages for invalid files
        """
        if len(file_paths) < 3:
            return (False, ["At least 3 video clips are required"])
        
        if len(file_paths) > 5:
            return (False, ["Maximum 5 video clips allowed"])
        
        all_valid = True
        errors = []
        
        for i, file_path in enumerate(file_paths):
            is_valid, error = self.validate_file(file_path)
            if not is_valid:
                all_valid = False
                errors.append(f"Clip {i + 1}: {error}")
        
        return (all_valid, errors)
    
    def _get_video_metadata(self, file_path: str) -> Tuple[float, float]:
        """
        Extract video duration and height using ffprobe.
        
        Args:
            file_path: Path to the video file
        
        Returns:
            Tuple of (duration_in_seconds, height_in_pixels)
        """
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=height',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            file_path
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            raise Exception(f"ffprobe failed: {result.stderr}")
        
        lines = result.stdout.strip().split('\n')
        
        if len(lines) < 2:
            raise Exception("Unable to parse ffprobe output")
        
        try:
            duration = float(lines[0])
            height = float(lines[1])
        
            return (duration, height)
        except (ValueError, IndexError) as e:
            raise Exception(f"Unable to parse metadata: {str(e)}")
    
    def get_validation_recommendations(self) -> List[str]:
        """Get recommendations for optimal video upload."""
        recommendations = [
            f"Clip duration: {self.RECOMMENDED_DURATION}s or less for faster processing",
            f"File size: Under {self.MAX_FILE_SIZE / (1024*1024)}MB per clip",
            f"Resolution: 720p-1080p recommended (balance of quality and speed)",
            f"Format: MP4 (H.264) preferred, but MOV, WebM, AVI also supported",
            f"Total: 3-5 clips recommended"
        ]
        return recommendations


# Global validator instance
validator = VideoValidator()