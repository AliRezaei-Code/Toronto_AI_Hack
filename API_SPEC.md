# Video Editor API Specification

**Base URL:** `http://localhost:8000`
**Version:** 2.0.0

---

## Table of Contents

- [Health & Info](#health--info)
- [Upload](#upload)
- [Jobs](#jobs)
- [Videos](#videos)
- [Transcripts](#transcripts)
- [Agent (Natural Language Editing)](#agent-natural-language-editing)
- [Smart Merge](#smart-merge)
- [AI Director](#ai-director)

---

## Health & Info

### `GET /`
**Root endpoint - API information**

**Response:**
```json
{
  "message": "Video Editor Backend API",
  "version": "2.0.0",
  "endpoints": {
    "upload": "/api/upload",
    "status": "/api/job/{job_id}/status",
    "video": "/api/video/{job_id}",
    "transcript": "/api/transcript/{job_id}",
    "query": "/api/agent/query",
    "recommendations": "/api/recommendations",
    "demo": "/api/demo"
  }
}
```

---

### `GET /health`
**Health check**

**Response:**
```json
{
  "status": "healthy"
}
```

---

### `GET /api/recommendations`
**Get upload guidelines and limits**

**Response:**
```json
{
  "recommendations": [
    "Use MP4 format for best compatibility",
    "Keep videos under 60 seconds for optimal processing",
    "Ensure good audio quality for accurate transcription"
  ],
  "limits": {
    "max_file_size_mb": 500.0,
    "max_duration_seconds": 300,
    "recommended_duration_seconds": 60,
    "min_clips": 3,
    "max_clips": 5
  },
  "supported_formats": [".mp4", ".mov", ".avi", ".mkv", ".webm"]
}
```

---

## Upload

### `POST /api/upload`
**Upload 3-5 video clips for processing**

**Content-Type:** `multipart/form-data`

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `clip_0` | File | Yes | First video clip |
| `clip_1` | File | Yes | Second video clip |
| `clip_2` | File | Yes | Third video clip |
| `clip_3` | File | No | Fourth video clip |
| `clip_4` | File | No | Fifth video clip |

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Videos uploaded and processing started"
}
```

**Errors:**
- `400`: Invalid file format or validation failed
- `500`: Server error during upload

---

### `POST /api/demo`
**Start demo with sample clips**

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Demo clips loaded. Processing started."
}
```

---

## Jobs

### `GET /api/jobs`
**List all jobs (newest first)**

**Response:**
```json
{
  "jobs": [
    {
      "job_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

---

### `GET /api/job/{job_id}/status`
**Get job processing status**

**Path Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `job_id` | string | The job ID from upload |

**Response:**
```json
{
  "status": "completed",
  "video_url": "http://localhost:8000/api/video/550e8400-e29b-41d4-a716-446655440000",
  "transcript": {
    "text": "Full transcript text...",
    "duration": 45.5,
    "clips": [
      {
        "clip_index": 0,
        "duration": 15.2,
        "start_offset": 0.0,
        "segments": [
          {
            "text": "Hello everyone",
            "start": 0.0,
            "end": 1.5,
            "words": [
              {"word": "Hello", "start": 0.0, "end": 0.5},
              {"word": "everyone", "start": 0.6, "end": 1.5}
            ]
          }
        ]
      }
    ]
  },
  "creator_context": {
    "industry": "tech/saas",
    "role": "software engineer",
    "target_audience": "entrepreneurs",
    "tone": "professional",
    "suggested_hook_style": "results-driven"
  },
  "error": null,
  "warning": null
}
```

**Status Values:**
- `processing` - Video is being stitched and transcribed
- `completed` - Processing finished
- `error` - Processing failed (check `error` field)

---

### `DELETE /api/job/{job_id}`
**Delete a job and all associated files**

**Response:**
```json
{
  "message": "Job 550e8400-e29b-41d4-a716-446655440000 deleted"
}
```

---

## Videos

### `GET /api/video/{job_id}`
**Stream the processed video**

**Path Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `job_id` | string | The job ID |

**Response:** Video file (`video/mp4`)

**Errors:**
- `404`: Video not found or job not completed

---

## Transcripts

### `GET /api/transcript/{job_id}`
**Get transcript with word-level timing**

**Response:**
```json
{
  "text": "Full transcript text...",
  "duration": 45.5,
  "clips": [
    {
      "clip_index": 0,
      "duration": 15.2,
      "start_offset": 0.0,
      "segments": [
        {
          "text": "Hello everyone",
          "start": 0.0,
          "end": 1.5,
          "words": [
            {"word": "Hello", "start": 0.0, "end": 0.5},
            {"word": "everyone", "start": 0.6, "end": 1.5}
          ]
        }
      ]
    }
  ]
}
```

---

### `POST /api/transcript/{job_id}/edit`
**Edit transcript to modify video (script-driven editing)**

**Request Body:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "edited_text": "Hello everyone, this is the edited transcript without filler words."
}
```

**Response:**
```json
{
  "video_url": "/api/video/550e8400-e29b-41d4-a716-446655440000",
  "transcript": { ... },
  "message": "Successfully edited transcript and regenerated video"
}
```

---

## Agent (Natural Language Editing)

### `POST /api/agent/query`
**Edit video using natural language instructions**

**Request Body:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "query": "Remove all filler words like um and uh"
}
```

**Example Queries:**
- `"Remove all filler words like um and uh"`
- `"Cut out the section where I talk about pricing"`
- `"Keep only the introduction and conclusion"`
- `"Remove awkward pauses longer than 2 seconds"`
- `"Make it under 60 seconds"`

**Response:**
```json
{
  "video_url": "/api/video/550e8400-e29b-41d4-a716-446655440000",
  "transcript": {
    "words": [
      {"word": "Hello", "start": 0.0, "end": 0.5},
      {"word": "everyone", "start": 0.6, "end": 1.5}
    ]
  },
  "message": "Successfully removed 3 filler words"
}
```

**Errors:**
- `400`: Job still processing
- `404`: Job not found
- `500`: Agent processing failed

---

## Smart Merge

### `POST /api/smart-merge`
**LLM-powered one-shot optimization with hook-first ordering**

**Request Body:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "video_url": "http://localhost:8000/api/video/550e8400-e29b-41d4-a716-446655440000",
  "transcript": { ... },
  "creator_context": {
    "industry": "tech/saas",
    "role": "software engineer",
    "target_audience": "entrepreneurs",
    "tone": "professional",
    "suggested_hook_style": "results-driven"
  },
  "reasoning": "Hook uses strong numbers to grab attention. Body flows naturally with the demonstration. Ending has clear call to action.",
  "segments_used": [
    {
      "clip_index": 2,
      "start": 5.2,
      "end": 12.8,
      "label": "hook"
    },
    {
      "clip_index": 0,
      "start": 0.0,
      "end": 15.0,
      "label": "intro"
    }
  ],
  "estimated_duration": 32.5,
  "message": "Smart merge complete: 5 segments reordered with hook first"
}
```

---

## AI Director

### `POST /api/director/upload`
**Upload video for AI Director processing**

**Content-Type:** `multipart/form-data`

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `video` | File | Yes | - | Video file to process |
| `include_captions` | bool | No | true | Add animated captions |
| `caption_style` | string | No | "hormozi" | Caption style: hormozi, minimal, bold |
| `target_platform` | string | No | "tiktok" | Platform: tiktok, reels, shorts, youtube |
| `max_clips` | int | No | 5 | Maximum viral clips to select |
| `min_clip_duration` | float | No | 15.0 | Minimum clip duration (seconds) |
| `max_clip_duration` | float | No | 90.0 | Maximum clip duration (seconds) |
| `remove_fillers` | bool | No | true | Remove filler words (um, uh) |

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "progress_percent": 0.0,
  "current_step": "Queued for processing"
}
```

---

### `GET /api/director/status/{job_id}`
**Get AI Director job status**

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress_percent": 100.0,
  "current_step": "Processing complete",
  "viral_clips_found": 5,
  "shorts_rendered": 0,
  "error": null
}
```

**Status Values:**
- `queued` - Waiting in queue
- `transcribing` - Transcribing with speaker identification
- `diarizing` - Identifying speakers
- `selecting_clips` - AI selecting viral moments
- `tracking_faces` - Tracking faces for smart cropping
- `generating_layout` - Generating dynamic layouts
- `rendering` - Rendering vertical shorts
- `completed` - Processing complete
- `failed` - Processing failed

---

### `GET /api/director/jobs`
**List all AI Director jobs**

**Response:**
```json
{
  "jobs": [
    {
      "job_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "progress_percent": 100.0,
      "viral_clips_found": 5,
      "shorts_rendered": 0,
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

---

### `GET /api/director/clips/{job_id}`
**Get viral clips selected for a job**

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "clips": [
    {
      "id": "clip_001",
      "title": "The moment I realized...",
      "start_time": 45.2,
      "end_time": 78.9,
      "duration": 33.7,
      "hook_type": "story",
      "virality_score": 0.92,
      "transcript_excerpt": "And that's when I realized that everything I thought I knew was wrong..."
    }
  ],
  "selection_reasoning": "Selected clips with strong emotional hooks and clear story arcs",
  "total_duration_analyzed": 1845.5
}
```

---

### `POST /api/director/select-clips`
**Re-run clip selection with different parameters**

**Request Body:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "max_clips": 3,
  "min_duration": 30.0,
  "max_duration": 60.0
}
```

**Response:** Same as `GET /api/director/clips/{job_id}`

---

### `GET /api/director/edl/{job_id}`
**Get Edit Decision List (jump-cuts)**

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "edl": {
    "keep_ranges": [
      {"start": 0.0, "end": 5.2},
      {"start": 5.8, "end": 12.3}
    ],
    "cuts": [
      {"start": 5.2, "end": 5.8, "reason": "filler_word"}
    ],
    "time_saved": 12.5
  },
  "zoom_cut_points": [5.2, 12.3, 25.1]
}
```

---

### `GET /api/director/diarization/{job_id}`
**Get speaker diarization result**

**Response:**
```json
{
  "words": [
    {
      "word": "Hello",
      "start": 0.0,
      "end": 0.5,
      "speaker": "SPEAKER_00",
      "confidence": 0.95
    }
  ],
  "segments": [
    {
      "speaker": "SPEAKER_00",
      "start": 0.0,
      "end": 15.2,
      "text": "Hello everyone, welcome to..."
    }
  ],
  "total_speakers": 2,
  "duration": 1845.5
}
```

---

### `POST /api/director/render-short`
**Render a viral short with Remotion**

**Request Body:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "clip_id": "clip_001",
  "caption_style": "hormozi",
  "platform": "tiktok"
}
```

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "clip_id": "clip_001",
  "video_url": "/api/director/shorts/550e8400-e29b-41d4-a716-446655440000/clip_001.mp4",
  "duration": 33.7,
  "render_time_seconds": 45.2
}
```

---

### `DELETE /api/director/job/{job_id}`
**Delete AI Director job and files**

**Response:**
```json
{
  "message": "Job 550e8400-e29b-41d4-a716-446655440000 deleted"
}
```

---

## Data Models

### Word
```typescript
{
  word: string;      // The transcribed word
  start: number;     // Start time in seconds
  end: number;       // End time in seconds
}
```

### Segment
```typescript
{
  text: string;      // Segment text
  start: number;     // Start time in seconds
  end: number;       // End time in seconds
  words: Word[];     // Words in this segment
}
```

### Clip
```typescript
{
  clip_index: number;    // Index in upload order
  duration: number;      // Clip duration in seconds
  start_offset: number;  // Offset in stitched video
  segments: Segment[];   // Segments in this clip
}
```

### Transcript
```typescript
{
  text: string | null;    // Full transcript text
  duration: number | null; // Total duration
  clips: Clip[];          // Clips with segments
}
```

### ViralClip
```typescript
{
  id: string;
  title: string;
  start_time: number;
  end_time: number;
  duration: number;
  hook_type: "question" | "story" | "stat" | "controversy" | "reveal";
  virality_score: number;  // 0.0 - 1.0
  transcript_excerpt: string;
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation error, invalid parameters)
- `404` - Not Found (job, video, or transcript not found)
- `500` - Internal Server Error (processing failure)
