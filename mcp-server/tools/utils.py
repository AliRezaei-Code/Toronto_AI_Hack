import os


def ffmpeg_safe_path(path: str) -> str:
    """
    Convert path to FFmpeg-compatible format.
    
    FFmpeg's concat demuxer requires forward slashes even on Windows.
    This function converts backslashes to forward slashes for cross-platform compatibility.
    
    Args:
        path: File path to convert
        
    Returns:
        Absolute path with forward slashes
    """
    return os.path.abspath(path).replace('\\', '/')
