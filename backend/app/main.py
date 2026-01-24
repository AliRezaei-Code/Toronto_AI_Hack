import os
import uuid
import shutil
from pathlib import Path
from typing import List

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx

from app.models import UploadResponse, EditResponse, JobStatus, Transcript, Word
from app.state_manager import StateManager
from app.agent import run_agent

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
MCP_SERVER_URL = os.getenv('MCP_SERVER_URL', 'http://localhost:9000')

for dir_path in [UPLOADS_DIR, PROCESSED_DIR, TRANSCRIPTS_DIR]:
    Path(dir_path).mkdir(parents=True, exist_ok=True)

state_manager = StateManager(TRANSCRIPTS_DIR)

processing_jobs = {}

@app.get("/")
async def root():
    return {"message": "Video Editor Backend API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/upload", response_model=UploadResponse)
async def upload_videos(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    """
    Upload 3-5 video clips for processing.
    """
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
            if file_extension not in ['.mp4', '.mov', '.webm', '.avi']:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format: {file.filename}"
                )
            
            filename = f"{job_id}_clip_{i}{file_extension}"
            file_path = os.path.join(UPLOADS_DIR, filename)
            
            with open(file_path, 'wb') as f:
                shutil.copyfileobj(file.file, f)
            
            uploaded_files.append(file_path)
        
        await state_manager.save_job(job_id, {
            'job_id': job_id,
            'status': 'processing',
            'uploaded_files': uploaded_files,
            'created_at': str(uuid.uuid4())
        })
        
        processing_jobs[job_id] = True
        
        background_tasks.add_task(
            process_uploads,
            job_id,
            uploaded_files
        )
        
        return UploadResponse(
            job_id=job_id,
            message="Videos uploaded and processing started"
        )
    
    except Exception as e:
        for file_path in uploaded_files:
            if os.path.exists(file_path):
                os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

async def process_uploads(job_id: str, clip_paths: List[str]):
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
            
            transcript_response = await client.post(
                f'{MCP_SERVER_URL}/tool/generate_transcript',
                json={'video_path': stitched_video_path},
                timeout=180
            )
            
            if transcript_response.status_code != 200:
                raise Exception(f"Transcription failed: {transcript_response.text}")
            
            transcript_result = transcript_response.json()
            transcript_data = transcript_result['data']
            
            transcript = Transcript(
                text=transcript_data.get('text'),
                words=[Word(**w) for w in transcript_data.get('words', [])],
                duration=transcript_data.get('duration')
            )
            
            await state_manager.save_transcript(job_id, transcript)
            
            job_data = await state_manager.load_job(job_id)
            job_data['status'] = 'completed'
            job_data['current_video_path'] = stitched_video_path
            await state_manager.save_job(job_id, job_data)
            
            for clip_path in clip_paths:
                if os.path.exists(clip_path):
                    os.remove(clip_path)
            
    except Exception as e:
        job_data = await state_manager.load_job(job_id)
        job_data['status'] = 'error'
        job_data['error'] = str(e)
        await state_manager.save_job(job_id, job_data)
    
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
        error=job_data.get('error')
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
        result = await run_agent(
            job_id=job_id,
            query=query,
            current_video_path=job_data.get('current_video_path')
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)