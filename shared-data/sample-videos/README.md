# Sample Videos for Demo Mode

This directory contains pre-configured videos and transcripts for instant demo purposes.

## Structure

```
sample-videos/
├── clips/              # Pre-recorded short clips (30s max each)
│   ├── clip_0_intro.mp4
│   ├── clip_1_content.mp4
│   └── clip_2_outro.mp4
├── transcripts/        # Pre-generated transcripts
│   └── demo_transcript.json
└── README.md          # This file
```

## How to Use

1. Place 3-5 short video clips (5-30 seconds each) in the `clips/` directory
2. Generate transcripts using the MCP server, or manually create transcript JSON files
3. Backend will use these for instant demo mode

## File Naming Convention

- Video clips: `clip_0.mp4`, `clip_1.mp4`, `clip_2.mp4`, etc.
- Transcript: `demo_transcript.json`

## Transcript Format

```json
{
  "text": "Full transcript text here",
  "words": [
    {"word": "Hello", "start": 0.0, "end": 0.5},
    {"word": "world", "start": 0.5, "end": 1.0}
  ],
  "duration": 30.0
}
```

## Tips for Demo Videos

- Use short clips (5-10s each) for faster loading
- Clear audio for better transcription
- Include some pauses/silence to demonstrate edit features
- Natural speech patterns (include some fillers like "um", "uh")

## Placeholder Content

Until you add actual videos, you can use:
- Stock footage from websites like Pexels or Pixabay
- Screen recordings of your app
- Simple talking head videos