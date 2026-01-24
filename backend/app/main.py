import os
import uuid
import shutil
import logging
import asyncio
from datetime import datetime
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import httpx

from app.models import (
    UploadResponse,
    EditResponse,
    JobStatus,
    Transcript,
    Word,
    Segment,
    Clip,
    TranscriptEditRequest,
    AgentQueryRequest,
    RecommendationsResponse,
    LimitsInfo,
    RootResponse,
    HealthResponse,
    DeleteJobResponse,
    ErrorResponse,
    ListJobsResponse,
    JobSummary,
    CreatorContext,
    SmartMergeRequest,
    SmartMergeResponse,
)
from app.state_manager import StateManager
from app.agent import run_agent
from app.context_detector import detect_creator_context
from app.smart_merge import analyze_and_reorder_segments, build_transcript_from_segments
from utils.validator import VideoValidator
from utils.segmentation import segment_clip_into_phrases, build_hierarchical_transcript

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# OpenAPI Tags for grouping endpoints
tags_metadata = [
    {
        "name": "Health",
        "description": "Health check and system status endpoints.",
    },
    {
        "name": "Upload",
        "description": "Upload video clips for processing.",
    },
    {
        "name": "Jobs",
        "description": "Job status and management operations.",
    },
    {
        "name": "Videos",
        "description": "Video retrieval and streaming.",
    },
    {
        "name": "Transcripts",
        "description": "Transcript retrieval and editing operations.",
    },
    {
        "name": "Agent",
        "description": "AI-powered natural language video editing.",
    },
    {
        "name": "Smart Merge",
        "description": "LLM-powered one-shot video optimization with hook-first ordering.",
    },
]

app = FastAPI(
    title="Video Editor Backend API",
    description="""
## Video Editor Backend API

A powerful API for uploading, processing, and editing video clips using AI-powered transcript editing.

### Features

* **Video Upload**: Upload 3-5 video clips that will be automatically stitched together
* **Automatic Transcription**: AI-powered speech-to-text transcription with word-level timing
* **Natural Language Editing**: Use plain English to describe edits (e.g., "Remove all filler words")
* **Script-Based Editing**: Edit the transcript directly and the video will update accordingly

### Workflow

1. Upload 3-5 video clips using `/api/upload`
2. Poll `/api/job/{job_id}/status` until processing completes
3. View the stitched video at `/api/video/{job_id}`
4. Use `/api/agent/query` for natural language editing
5. Or use `/api/transcript/{job_id}/edit` for script-based editing
    """,
    version="2.0.0",
    openapi_tags=tags_metadata,
    license_info={
        "name": "MIT",
    },
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        404: {"model": ErrorResponse, "description": "Not Found"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_shared_data_env = os.getenv('SHARED_DATA_DIR')
server_url = os.getenv('SERVER_URL', "http://localhost:8000")
if _shared_data_env:
    SHARED_DATA_DIR = os.path.abspath(_shared_data_env)
else:
    SHARED_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'shared-data'))
UPLOADS_DIR = os.path.join(SHARED_DATA_DIR, 'uploads')
PROCESSED_DIR = os.path.join(SHARED_DATA_DIR, 'processed')
TRANSCRIPTS_DIR = os.path.join(SHARED_DATA_DIR, 'transcripts')
MCP_SERVER_URL = os.getenv('MCP_SERVER_URL', 'http://localhost:9000')

# Log configuration at startup
logger.info(f"[CONFIG] SHARED_DATA_DIR: {SHARED_DATA_DIR}")
logger.info(f"[CONFIG] UPLOADS_DIR: {UPLOADS_DIR}")
logger.info(f"[CONFIG] PROCESSED_DIR: {PROCESSED_DIR}")
logger.info(f"[CONFIG] TRANSCRIPTS_DIR: {TRANSCRIPTS_DIR}")
logger.info(f"[CONFIG] MCP_SERVER_URL: {MCP_SERVER_URL}")

for dir_path in [UPLOADS_DIR, PROCESSED_DIR, TRANSCRIPTS_DIR]:
    Path(dir_path).mkdir(parents=True, exist_ok=True)

state_manager = StateManager(TRANSCRIPTS_DIR)

processing_jobs = {}

@app.get(
    "/",
    response_model=RootResponse,
    tags=["Health"],
    summary="API Root",
    description="Get API information and available endpoints.",
)
async def root():
    """
    Returns basic API information and a list of available endpoints.
    """
    return RootResponse(
        message="Video Editor Backend API",
        version="2.0.0",
        endpoints={
            "upload": "/api/upload",
            "status": "/api/job/{job_id}/status",
            "video": "/api/video/{job_id}",
            "transcript": "/api/transcript/{job_id}",
            "query": "/api/agent/query",
            "recommendations": "/api/recommendations",
        }
    )

@app.get(
    "/api/recommendations",
    response_model=RecommendationsResponse,
    tags=["Upload"],
    summary="Get Upload Recommendations",
    description="Get recommendations and guidelines for optimal video uploads.",
)
async def get_recommendations():
    """
    Returns upload recommendations, file size limits, duration limits,
    and supported video formats.
    """
    validator = VideoValidator()
    
    return RecommendationsResponse(
        recommendations=validator.get_validation_recommendations(),
        limits=LimitsInfo(
            max_file_size_mb=validator.MAX_FILE_SIZE / (1024 * 1024),
            max_duration_seconds=validator.MAX_DURATION,
            recommended_duration_seconds=validator.RECOMMENDED_DURATION,
            min_clips=3,
            max_clips=5,
        ),
        supported_formats=list(validator.SUPPORTED_FORMATS)
    )


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health Check",
    description="Check if the API is running and healthy.",
)
async def health():
    """
    Returns the health status of the API.
    """
    return HealthResponse(status="healthy")


@app.get(
    "/api/jobs",
    response_model=ListJobsResponse,
    tags=["Jobs"],
    summary="List All Jobs",
    description="Get a list of all jobs with their metadata, sorted by creation date (newest first).",
)
async def list_jobs():
    """
    List all jobs with their metadata including status and creation time.
    
    Jobs are sorted by creation date (newest first).
    """
    job_ids = await state_manager.list_jobs()
    jobs = []
    for job_id in job_ids:
        job_data = await state_manager.load_job(job_id)
        if job_data:
            jobs.append(JobSummary(
                job_id=job_id,
                status=job_data.get("status"),
                created_at=job_data.get("created_at"),
            ))
    # Sort by created_at descending (newest first)
    jobs.sort(key=lambda x: x.created_at or "", reverse=True)
    return ListJobsResponse(jobs=jobs)


@app.post(
    "/api/upload",
    response_model=UploadResponse,
    tags=["Upload"],
    summary="Upload Video Clips",
    description="Upload 3-5 video clips for processing. Clips will be stitched together and transcribed.",
    responses={
        200: {"description": "Upload successful, processing started"},
        400: {"model": ErrorResponse, "description": "Invalid file format or validation failed"},
        500: {"model": ErrorResponse, "description": "Server error during upload"},
    },
)
async def upload_videos(
    background_tasks: BackgroundTasks,
    clip_0: UploadFile = File(..., description="First video clip (required)"),
    clip_1: UploadFile = File(..., description="Second video clip (required)"),
    clip_2: UploadFile = File(..., description="Third video clip (required)"),
    clip_3: UploadFile | None = File(None, description="Fourth video clip (optional)"),
    clip_4: UploadFile | None = File(None, description="Fifth video clip (optional)"),
):
    """
    Upload 3-5 video clips for processing.
    
    The clips will be:
    1. Validated for format and duration
    2. Transcribed in parallel using AI speech-to-text
    3. Segmented into phrases based on speech pauses
    4. Concatenated with straight cuts (no transitions)
    5. Transcripts merged with timestamp offsets
    
    Use the returned `job_id` to check status and retrieve results.
    """
    print("starting upload_videos")
    validator = VideoValidator()
    clips = [clip_0, clip_1, clip_2, clip_3, clip_4]
    files = [f for f in clips if f is not None]
    
    if len(files) < 0 or len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail="Please upload between 3 and 5 video clips"
        )
    
    job_id = str(uuid.uuid4())
    uploaded_files = []
    
    try:
        for i, file in enumerate(files):
            file_extension = Path(file.filename or '').suffix
            
            # Validate file extension
            if file_extension not in validator.SUPPORTED_FORMATS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format: {file_extension}. Supported formats: {', '.join(validator.SUPPORTED_FORMATS)}"
                )
            
            filename = f"{job_id}_clip_{i}{file_extension}"
            file_path = os.path.join(UPLOADS_DIR, filename)
            
            with open(file_path, 'wb') as f:
                shutil.copyfileobj(file.file, f)
            
            # Validate the saved file
            is_valid, error_msg = validator.validate_file(file_path, check_duration=True)
            if not is_valid:
                os.remove(file_path)
                raise HTTPException(
                    status_code=400,
                    detail=f"Validation failed for {file.filename}: {error_msg}"
                )
            
            uploaded_files.append(file_path)
        
        await state_manager.save_job(job_id, {
            'job_id': job_id,
            'status': 'processing',
            'uploaded_files': uploaded_files,
            'created_at': datetime.utcnow().isoformat()
        })
        
        processing_jobs[job_id] = True
        
        logger.info(f"[upload_videos] Scheduling background task for job_id={job_id}")
        background_tasks.add_task(
            process_uploads,
            job_id,
            uploaded_files
        )
        logger.info(f"[upload_videos] Background task scheduled, returning response")
        
        return UploadResponse(
            job_id=job_id,
            message="Videos uploaded and processing started"
        )
    
    except HTTPException:
        for file_path in uploaded_files:
            if os.path.exists(file_path):
                os.remove(file_path)
        raise
    except Exception as e:
        for file_path in uploaded_files:
            if os.path.exists(file_path):
                os.remove(file_path)
        logger.error(f"Upload processing error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed due to server error. Please try again."
        )

async def process_uploads(job_id: str, clip_paths: List[str]):
    """
    Process uploaded clips: transcribe, segment, smart merge, render directly from clips.
    
    Pipeline:
    1. Transcribe all clips in PARALLEL
    2. Segment each clip (pause detection)
    3. Build transcript with LOCAL timestamps (no stitching)
    4. Smart merge LLM to reorder segments
    5. Render directly from clips (no intermediate stitch)
    """
    logger.info(f"[process_uploads] START - job_id={job_id}, clips={clip_paths}")
    try:
        logger.info(f"[process_uploads] Connecting to MCP server at {MCP_SERVER_URL}")
        async with httpx.AsyncClient(timeout=300) as client:
            # ================================================================
            # STEP 1: Parallel transcription of all clips
            # ================================================================
            logger.info(f"[process_uploads] Starting PARALLEL transcription of {len(clip_paths)} clips")
            
            transcript_tasks = [
                client.post(
                    f'{MCP_SERVER_URL}/tool/generate_transcript',
                    json={'video_path': clip},
                    timeout=180
                )
                for clip in clip_paths
            ]
            transcript_responses = await asyncio.gather(*transcript_tasks)
            
            # ================================================================
            # STEP 1.5: Detect creator context in parallel (using first transcript)
            # ================================================================
            first_transcript_text = transcript_responses[0].json()['data'].get('text', '')
            context_task = asyncio.create_task(detect_creator_context(first_transcript_text))
            logger.info(f"[process_uploads] Started context detection in background")
            
            # ================================================================
            # STEP 2: Process each transcript and segment immediately
            # ================================================================
            clip_data = []
            
            for i, response in enumerate(transcript_responses):
                data = response.json()['data']
                words = data.get('words', [])
                
                # Segment THIS clip immediately (fast, CPU-only)
                # Timestamps stay LOCAL to each clip
                segments = segment_clip_into_phrases(words, min_pause_seconds=0.5)
                logger.info(f"[process_uploads] Clip {i}: {len(words)} words, {len(segments)} segments")
                
                clip_data.append({
                    'clip_index': i,
                    'text': data.get('text', ''),
                    'words': words,
                    'segments': segments,
                    'duration': data.get('duration', 0.0)
                })
            
            # ================================================================
            # STEP 3: Build transcript with LOCAL timestamps (no offsets)
            # ================================================================
            clip_data.sort(key=lambda x: x['clip_index'])
            
            # Build transcript WITHOUT cumulative offsets - timestamps stay local to each clip
            clips = []
            all_texts = []
            total_duration = 0.0
            
            for cd in clip_data:
                all_texts.append(cd.get('text', ''))
                clip_duration = cd.get('duration', 0.0)
                total_duration += clip_duration
                
                segments = []
                for seg in cd.get('segments', []):
                    segments.append(Segment(
                        text=seg['text'],
                        start=seg['start'],  # LOCAL timestamp
                        end=seg['end'],       # LOCAL timestamp
                        words=[Word(**w) for w in seg.get('words', [])]
                    ))
                
                clips.append(Clip(
                    clip_index=cd['clip_index'],
                    duration=clip_duration,
                    start_offset=0.0,  # Not used for local timestamps
                    segments=segments
                ))
            
            transcript = Transcript(
                text=' '.join(all_texts),
                duration=total_duration,
                clips=clips
            )
            
            logger.info(f"[process_uploads] Built transcript: {len(clips)} clips, {sum(len(c.segments) for c in clips)} segments")
            
            # ================================================================
            # STEP 4: Wait for context and run Smart Merge
            # ================================================================
            try:
                creator_context = await context_task
                if creator_context:
                    await state_manager.save_context(job_id, creator_context)
                    logger.info(f"[process_uploads] Context: {creator_context.industry}, hook={creator_context.suggested_hook_style}")
            except Exception as ctx_err:
                logger.warning(f"[process_uploads] Context detection failed, using defaults: {ctx_err}")
                creator_context = CreatorContext(
                    industry="general",
                    role="creator",
                    target_audience="general audience",
                    tone="professional",
                    suggested_hook_style="results-driven"
                )
            
            # Run smart merge LLM
            logger.info(f"[process_uploads] Running smart merge LLM...")
            merge_result = await analyze_and_reorder_segments(transcript, creator_context)
            
            if not merge_result['segments']:
                raise Exception("Smart merge produced no segments")
            
            logger.info(f"[process_uploads] Smart merge: {len(merge_result['segments'])} segments, ~{merge_result['estimated_duration']:.1f}s")
            
            # ================================================================
            # STEP 5: Render directly from clips (no intermediate stitch)
            # ================================================================
            segments_for_render = [
                {
                    'clip_index': seg.clip_index,
                    'start': seg.start,
                    'end': seg.end,
                    'label': seg.label
                }
                for seg in merge_result['segments']
            ]
            
            logger.info(f"[process_uploads] Calling /tool/render_from_clips...")
            render_response = await client.post(
                f'{MCP_SERVER_URL}/tool/render_from_clips',
                json={
                    'segments': segments_for_render,
                    'clip_paths': clip_paths
                },
                timeout=180
            )
            
            if render_response.status_code != 200:
                logger.error(f"[process_uploads] Render failed: {render_response.text}")
                raise Exception(f"Rendering failed: {render_response.text}")
            
            render_result = render_response.json()
            final_video_path = render_result['data']['output_path']
            logger.info(f"[process_uploads] Render complete: {final_video_path}")
            
            # ================================================================
            # STEP 6: Build final transcript and save
            # ================================================================
            final_transcript = build_transcript_from_segments(transcript, merge_result['segments'])
            await state_manager.save_transcript(job_id, final_transcript)
            logger.info(f"[process_uploads] Final transcript saved")
            
            # ================================================================
            # STEP 7: Update job status
            # ================================================================
            job_data = await state_manager.load_job(job_id)
            if job_data:
                new_job_data = job_data.copy()
                new_job_data['status'] = 'completed'
                new_job_data['current_video_path'] = final_video_path
                await state_manager.save_job(job_id, new_job_data)
                logger.info(f"[process_uploads] Job {job_id} marked as completed")
            
            # Clean up uploaded clips AFTER rendering
            for clip_path in clip_paths:
                if os.path.exists(clip_path):
                    os.remove(clip_path)
            
            logger.info(f"[process_uploads] SUCCESS - job_id={job_id}")
            
    except Exception as e:
        logger.error(f"[process_uploads] FAILED - job_id={job_id}, error: {str(e)}", exc_info=True)
        job_data = await state_manager.load_job(job_id)
        if job_data:
            new_job_data = job_data.copy()
            new_job_data['status'] = 'error'
            
            # User-friendly error messages
            error_msg = str(e)
            if 'rate limit' in error_msg.lower():
                new_job_data['error'] = "API rate limit exceeded. Please try again in a few minutes."
            elif 'timeout' in error_msg.lower():
                new_job_data['error'] = "Processing timed out. Try shorter videos or fewer clips."
            elif 'file not found' in error_msg.lower():
                new_job_data['error'] = "Video file could not be processed. Please check the file format."
            else:
                new_job_data['error'] = "Processing failed. Please try uploading again."
                
            await state_manager.save_job(job_id, new_job_data)
    
    finally:
        processing_jobs.pop(job_id, None)

@app.get(
    "/api/job/{job_id}/status",
    response_model=JobStatus,
    tags=["Jobs"],
    summary="Get Job Status",
    description="Check the processing status of an upload job.",
    responses={
        200: {"description": "Job status retrieved successfully"},
        404: {"model": ErrorResponse, "description": "Job not found"},
    },
)
async def get_job_status(job_id: str):
    """
    Get the current status of a processing job.
    
    Status values:
    - `processing`: Video is being stitched and transcribed
    - `completed`: Processing finished, video and transcript available
    - `error`: Processing failed, check the error field for details
    """
    job_data = await state_manager.load_job(job_id)
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    logger.info(f"job_data: server_url={server_url}")
    video_url = None
    transcript = None
    creator_context = None
    print("server_url", server_url)
    if job_data['status'] == 'completed' and 'current_video_path' in job_data:
        video_url = f"{server_url}/api/video/{job_id}"
        transcript = await state_manager.load_transcript(job_id)
        # Load creator context if available
        ctx = await state_manager.load_context(job_id)
        if ctx:
            creator_context = ctx.model_dump()
    
    return JobStatus(
        status=job_data['status'],
        video_url=video_url,
        transcript=transcript,
        creator_context=creator_context,
        error=job_data.get('error')
    )

@app.get(
    "/api/video/{job_id}",
    tags=["Videos"],
    summary="Get Video",
    description="Stream or download the processed video.",
    responses={
        200: {"description": "Video file", "content": {"video/mp4": {}}},
        404: {"model": ErrorResponse, "description": "Video not found or job not completed"},
    },
)
async def get_video(job_id: str):
    """
    Stream the processed video for a completed job.
    
    Returns the video file as an MP4 stream.
    """
    job_data = await state_manager.load_job(job_id)
    print("job_data", job_data)
    if not job_data or job_data['status'] != 'completed':
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_path = job_data.get('current_video_path')
    
    if not video_path or not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        video_path,
        media_type='video/mp4',
        filename=f"video_{job_id}.mp4"
    )

@app.get(
    "/api/transcript/{job_id}",
    response_model=Transcript,
    tags=["Transcripts"],
    summary="Get Transcript",
    description="Retrieve the transcript for a completed job.",
    responses={
        200: {"description": "Transcript retrieved successfully"},
        404: {"model": ErrorResponse, "description": "Transcript not found"},
    },
)
async def get_transcript(job_id: str):
    """
    Get the transcript for a completed job.
    
    Returns word-level transcript with timing information.
    """
    transcript = await state_manager.load_transcript(job_id)
    
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    return transcript

@app.post(
    "/api/agent/query",
    response_model=EditResponse,
    tags=["Agent"],
    summary="Natural Language Edit",
    description="Edit video using natural language instructions.",
    responses={
        200: {"description": "Edit completed successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request or job still processing"},
        404: {"model": ErrorResponse, "description": "Job not found"},
        500: {"model": ErrorResponse, "description": "Agent processing failed"},
    },
)
async def process_agent_query(request: AgentQueryRequest):
    """
    Process a natural language edit query using the AI agent.
    
    Example queries:
    - "Remove all filler words like um and uh"
    - "Cut out the section where I talk about pricing"
    - "Keep only the introduction and conclusion"
    - "Remove awkward pauses longer than 2 seconds"
    """
    job_id = request.job_id
    query = request.query
    
    job_data = await state_manager.load_job(job_id)
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job_data['status'] != 'completed':
        raise HTTPException(
            status_code=400,
            detail="Job is still processing"
        )
    
    try:
        current_video_path = job_data.get('current_video_path')
        if not current_video_path:
            raise HTTPException(status_code=400, detail="No video found for this job")
        
        result = await run_agent(
            job_id=job_id,
            query=query,
            current_video_path=current_video_path
        )
        
        updated_transcript = Transcript(
            words=[Word(**w) for w in result['transcript_words']]
        )
        
        return EditResponse(
            video_url=f"/api/video/{job_id}",
            transcript=updated_transcript,
            message=result['message']
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Agent processing failed: {str(e)}"
        )


@app.post(
    "/api/smart-merge",
    response_model=SmartMergeResponse,
    tags=["Smart Merge"],
    summary="Smart Merge Video",
    description="LLM-powered one-shot optimization that reorders segments with the strongest hook first and tight cuts.",
    responses={
        200: {"description": "Smart merge completed successfully"},
        400: {"model": ErrorResponse, "description": "Job still processing or missing data"},
        404: {"model": ErrorResponse, "description": "Job not found"},
        500: {"model": ErrorResponse, "description": "Smart merge failed"},
    },
)
async def smart_merge(request: SmartMergeRequest):
    """
    Perform LLM-powered smart merge on a completed job.
    
    This one-shot operation:
    1. Loads the transcript and auto-detected creator context
    2. Uses LLM to identify the strongest hook segment
    3. Reorders segments for optimal narrative flow
    4. Trims segments tightly using word-level timestamps
    5. Renders the final optimized video
    
    The result is a snappy, hook-first video optimized for engagement.
    """
    job_id = request.job_id
    
    job_data = await state_manager.load_job(job_id)
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job_data['status'] != 'completed':
        raise HTTPException(status_code=400, detail="Job is still processing")
    
    current_video_path = job_data.get('current_video_path')
    if not current_video_path:
        raise HTTPException(status_code=400, detail="No video found for this job")
    
    # Load transcript
    transcript = await state_manager.load_transcript(job_id)
    if not transcript or not transcript.clips:
        raise HTTPException(status_code=400, detail="No transcript available for smart merge")
    
    # Load creator context (use defaults if not available)
    creator_context = await state_manager.load_context(job_id)
    if not creator_context:
        logger.warning(f"[smart_merge] No context found for job {job_id}, using defaults")
        creator_context = CreatorContext(
            industry="general",
            role="creator",
            target_audience="general audience",
            tone="professional",
            suggested_hook_style="results-driven"
        )
    
    try:
        # Run LLM analysis to determine optimal segment ordering
        logger.info(f"[smart_merge] Starting LLM analysis for job {job_id}")
        merge_result = await analyze_and_reorder_segments(transcript, creator_context)
        
        if not merge_result['edit_instructions']:
            raise HTTPException(status_code=500, detail="Smart merge produced no segments")
        
        # Call MCP server to render the reordered timeline
        logger.info(f"[smart_merge] Rendering {len(merge_result['edit_instructions'])} segments")
        async with httpx.AsyncClient(timeout=300) as client:
            render_response = await client.post(
                f'{MCP_SERVER_URL}/tool/render_timeline',
                json={
                    'edit_instructions': [
                        {'type': inst.type, 'start': inst.start, 'end': inst.end}
                        for inst in merge_result['edit_instructions']
                    ],
                    'source_video': current_video_path
                }
            )
            
            if render_response.status_code != 200:
                raise Exception(f"Render failed: {render_response.text}")
            
            render_result = render_response.json()
            new_video_path = render_result['data']['output_path']
        
        # Build new transcript from kept segments
        new_transcript = build_transcript_from_segments(transcript, merge_result['segments'])
        
        # Update job with new video path
        job_data['current_video_path'] = new_video_path
        await state_manager.save_job(job_id, job_data)
        
        # Save the new transcript
        await state_manager.save_transcript(job_id, new_transcript)
        
        logger.info(f"[smart_merge] SUCCESS - job {job_id}, {len(merge_result['segments'])} segments, ~{merge_result['estimated_duration']}s")
        
        return SmartMergeResponse(
            video_url=f"{server_url}/api/video/{job_id}",
            transcript=new_transcript,
            creator_context=creator_context,
            reasoning=merge_result['reasoning'],
            segments_used=merge_result['segments'],
            estimated_duration=merge_result['estimated_duration'],
            message=f"Smart merge complete: {len(merge_result['segments'])} segments reordered with hook first"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[smart_merge] FAILED - job {job_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Smart merge failed: {str(e)}"
        )


@app.delete(
    "/api/job/{job_id}",
    response_model=DeleteJobResponse,
    tags=["Jobs"],
    summary="Delete Job",
    description="Delete a job and all associated files.",
    responses={
        200: {"description": "Job deleted successfully"},
    },
)
async def delete_job(job_id: str):
    """
    Delete a job and all associated files.
    
    This will remove:
    - The processed video file
    - Any uploaded clip files
    - The transcript data
    - Job metadata
    """
    job_data = await state_manager.load_job(job_id)
    
    if job_data:
        video_path = job_data.get('current_video_path')
        upload_files = job_data.get('uploaded_files', [])
        
        for file_path in [video_path] + upload_files:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
    
    await state_manager.delete_job(job_id)
    
    return DeleteJobResponse(message=f"Job {job_id} deleted")

@app.post(
    "/api/transcript/{job_id}/edit",
    response_model=EditResponse,
    tags=["Transcripts"],
    summary="Edit Transcript",
    description="Edit the transcript directly to modify the video.",
    responses={
        200: {"description": "Edit completed successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request, job still processing, or no transcript available"},
        404: {"model": ErrorResponse, "description": "Job not found"},
        500: {"model": ErrorResponse, "description": "Edit processing failed"},
    },
)
async def edit_transcript_text(request: TranscriptEditRequest):
    """
    Edit the transcript text directly and regenerate the video.
    
    This enables script-based editing where text changes affect the video.
    Simply provide the edited transcript text, and the video will be
    re-cut to match the new text.
    """
    job_id = request.job_id
    edited_text = request.edited_text
    
    job_data = await state_manager.load_job(job_id)
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job_data['status'] != 'completed':
        raise HTTPException(status_code=400, detail="Job is still processing")
    
    try:
        current_transcript = await state_manager.load_transcript(job_id)
        
        if not current_transcript or not current_transcript.words:
            raise HTTPException(
                status_code=400,
                detail="No transcript available. Script-based editing requires a transcript."
            )
        
        current_video_path = job_data.get('current_video_path')
        if not current_video_path:
            raise HTTPException(status_code=400, detail="No video found for this job")
        
        result = await run_agent(
            job_id=job_id,
            query=f"Edit transcript to match: {edited_text}",
            current_video_path=current_video_path
        )
        
        updated_transcript = Transcript(
            words=[Word(**w) for w in result['transcript_words']]
        )
        
        return EditResponse(
            video_url=f"/api/video/{job_id}",
            transcript=updated_transcript,
            message=result['message']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to edit transcript: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)