# Gemini Thumbnail Service

Minimal API that transcribes audio with Whisper, builds a Gemini prompt for a vertical thumbnail plan, and optionally generates an image.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set keys:

```bash
cp .env.example .env
```

3. Run the service:

```bash
npm run dev
```

## Endpoints

- `POST /thumbnail/plan` with multipart `audio`/`video` or JSON `audioUrl`
- `POST /thumbnail/generate` with multipart `audio`/`video` or JSON `audioUrl`

Both return the Whisper transcript and the generated thumbnail plan. Video files
are supported; audio is extracted with `ffmpeg` before transcription.

## Models

- Text planning: `GEMINI_MODEL` (default `gemini-3-pro-preview`)
- Image generation: `GEMINI_IMAGE_MODEL` (default `gemini-3-pro-image-preview`)
