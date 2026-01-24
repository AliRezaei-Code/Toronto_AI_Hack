# MongoDB Schema: Transcription Data

> See [readme.md](readme.md) for overall project context.

## Overview

This document defines the MongoDB schema updates required to store transcription data, including full transcripts, word-level timings, and subtitle file references.

## New Collection: `transcriptions`

A dedicated collection for storing transcription results, linked to videos by `video_id`.

### Schema Definition

```javascript
{
  _id: ObjectId,
  video_id: ObjectId,                    // Reference to videos collection

  // Core transcript data
  transcript: {
    full_text: String,                   // Complete transcript text
    language: String,                    // ISO 639-1 code (e.g., "en", "es")
    language_probability: Number,        // 0-1, confidence of language detection
    confidence_score: Number,            // 0-1, average word confidence
    duration_seconds: Number,            // Audio duration
    word_count: Number                   // Total words transcribed
  },

  // Subtitle file references (Object Storage URLs)
  subtitle_files: {
    srt_url: String,
    vtt_url: String,
    json_url: String
  },

  // Word-level timing data for animations
  word_timings: [
    {
      word: String,
      start: Number,                     // Start time in seconds
      end: Number,                       // End time in seconds
      confidence: Number                 // 0-1, word-level confidence
    }
  ],

  // Segment-level data (sentence/phrase groupings)
  segments: [
    {
      id: Number,
      start: Number,
      end: Number,
      text: String,
      word_indices: [Number]             // References to word_timings array
    }
  ],

  // Processing metadata
  metadata: {
    model_version: String,               // e.g., "large-v3"
    processing_time_seconds: Number,
    created_at: Date,
    updated_at: Date,
    status: String,                      // "completed", "failed", "pending"
    error_message: String                // If status is "failed"
  },

  // Quality flags
  quality: {
    needs_review: Boolean,               // True if confidence < threshold
    reviewed: Boolean,
    reviewed_by: String,                 // User ID if manually reviewed
    reviewed_at: Date,
    corrections_made: Boolean
  }
}
```

### Indexes

```javascript
// Primary lookup by video
db.transcriptions.createIndex({ "video_id": 1 }, { unique: true })

// Find transcriptions needing review
db.transcriptions.createIndex({ "quality.needs_review": 1, "metadata.created_at": -1 })

// Language-based queries
db.transcriptions.createIndex({ "transcript.language": 1 })

// Status filtering
db.transcriptions.createIndex({ "metadata.status": 1 })
```

## Extended `videos` Collection

Add transcription reference to existing videos collection.

### Schema Addition

```javascript
{
  // Existing video fields...
  _id: ObjectId,
  title: String,
  upload_url: String,
  // ... other existing fields

  // NEW: Transcription reference
  transcription: {
    transcription_id: ObjectId,          // Reference to transcriptions collection
    has_transcript: Boolean,
    language: String,                    // Quick access to detected language
    confidence: Number,                  // Quick access to confidence score
    subtitle_style: String               // Applied style preset name
  }
}
```

### Index Update

```javascript
// Find videos with/without transcription
db.videos.createIndex({ "transcription.has_transcript": 1 })
```

## New Collection: `transcription_jobs`

Track async transcription job status.

### Schema Definition

```javascript
{
  _id: ObjectId,
  job_id: String,                        // Unique job identifier (UUID)
  video_id: ObjectId,

  status: String,                        // "queued", "processing", "completed", "failed"
  progress: Number,                      // 0-100 percentage

  // Job configuration
  config: {
    model: String,
    language: String,                    // null for auto-detect
    output_formats: [String],
    word_timestamps: Boolean
  },

  // Timing
  created_at: Date,
  started_at: Date,
  completed_at: Date,

  // Results
  result: {
    transcription_id: ObjectId,          // Reference to transcriptions collection
    error: String                        // Error message if failed
  },

  // Retry tracking
  attempts: Number,
  max_attempts: Number,
  last_error: String
}
```

### Indexes

```javascript
db.transcription_jobs.createIndex({ "job_id": 1 }, { unique: true })
db.transcription_jobs.createIndex({ "video_id": 1 })
db.transcription_jobs.createIndex({ "status": 1, "created_at": 1 })
```

## Sample Documents

### Transcription Document

```json
{
  "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
  "video_id": "64a1b2c3d4e5f6g7h8i9j0k0",
  "transcript": {
    "full_text": "Welcome to this tutorial. Today we're going to learn about video editing and how to create engaging content.",
    "language": "en",
    "language_probability": 0.98,
    "confidence_score": 0.94,
    "duration_seconds": 8.5,
    "word_count": 18
  },
  "subtitle_files": {
    "srt_url": "s3://content-bucket/subtitles/64a1b2c3d4e5f6g7h8i9j0k0.srt",
    "vtt_url": "s3://content-bucket/subtitles/64a1b2c3d4e5f6g7h8i9j0k0.vtt",
    "json_url": "s3://content-bucket/subtitles/64a1b2c3d4e5f6g7h8i9j0k0.json"
  },
  "word_timings": [
    {"word": "Welcome", "start": 0.0, "end": 0.4, "confidence": 0.97},
    {"word": "to", "start": 0.4, "end": 0.5, "confidence": 0.99},
    {"word": "this", "start": 0.5, "end": 0.7, "confidence": 0.96},
    {"word": "tutorial", "start": 0.7, "end": 1.2, "confidence": 0.94},
    {"word": "Today", "start": 1.5, "end": 1.8, "confidence": 0.98},
    {"word": "we're", "start": 1.8, "end": 2.0, "confidence": 0.95},
    {"word": "going", "start": 2.0, "end": 2.2, "confidence": 0.97},
    {"word": "to", "start": 2.2, "end": 2.3, "confidence": 0.99},
    {"word": "learn", "start": 2.3, "end": 2.6, "confidence": 0.96}
  ],
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 1.2,
      "text": "Welcome to this tutorial.",
      "word_indices": [0, 1, 2, 3]
    },
    {
      "id": 1,
      "start": 1.5,
      "end": 2.6,
      "text": "Today we're going to learn",
      "word_indices": [4, 5, 6, 7, 8]
    }
  ],
  "metadata": {
    "model_version": "large-v3",
    "processing_time_seconds": 2.1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "status": "completed",
    "error_message": null
  },
  "quality": {
    "needs_review": false,
    "reviewed": false,
    "reviewed_by": null,
    "reviewed_at": null,
    "corrections_made": false
  }
}
```

## Query Examples

### Get transcript for video

```javascript
db.transcriptions.findOne({ video_id: ObjectId("64a1b2c3d4e5f6g7h8i9j0k0") })
```

### Find low-confidence transcriptions needing review

```javascript
db.transcriptions.find({
  "quality.needs_review": true,
  "quality.reviewed": false
}).sort({ "metadata.created_at": -1 })
```

### Get word timings for animation

```javascript
db.transcriptions.findOne(
  { video_id: ObjectId("64a1b2c3d4e5f6g7h8i9j0k0") },
  { word_timings: 1, segments: 1 }
)
```

### Check transcription job status

```javascript
db.transcription_jobs.findOne({ job_id: "uuid-1234-5678" })
```

## Data Retention

| Collection | Retention Policy |
|------------|------------------|
| `transcriptions` | Permanent (linked to video lifecycle) |
| `transcription_jobs` | 30 days after completion |
| Subtitle files (S3) | Permanent (linked to video lifecycle) |

## Migration Script

```javascript
// Add transcription field to existing videos
db.videos.updateMany(
  { transcription: { $exists: false } },
  {
    $set: {
      transcription: {
        transcription_id: null,
        has_transcript: false,
        language: null,
        confidence: null,
        subtitle_style: null
      }
    }
  }
)

// Create transcriptions collection with validation
db.createCollection("transcriptions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["video_id", "transcript", "metadata"],
      properties: {
        video_id: { bsonType: "objectId" },
        transcript: {
          bsonType: "object",
          required: ["full_text", "language"]
        },
        metadata: {
          bsonType: "object",
          required: ["status", "created_at"]
        }
      }
    }
  }
})
```

---

**Related Documents:**
- [Transcription MCP Spec](transcription-mcp-spec.md)
- [Architecture Update](architecture-transcription.md)
- [Integration Guide](transcription-integration-guide.md)
