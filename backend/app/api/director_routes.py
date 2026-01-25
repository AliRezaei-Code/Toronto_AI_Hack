"""
AI Director API Routes - Endpoints for the autonomous video repurposing pipeline.

These routes handle:
- Uploading videos for AI Director processing
- Viral clip selection
- Jump-cut processing
- Rendering shorts
"""

import os
import uuid
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from app.models.director_models import (
    DirectorJob,
    DirectorJobStatus,
    DirectorUploadRequest,
    DirectorStatusResponse,
    SelectClipsRequest,
    SelectClipsResponse,
    RenderShortRequest,
    RenderShortResponse,
    ViralClip,
    ViralClipSelection,
    EditDecisionList,
    DiarizationResult,
    CaptionStyle,
    Platform,
)
from app.services.deepgram_service import transcribe_with_diarization
from app.services.viral_clip_selector import select_viral_clips
from app.services.jump_cut_processor import create_jump_cut_edl, get_zoom_cut_points

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/director", tags=["AI Director"])

# In-memory storage for director jobs (replace with database in production)
director_jobs: dict[str, DirectorJob] = {}
diarization_results: dict[str, DiarizationResult] = {}
viral_clips_store: dict[str, ViralClipSelection] = {}
edl_store: dict[str, EditDecisionList] = {}


# ============================================================================
# Upload and Processing Endpoints
# ============================================================================


@router.post("/upload", response_model=DirectorStatusResponse)
async def upload_for_ai_director(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(..., description="Video file to process"),
    include_captions: bool = True,
    caption_style: CaptionStyle = CaptionStyle.HORMOZI,
    target_platform: Platform = Platform.TIKTOK,
    max_clips: int = 5,
    min_clip_duration: float = 30.0,
    max_clip_duration: float = 90.0,
    remove_fillers: bool = True,
):
    """
    Upload a video for AI Director processing.

    The AI Director will:
    1. Transcribe with speaker diarization
    2. Identify viral clip candidates
    3. Generate jump-cut EDL
    4. Track faces for smart cropping
    5. Render vertical shorts

    Returns a job ID to track progress.
    """
    job_id = str(uuid.uuid4())

    # Get shared data directory
    shared_data_dir = os.getenv("SHARED_DATA_DIR", "./shared-data")
    uploads_dir = os.path.join(shared_data_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    # Save uploaded file
    file_ext = os.path.splitext(video.filename or "video.mp4")[1]
    video_path = os.path.join(uploads_dir, f"{job_id}_director{file_ext}")

    try:
        with open(video_path, "wb") as f:
            content = await video.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video: {e}")

    # Create job
    job = DirectorJob(
        job_id=job_id,
        status=DirectorJobStatus.QUEUED,
        job_type="upload",
        input_videos=[video_path],
    )
    director_jobs[job_id] = job

    # Start background processing
    background_tasks.add_task(
        process_director_job,
        job_id=job_id,
        video_path=video_path,
        max_clips=max_clips,
        min_duration=min_clip_duration,
        max_duration=max_clip_duration,
        remove_fillers=remove_fillers,
    )

    return DirectorStatusResponse(
        job_id=job_id,
        status=DirectorJobStatus.QUEUED,
        progress_percent=0.0,
        current_step="Queued for processing",
    )


async def process_director_job(
    job_id: str,
    video_path: str,
    max_clips: int = 5,
    min_duration: float = 30.0,
    max_duration: float = 90.0,
    remove_fillers: bool = True,
):
    """
    Background task to process a video through the AI Director pipeline.
    """
    job = director_jobs.get(job_id)
    if not job:
        logger.error(f"[AIDirector] Job {job_id} not found")
        return

    try:
        # ================================================================
        # Step 1: Transcription with Diarization
        # ================================================================
        job.status = DirectorJobStatus.TRANSCRIBING
        job.progress_percent = 10.0
        logger.info(f"[AIDirector] Step 1: Transcribing job {job_id}")

        diarization = await transcribe_with_diarization(video_path, job_id)
        diarization_results[job_id] = diarization

        job.diarization_result = diarization
        job.transcription_complete = True
        job.diarization_complete = True
        job.progress_percent = 30.0

        logger.info(
            f"[AIDirector] Transcription complete: {len(diarization.words)} words, "
            f"{diarization.total_speakers} speakers"
        )

        # ================================================================
        # Step 2: Viral Clip Selection
        # ================================================================
        job.status = DirectorJobStatus.SELECTING_CLIPS
        job.progress_percent = 40.0
        logger.info(f"[AIDirector] Step 2: Selecting viral clips for job {job_id}")

        clip_selection = await select_viral_clips(
            transcript=diarization,
            job_id=job_id,
            max_clips=max_clips,
            min_duration=min_duration,
            max_duration=max_duration,
        )
        viral_clips_store[job_id] = clip_selection

        job.viral_clips = clip_selection.clips
        job.clip_selection_complete = True
        job.progress_percent = 60.0

        logger.info(f"[AIDirector] Selected {len(clip_selection.clips)} viral clips")

        # ================================================================
        # Step 3: Jump-Cut Processing
        # ================================================================
        job.progress_percent = 70.0
        logger.info(f"[AIDirector] Step 3: Creating jump-cut EDL for job {job_id}")

        edl = await create_jump_cut_edl(
            diarization=diarization,
            job_id=job_id,
            remove_fillers=remove_fillers,
        )
        edl_store[job_id] = edl

        logger.info(
            f"[AIDirector] Jump-cut EDL: {len(edl.cuts)} cuts, "
            f"saved {edl.time_saved:.1f}s"
        )

        # ================================================================
        # Step 4: Mark as Ready for Rendering
        # ================================================================
        job.status = DirectorJobStatus.COMPLETED
        job.progress_percent = 100.0
        job.completed_at = datetime.utcnow()

        logger.info(f"[AIDirector] Job {job_id} completed successfully")

    except Exception as e:
        logger.error(f"[AIDirector] Job {job_id} failed: {e}", exc_info=True)
        job.status = DirectorJobStatus.FAILED
        job.error = str(e)


# ============================================================================
# Status and Query Endpoints
# ============================================================================


@router.get("/status/{job_id}", response_model=DirectorStatusResponse)
async def get_director_status(job_id: str):
    """
    Get the status of an AI Director job.
    """
    job = director_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Determine current step description
    step_descriptions = {
        DirectorJobStatus.QUEUED: "Waiting in queue",
        DirectorJobStatus.TRANSCRIBING: "Transcribing audio with speaker identification",
        DirectorJobStatus.DIARIZING: "Identifying speakers",
        DirectorJobStatus.SELECTING_CLIPS: "AI selecting viral moments",
        DirectorJobStatus.TRACKING_FACES: "Tracking faces for smart cropping",
        DirectorJobStatus.GENERATING_LAYOUT: "Generating dynamic layouts",
        DirectorJobStatus.RENDERING: "Rendering vertical shorts",
        DirectorJobStatus.COMPLETED: "Processing complete",
        DirectorJobStatus.FAILED: f"Failed: {job.error}",
    }

    return DirectorStatusResponse(
        job_id=job_id,
        status=job.status,
        progress_percent=job.progress_percent,
        current_step=step_descriptions.get(job.status, "Processing"),
        viral_clips_found=len(job.viral_clips),
        shorts_rendered=len(job.shorts_rendered),
        error=job.error,
    )


@router.post("/select-clips", response_model=SelectClipsResponse)
async def select_clips_endpoint(request: SelectClipsRequest):
    """
    Select viral clips from an existing job.

    Use this to re-run clip selection with different parameters.
    """
    job = director_jobs.get(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    diarization = diarization_results.get(request.job_id)
    if not diarization:
        raise HTTPException(
            status_code=400,
            detail="Transcription not available. Process the video first.",
        )

    clip_selection = await select_viral_clips(
        transcript=diarization,
        job_id=request.job_id,
        max_clips=request.max_clips,
        min_duration=request.min_duration,
        max_duration=request.max_duration,
    )

    # Update stores
    viral_clips_store[request.job_id] = clip_selection
    job.viral_clips = clip_selection.clips

    return SelectClipsResponse(
        job_id=request.job_id,
        clips=clip_selection.clips,
        selection_reasoning=clip_selection.selection_reasoning,
        total_duration_analyzed=clip_selection.total_analyzed_duration,
    )


@router.get("/clips/{job_id}", response_model=SelectClipsResponse)
async def get_viral_clips(job_id: str):
    """
    Get the viral clips selected for a job.
    """
    selection = viral_clips_store.get(job_id)
    if not selection:
        raise HTTPException(status_code=404, detail="No clips found for this job")

    return SelectClipsResponse(
        job_id=job_id,
        clips=selection.clips,
        selection_reasoning=selection.selection_reasoning,
        total_duration_analyzed=selection.total_analyzed_duration,
    )


@router.get("/edl/{job_id}")
async def get_edit_decision_list(job_id: str):
    """
    Get the jump-cut Edit Decision List for a job.

    Returns keep ranges and cut information for rendering.
    """
    edl = edl_store.get(job_id)
    if not edl:
        raise HTTPException(status_code=404, detail="No EDL found for this job")

    zoom_points = get_zoom_cut_points(edl)

    return {
        "job_id": job_id,
        "edl": edl.model_dump(),
        "zoom_cut_points": zoom_points,
    }


@router.get("/diarization/{job_id}")
async def get_diarization_result(job_id: str):
    """
    Get the diarization result for a job.

    Returns speaker segments and word-level timestamps.
    """
    diarization = diarization_results.get(job_id)
    if not diarization:
        raise HTTPException(status_code=404, detail="No diarization found for this job")

    return diarization.model_dump()


# ============================================================================
# Render Endpoints (Placeholder for Week 2)
# ============================================================================


@router.post("/render-short", response_model=RenderShortResponse)
async def render_short(request: RenderShortRequest):
    """
    Render a single viral short using Remotion.

    This endpoint triggers Remotion rendering with:
    - Smart cropping based on face tracking
    - Animated captions
    - Jump-cut editing
    - 9:16 vertical format
    """
    job = director_jobs.get(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Find the requested clip
    clip = next((c for c in job.viral_clips if c.id == request.clip_id), None)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    # TODO: Implement Remotion rendering in Week 2
    # For now, return a placeholder response

    return RenderShortResponse(
        job_id=request.job_id,
        clip_id=request.clip_id,
        video_url=f"/api/director/shorts/{request.job_id}/{request.clip_id}.mp4",
        duration=clip.duration,
        render_time_seconds=0.0,
    )


@router.get("/jobs")
async def list_director_jobs():
    """
    List all AI Director jobs.
    """
    jobs = []
    for job_id, job in director_jobs.items():
        jobs.append(
            {
                "job_id": job_id,
                "status": job.status.value,
                "progress_percent": job.progress_percent,
                "viral_clips_found": len(job.viral_clips),
                "shorts_rendered": len(job.shorts_rendered),
                "created_at": job.created_at.isoformat(),
            }
        )

    # Sort by creation date (newest first)
    jobs.sort(key=lambda j: j["created_at"], reverse=True)

    return {"jobs": jobs}


@router.delete("/job/{job_id}")
async def delete_director_job(job_id: str):
    """
    Delete an AI Director job and associated data.
    """
    if job_id in director_jobs:
        job = director_jobs[job_id]

        # Clean up files
        for video_path in job.input_videos:
            if os.path.exists(video_path):
                try:
                    os.remove(video_path)
                except Exception as e:
                    logger.warning(f"Failed to delete {video_path}: {e}")

        del director_jobs[job_id]

    if job_id in diarization_results:
        del diarization_results[job_id]

    if job_id in viral_clips_store:
        del viral_clips_store[job_id]

    if job_id in edl_store:
        del edl_store[job_id]

    return {"message": f"Job {job_id} deleted"}
