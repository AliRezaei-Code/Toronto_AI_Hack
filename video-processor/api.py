"""
Video Processor API - FastAPI service for face tracking and video analysis.

Runs as a sidecar container for GPU-accelerated video processing tasks:
- Face tracking with MediaPipe
- Video metadata extraction
- Frame extraction for thumbnails
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import tempfile
import os
import uuid
import asyncio
from pathlib import Path
import logging

from face_tracker import FaceTracker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Video Processor Sidecar",
    description="Face tracking and video analysis service",
    version="1.0.0",
)

# In-memory job storage (use Redis in production)
jobs: Dict[str, Dict[str, Any]] = {}

# Configuration - use platform-appropriate temp directory
TEMP_DIR = os.getenv("TEMP_DIR", os.path.join(tempfile.gettempdir(), "video-processor"))
os.makedirs(TEMP_DIR, exist_ok=True)


# ============================================================================
# Request/Response Models
# ============================================================================


class FaceTrackingRequest(BaseModel):
    """Request to process video for face tracking"""

    video_url: str = Field(..., description="URL to download video from")
    job_id: str = Field(..., description="Parent job ID for correlation")
    enable_smoothing: bool = Field(default=True, description="Apply Kalman smoothing")
    max_faces: int = Field(default=2, ge=1, le=4, description="Maximum faces to track")
    detection_confidence: float = Field(default=0.5, ge=0.1, le=1.0)


class FaceTrackingLocalRequest(BaseModel):
    """Request to process local video file"""

    video_path: str = Field(..., description="Path to video file")
    job_id: str = Field(..., description="Parent job ID for correlation")
    enable_smoothing: bool = Field(default=True)
    max_faces: int = Field(default=2, ge=1, le=4)
    detection_confidence: float = Field(default=0.5, ge=0.1, le=1.0)


class FaceTrackingStatus(BaseModel):
    """Status of face tracking job"""

    task_id: str
    job_id: str
    status: str  # pending, processing, completed, failed
    progress_percent: float = 0.0
    total_frames: Optional[int] = None
    faces_detected: int = 0
    error: Optional[str] = None


class FaceTrackingResult(BaseModel):
    """Result of face tracking"""

    task_id: str
    job_id: str
    video_path: str
    fps: float
    total_frames: int
    width: int
    height: int
    coordinates: List[Dict[str, Any]]
    smoothed: bool
    unique_faces: int


# ============================================================================
# Helper Functions
# ============================================================================


async def download_video(url: str, output_path: str) -> str:
    """Download video from URL"""
    import httpx

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.get(url, follow_redirects=True)
        response.raise_for_status()

        with open(output_path, "wb") as f:
            f.write(response.content)

    return output_path


async def process_face_tracking(
    task_id: str,
    video_path: str,
    job_id: str,
    enable_smoothing: bool,
    max_faces: int,
    detection_confidence: float,
):
    """Background task for face tracking"""
    try:
        jobs[task_id]["status"] = "processing"

        def progress_callback(pct: float):
            jobs[task_id]["progress_percent"] = pct

        # Run face tracking in thread pool (CPU-bound)
        loop = asyncio.get_running_loop()
        tracker = FaceTracker(
            min_detection_confidence=detection_confidence,
            max_faces=max_faces,
            enable_smoothing=enable_smoothing,
        )

        result = await loop.run_in_executor(
            None,
            lambda: tracker.process_video(
                video_path,
                progress_callback=progress_callback,
            ),
        )

        tracker.close()

        # Update job status
        unique_faces = len(set(c["face_id"] for c in result["coordinates"]))

        jobs[task_id].update(
            {
                "status": "completed",
                "progress_percent": 100.0,
                "result": {
                    **result,
                    "job_id": job_id,
                    "unique_faces": unique_faces,
                },
                "total_frames": result["total_frames"],
                "faces_detected": unique_faces,
            }
        )

        logger.info(
            f"Task {task_id} completed: {result['total_frames']} frames, {unique_faces} faces"
        )

    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}")
        jobs[task_id].update(
            {
                "status": "failed",
                "error": str(e),
            }
        )


# ============================================================================
# API Endpoints
# ============================================================================


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "video-processor"}


@app.post("/face-tracking/url", response_model=FaceTrackingStatus)
async def start_face_tracking_from_url(
    request: FaceTrackingRequest,
    background_tasks: BackgroundTasks,
):
    """Start face tracking from video URL"""
    task_id = str(uuid.uuid4())

    # Download video first
    video_filename = f"{task_id}.mp4"
    video_path = os.path.join(TEMP_DIR, video_filename)

    try:
        await download_video(request.video_url, video_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download video: {e}")

    # Initialize job
    jobs[task_id] = {
        "task_id": task_id,
        "job_id": request.job_id,
        "status": "pending",
        "progress_percent": 0.0,
        "video_path": video_path,
        "result": None,
        "error": None,
    }

    # Start background processing
    background_tasks.add_task(
        process_face_tracking,
        task_id=task_id,
        video_path=video_path,
        job_id=request.job_id,
        enable_smoothing=request.enable_smoothing,
        max_faces=request.max_faces,
        detection_confidence=request.detection_confidence,
    )

    return FaceTrackingStatus(
        task_id=task_id,
        job_id=request.job_id,
        status="pending",
    )


@app.post("/face-tracking/local", response_model=FaceTrackingStatus)
async def start_face_tracking_local(
    request: FaceTrackingLocalRequest,
    background_tasks: BackgroundTasks,
):
    """Start face tracking from local video path"""
    if not os.path.exists(request.video_path):
        raise HTTPException(
            status_code=404, detail=f"Video not found: {request.video_path}"
        )

    task_id = str(uuid.uuid4())

    jobs[task_id] = {
        "task_id": task_id,
        "job_id": request.job_id,
        "status": "pending",
        "progress_percent": 0.0,
        "video_path": request.video_path,
        "result": None,
        "error": None,
    }

    background_tasks.add_task(
        process_face_tracking,
        task_id=task_id,
        video_path=request.video_path,
        job_id=request.job_id,
        enable_smoothing=request.enable_smoothing,
        max_faces=request.max_faces,
        detection_confidence=request.detection_confidence,
    )

    return FaceTrackingStatus(
        task_id=task_id,
        job_id=request.job_id,
        status="pending",
    )


@app.post("/face-tracking/upload", response_model=FaceTrackingStatus)
async def start_face_tracking_upload(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    job_id: str = "",
    enable_smoothing: bool = True,
    max_faces: int = 2,
    detection_confidence: float = 0.5,
):
    """Start face tracking from uploaded video file"""
    task_id = str(uuid.uuid4())

    if not job_id:
        job_id = task_id

    # Save uploaded file
    ext = Path(video.filename).suffix or ".mp4"
    video_path = os.path.join(TEMP_DIR, f"{task_id}{ext}")

    with open(video_path, "wb") as f:
        content = await video.read()
        f.write(content)

    jobs[task_id] = {
        "task_id": task_id,
        "job_id": job_id,
        "status": "pending",
        "progress_percent": 0.0,
        "video_path": video_path,
        "result": None,
        "error": None,
    }

    background_tasks.add_task(
        process_face_tracking,
        task_id=task_id,
        video_path=video_path,
        job_id=job_id,
        enable_smoothing=enable_smoothing,
        max_faces=max_faces,
        detection_confidence=detection_confidence,
    )

    return FaceTrackingStatus(
        task_id=task_id,
        job_id=job_id,
        status="pending",
    )


@app.get("/face-tracking/{task_id}/status", response_model=FaceTrackingStatus)
async def get_face_tracking_status(task_id: str):
    """Get status of face tracking task"""
    if task_id not in jobs:
        raise HTTPException(status_code=404, detail="Task not found")

    job = jobs[task_id]
    return FaceTrackingStatus(
        task_id=task_id,
        job_id=job.get("job_id", ""),
        status=job["status"],
        progress_percent=job.get("progress_percent", 0.0),
        total_frames=job.get("total_frames"),
        faces_detected=job.get("faces_detected", 0),
        error=job.get("error"),
    )


@app.get("/face-tracking/{task_id}/result", response_model=FaceTrackingResult)
async def get_face_tracking_result(task_id: str):
    """Get result of completed face tracking task"""
    if task_id not in jobs:
        raise HTTPException(status_code=404, detail="Task not found")

    job = jobs[task_id]

    if job["status"] == "failed":
        raise HTTPException(status_code=500, detail=job.get("error", "Task failed"))

    if job["status"] != "completed":
        raise HTTPException(
            status_code=400, detail=f"Task not completed: {job['status']}"
        )

    result = job["result"]
    return FaceTrackingResult(
        task_id=task_id,
        job_id=result["job_id"],
        video_path=result["video_path"],
        fps=result["fps"],
        total_frames=result["total_frames"],
        width=result["width"],
        height=result["height"],
        coordinates=result["coordinates"],
        smoothed=result["smoothed"],
        unique_faces=result["unique_faces"],
    )


@app.delete("/face-tracking/{task_id}")
async def delete_face_tracking_task(task_id: str):
    """Delete face tracking task and clean up files"""
    if task_id not in jobs:
        raise HTTPException(status_code=404, detail="Task not found")

    job = jobs[task_id]

    # Clean up video file if it's in our temp directory
    video_path = job.get("video_path")
    # Normalize paths for cross-platform comparison
    if video_path and os.path.normpath(video_path).startswith(os.path.normpath(TEMP_DIR)):
        try:
            os.remove(video_path)
        except OSError:
            pass

    del jobs[task_id]

    return {"message": "Task deleted"}


@app.get("/tasks")
async def list_tasks():
    """List all face tracking tasks"""
    return {
        "tasks": [
            {
                "task_id": task_id,
                "job_id": job.get("job_id"),
                "status": job["status"],
                "progress_percent": job.get("progress_percent", 0),
            }
            for task_id, job in jobs.items()
        ]
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
