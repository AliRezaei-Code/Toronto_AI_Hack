import os
import uuid
import shutil
import logging
import json
from datetime import datetime
from pathlib import Path
from typing import List
from glob import glob

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx

from app.models import UploadResponse, EditResponse, JobStatus, Transcript, Word, TranscriptEditRequest
from app.state_manager import StateManager
from app.agent import run_agent
from utils.validator import VideoValidator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Video Editor Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SHARED_DATA_DIR = os.getenv(
    'SHARED_DATA_DIR',
    os.path.join(os.path.dirname(__file__), '..', '..', 'shared-data')
)
UPLOADS_DIR = os.path.join(SHARED_DATA_DIR, 'uploads')
PROCESSED_DIR = os.path.join(SHARED_DATA_DIR, 'processed')
TRANSCRIPTS_DIR = os.path.join(SHARED_DATA_DIR, 'transcripts')
SAMPLE_VIDEOS_DIR = os.path.join(SHARED_DATA_DIR, 'sample-videos')
SAMPLE_CLIPS_DIR = os.path.join(SAMPLE_VIDEOS_DIR, 'clips')
SAMPLE_TRANSCRIPTS_DIR = os.path.join(SAMPLE_VIDEOS_DIR, 'transcripts')
MCP_SERVER_URL = os.getenv('MCP_SERVER_URL', 'http://localhost:9000')

for dir_path in [UPLOADS_DIR, PROCESSED_DIR, TRANSCRIPTS_DIR]:
    Path(dir_path).mkdir(parents=True, exist_ok=True)

state_manager = StateManager(TRANSCRIPTS_DIR)

processing_jobs = {}

def _get_demo_clips() -> List[str]:
    supported_extensions = ['.mp4', '.mov', '.webm', '.avi']
    clip_files = []
    
    for ext in supported_extensions:
        clip_files.extend(glob(os.path.join(SAMPLE_CLIPS_DIR, f'clip_*{ext}')))
    
    return sorted(set(clip_files))

@app.get("/")
async def root():
    return {
        "message": "Video Editor Backend API",
        "version": "2.0.0",
        "endpoints": {
            "upload": "/api/upload",
            "status": "/api/job/{job_id}/status",
            "video": "/api/video/{job_id}",
            "transcript": "/api/transcript/{job_id}",
            "query": "/api/agent/query",
            "recommendations": "/api/recommendations",
            "demo": "/api/demo",
        }
    }

@app.get("/api/recommendations")
async def get_recommendations():
    """Get upload recommendations and guidelines."""
    from utils.validator import VideoValidator
    
    validator = VideoValidator()
    
    return {
        "recommendations": validator.get_validation_recommendations(),
        "limits": {
            "max_file_size_mb": validator.MAX_FILE_SIZE / (1024 * 1024),
            "max_duration_seconds": validator.MAX_DURATION,
            "recommended_duration_seconds": validator.RECOMMENDED_DURATION,
            "min_clips": 3,
            "max_clips": 5,
        },
        "supported_formats": list(validator.SUPPORTED_FORMATS)
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/upload", response_model=UploadResponse)
async def upload_videos(
    background_tasks: BackgroundTasks,
    clip_0: UploadFile = File(...),
    clip_1: UploadFile = File(...),
    clip_2: UploadFile = File(...),
    clip_3: UploadFile | None = None,
    clip_4: UploadFile | None = None,
):
    """
    Upload 3-5 video clips for processing with validation.
    """
    validator = VideoValidator()
    clips = [clip_0, clip_1, clip_2, clip_3, clip_4]
    files = [f for f in clips if f is not None]
    
    if len(files) < 3 or len(files) > 5:
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
        
        background_tasks.add_task(
            process_uploads,
            job_id,
            uploaded_files,
            None
        )
        
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

@app.post("/api/demo", response_model=UploadResponse)
async def start_demo(background_tasks: BackgroundTasks):
    """
    Start a demo job using sample clips in shared-data/sample-videos/clips.
    """
    validator = VideoValidator()
    demo_clips = _get_demo_clips()
    
    if len(demo_clips) < 3:
        raise HTTPException(
            status_code=400,
            detail="Demo clips not found. Add 3-5 clips to shared-data/sample-videos/clips."
        )
    
    job_id = str(uuid.uuid4())
    uploaded_files = []
    
    try:
        for i, clip_path in enumerate(demo_clips[:5]):
            file_extension = Path(clip_path).suffix
            filename = f"{job_id}_demo_{i}{file_extension}"
            file_path = os.path.join(UPLOADS_DIR, filename)
            
            shutil.copy2(clip_path, file_path)
            
            is_valid, error_msg = validator.validate_file(file_path, check_duration=True)
            if not is_valid:
                os.remove(file_path)
                raise HTTPException(
                    status_code=400,
                    detail=f"Demo clip validation failed: {error_msg}"
                )
            
            uploaded_files.append(file_path)
        
        await state_manager.save_job(job_id, {
            'job_id': job_id,
            'status': 'processing',
            'uploaded_files': uploaded_files,
            'created_at': datetime.utcnow().isoformat(),
            'demo_mode': True,
        })
        
        processing_jobs[job_id] = True
        
        preset_transcript_path = os.path.join(SAMPLE_TRANSCRIPTS_DIR, 'demo_transcript.json')
        if not os.path.exists(preset_transcript_path):
            preset_transcript_path = None
        
        background_tasks.add_task(
            process_uploads,
            job_id,
            uploaded_files,
            preset_transcript_path
        )
        
        return UploadResponse(
            job_id=job_id,
            message="Demo clips loaded. Processing started."
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
        logger.error(f"Demo processing error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Demo failed to start due to server error. Please try again."
        )

async def process_uploads(job_id: str, clip_paths: List[str], preset_transcript_path: str | None = None):
    """
    Process uploaded clips: stitch and generate transcript.
    """
    try:
        async with httpx.AsyncClient(timeout=300) as client:
            stitch_response = await client.post(
                f'{MCP_SERVER_URL}/tool/stitch_clips',
                json={
                    'clip_paths': clip_paths,
                    'transition_type': 'crossfade',
                    'transition_duration': 0.5
                }
            )
            
            if stitch_response.status_code != 200:
                raise Exception(f"Stitching failed: {stitch_response.text}")
            
            stitch_result = stitch_response.json()
            stitched_video_path = stitch_result['data']['output_path']
            
            transcript = None
            transcript_warning = None
            
            if preset_transcript_path and os.path.exists(preset_transcript_path):
                try:
                    with open(preset_transcript_path, 'r') as f:
                        transcript_data = json.load(f)
                    
                    transcript = Transcript(
                        text=transcript_data.get('text'),
                        words=[Word(**w) for w in transcript_data.get('words', [])],
                        duration=transcript_data.get('duration')
                    )
                    
                    await state_manager.save_transcript(job_id, transcript)
                    logger.info(f"Preset transcript loaded for job {job_id}")
                except Exception as e:
                    logger.warning(f"Preset transcript load failed for job {job_id}: {str(e)}")
                    transcript_warning = "Preset transcript unavailable. Falling back to AI transcription."
            
            if transcript is None:
                try:
                    transcript_response = await client.post(
                        f'{MCP_SERVER_URL}/tool/generate_transcript',
                        json={'video_path': stitched_video_path},
                        timeout=180
                    )
                    
                    if transcript_response.status_code == 200:
                        transcript_result = transcript_response.json()
                        transcript_data = transcript_result['data']
                        
                        transcript = Transcript(
                            text=transcript_data.get('text'),
                            words=[Word(**w) for w in transcript_data.get('words', [])],
                            duration=transcript_data.get('duration')
                        )
                        
                        await state_manager.save_transcript(job_id, transcript)
                        logger.info(f"Transcript generated successfully for job {job_id}")
                    else:
                        transcript_warning = "Transcription service unavailable. Script-based editing will be disabled."
                        logger.warning(f"Transcription failed for job {job_id}: {transcript_response.text}")
                        
                except Exception as e:
                    transcript_warning = f"Transcription failed: {str(e)}. Script-based editing will be disabled."
                    logger.warning(f"Transcription error for job {job_id}: {str(e)}")
            
            job_data = await state_manager.load_job(job_id)
            if job_data:
                new_job_data = job_data.copy()
                new_job_data['status'] = 'completed'
                new_job_data['current_video_path'] = stitched_video_path
                if transcript_warning:
                    new_job_data['warning'] = transcript_warning
                await state_manager.save_job(job_id, new_job_data)
            
            for clip_path in clip_paths:
                if os.path.exists(clip_path):
                    os.remove(clip_path)
            
    except Exception as e:
        logger.error(f"Error processing job {job_id}: {str(e)}", exc_info=True)
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

@app.get("/api/job/{job_id}/status", response_model=JobStatus)
async def get_job_status(job_id: str):
    """
    Get the status of a processing job.
    """
    job_data = await state_manager.load_job(job_id)
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    video_url = None
    transcript = None
    
    if job_data['status'] == 'completed' and 'current_video_path' in job_data:
        video_url = f"/api/video/{job_id}"
        transcript = await state_manager.load_transcript(job_id)
    
    return JobStatus(
        status=job_data['status'],
        video_url=video_url,
        transcript=transcript,
        error=job_data.get('error'),
        warning=job_data.get('warning')
    )

@app.get("/api/video/{job_id}")
async def get_video(job_id: str):
    """
    Stream the processed video for a job.
    """
    from fastapi.responses import FileResponse
    
    job_data = await state_manager.load_job(job_id)
    
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

@app.get("/api/transcript/{job_id}")
async def get_transcript(job_id: str):
    """
    Get the transcript for a job.
    """
    transcript = await state_manager.load_transcript(job_id)
    
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    return transcript

@app.post("/api/agent/query", response_model=EditResponse)
async def process_agent_query(request: dict):
    """
    Process a natural language edit query using the agent.
    """
    job_id = request.get('job_id')
    query = request.get('query')
    
    if not job_id or not query:
        raise HTTPException(
            status_code=400,
            detail="Both job_id and query are required"
        )
    
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

@app.delete("/api/job/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a job and all associated files.
    """
    job_data = await state_manager.load_job(job_id)
    
    if job_data:
        video_path = job_data.get('current_video_path')
        upload_files = job_data.get('uploaded_files', [])
        
        for file_path in [video_path] + upload_files:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
    
    await state_manager.delete_job(job_id)
    
    return {"message": f"Job {job_id} deleted"}

@app.post("/api/transcript/{job_id}/edit", response_model=EditResponse)
async def edit_transcript_text(request: TranscriptEditRequest):
    """
    Edit the transcript text directly and regenerate the video.
    This enables script-based editing where text changes affect the video.
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
