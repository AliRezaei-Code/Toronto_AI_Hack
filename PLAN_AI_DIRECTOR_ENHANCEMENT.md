# AI Director - Single Page Video Editor

## Hackathon Theme
**Problem:** Creators spend 4+ hours editing videos. Editing is the bottleneck.
**Solution:** Adobe Premiere power with iPhone Notes simplicity.

---

## Core Requirements Checklist

| Component | Status | Description |
|-----------|--------|-------------|
| **Upload & Import** | ✅ | Multi-clip upload zone (1-5 clips) |
| **Transcript Generation** | ✅ | Existing Deepgram integration |
| **Timeline Auto-Stitching** | ✅ | Existing smart merge / jump cut processor |
| **Script-Driven Editing** | ✅ | Change text → change video |
| **Manual Controls** | ✅ | Via prompt box (natural language) |
| **Social-Ready Preview** | ✅ | Video preview with playback controls |

---

## What We Already Have (Backend)
- ✅ `/api/upload` - Video upload
- ✅ `/api/job/{id}/status` - Transcription via Deepgram
- ✅ `/api/agent/query` - Natural language editing (LLM agent)
- ✅ `/api/transcript/{id}` - Get/edit transcript
- ✅ `/api/director/render-short` - 9:16 Remotion render
- ✅ Jump cut processor, smart merge, face tracking

**Minimal new backend needed!**

---

## UI Design: Single Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🎬 Quick Cut Editor                                    [Export 9:16]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────┐  ┌─────────────────────────────────┐│
│  │                               │  │  📝 SCRIPT EDITOR               ││
│  │     VIDEO PREVIEW             │  │  ─────────────────────────────  ││
│  │     (9:16 Vertical)           │  │                                 ││
│  │                               │  │  Hello everyone, welcome to     ││
│  │         ┌─────────┐           │  │  my channel. Today we're going  ││
│  │         │         │           │  │  to talk about ~~something~~    ││
│  │         │  👤     │           │  │  important stuff.               ││
│  │         │         │           │  │                                 ││
│  │         └─────────┘           │  │  Let me show you how it works   ││
│  │                               │  │  and ~~um~~ why it matters.     ││
│  │    [⏮] [▶️ Play] [⏭]          │  │                                 ││
│  │                               │  │  ℹ️ Select text + Delete = cut   ││
│  └───────────────────────────────┘  │                                 ││
│                                     ├─────────────────────────────────┤│
│  ┌───────────────────────────────┐  │  💬 PROMPT                      ││
│  │  📎 DROP 3-5 CLIPS HERE       │  │  ─────────────────────────────  ││
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ │  │  ┌─────────────────────────┐   ││
│  │  │ 1  │ │ 2  │ │ 3  │ │ +  │ │  │  │ "Remove all filler      │   ││
│  │  └────┘ └────┘ └────┘ └────┘ │  │  │  words and make it      │   ││
│  │  [Process Videos]             │  │  │  under 60 seconds"      │   ││
│  └───────────────────────────────┘  │  └─────────────────────────┘   ││
│                                     │           [Apply Edit]          ││
│                                     └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Multi-Clip Upload UI (~1hr)
**Goal:** Accept 3-5 clips, show thumbnails, trigger processing

**Changes to existing `page.tsx`:**
```typescript
// Extend existing UploadZone to accept multiple files
const [clips, setClips] = useState<File[]>([]);
const MAX_CLIPS = 5;
const MIN_CLIPS = 3;

// On upload complete, call existing /api/upload for each
// Then call existing /api/job/{id}/status to get transcripts
```

**Tasks:**
- [x] Modify `UploadZone` to accept multiple files
- [x] Show clip thumbnails with duration
- [x] "Process All" button → uploads sequentially
- [x] Merge transcripts client-side

**Status:** ✅ **COMPLETED**
- Created `MultiClipUpload.tsx` component with drag-and-drop support
- Supports 1-5 clips with thumbnails and reordering
- Integrated with existing `/api/upload` endpoint

---

### Phase 2: Script Editor Component (~2hrs)
**Goal:** Editable transcript where delete = cut

**New component: `ScriptEditor.tsx`**
```typescript
interface ScriptEditorProps {
  transcript: Word[];  // Existing Word type from backend
  onEdit: (editedWords: Word[]) => void;
}

// Features:
// - Display transcript as editable text
// - Select text + Delete key → strikethrough (mark as deleted)
// - Click strikethrough → restore
// - Track which words are "deleted"
```

**No new backend needed** - just track deleted word indices client-side, then send to existing `/api/agent/query` or `/api/transcript/{id}` endpoint.

**Tasks:**
- [x] Create `ScriptEditor` component
- [x] Word-level selection and deletion
- [x] Strikethrough CSS for deleted words
- [x] Map deleted words → time ranges
- [x] "Apply Changes" → call existing edit endpoint

**Status:** ✅ **COMPLETED**
- Created `ScriptEditor.tsx` with full word-level editing
- Supports click, double-click, shift-click, and keyboard shortcuts
- Visual feedback for deleted words (strikethrough + red background)
- "Apply Changes" button triggers edit via `/api/agent/query`

---

### Phase 3: Prompt Box (Natural Language) (~1hr)
**Goal:** Type commands like "remove filler words"

**Uses existing `/api/agent/query` endpoint!**

```typescript
// PromptBox.tsx
const handleSubmit = async (prompt: string) => {
  const response = await fetch('/api/agent/query', {
    method: 'POST',
    body: JSON.stringify({
      job_id: currentJobId,
      query: prompt  // "Remove all ums and ahs"
    })
  });
  // Response contains updated transcript
  setTranscript(response.transcript);
};
```

**Tasks:**
- [x] Create `PromptBox` component
- [x] Text input with submit button
- [x] Loading state during processing
- [x] Update script editor with result

**Status:** ✅ **COMPLETED**
- Created `PromptBox.tsx` with natural language input
- Quick prompt buttons for common edits
- Integrated with `/api/agent/query` endpoint
- Updates script editor automatically on success

---

### Phase 4: Video Preview (~1hr)
**Goal:** Show 9:16 preview, synced with script

**Simple video player:**
```typescript
// VideoPreview.tsx
<video
  ref={videoRef}
  src={videoUrl}
  className="aspect-[9/16] max-h-[500px]"
/>

// Sync: clicking word in script → seek video to that timestamp
```

**Tasks:**
- [x] Create `VideoPreview` component
- [x] Play/pause controls
- [x] Click word → seek to timestamp
- [x] Highlight current word during playback

**Status:** ✅ **COMPLETED**
- Created `VideoPreview.tsx` with full video player controls
- Play/pause, skip forward/back, mute, fullscreen
- Progress bar with click-to-seek
- Synced with script editor (click word → seek video)

---

### Phase 5: Export (~30min)
**Goal:** Download final 9:16 video

**Uses existing `/api/director/render-short` endpoint!**

```typescript
const handleExport = async () => {
  const response = await fetch('/api/director/render-short', {
    method: 'POST',
    body: JSON.stringify({
      job_id: currentJobId,
      platform: 'tiktok'
    })
  });
  // Download the rendered video
  window.open(response.video_url);
};
```

**Tasks:**
- [x] Export button in header
- [x] Loading state during render
- [x] Download on complete

**Status:** ✅ **COMPLETED**
- Export button in page header (shows when video is ready)
- Integrated with `/api/director/render-short` endpoint
- Download button appears after export completes
- Full download functionality implemented

---

## File Structure

```
apps/web/src/app/editor/
├── page.tsx                    # Main single-page editor ✅
├── components/
│   ├── MultiClipUpload.tsx     # Multi-clip upload zone ✅
│   ├── ScriptEditor.tsx        # Text-based editing ✅
│   ├── PromptBox.tsx           # Natural language input ✅
│   └── VideoPreview.tsx         # Video preview player ✅
└── hooks/
    └── useEditor.ts            # Shared state management ✅
```

**All files created and integrated!** ✅

---

## Backend Changes: NONE (or minimal)

We leverage existing endpoints:

| Need | Existing Endpoint |
|------|-------------------|
| Upload videos | `POST /api/upload` |
| Get transcript | `GET /api/job/{id}/status` |
| Natural language edit | `POST /api/agent/query` |
| Apply text edits | `POST /api/transcript/{id}` (or agent) |
| Render 9:16 | `POST /api/director/render-short` |

**Optional enhancement:** Single endpoint to upload multiple clips and merge transcripts. But can do client-side for hackathon.

---

## State Management

```typescript
// useEditor.ts
interface EditorState {
  // Clips
  clips: UploadedClip[];
  isUploading: boolean;

  // Transcript
  words: EditableWord[];
  deletedIndices: Set<number>;

  // Video
  currentJobId: string | null;
  videoUrl: string | null;
  currentTime: number;

  // Export
  isExporting: boolean;
  exportedUrl: string | null;
}

interface EditableWord {
  word: string;
  start: number;
  end: number;
  isDeleted: boolean;
}
```

---

## Priority Order

1. **Script Editor** → The differentiator (text = video)
2. **Prompt Box** → Uses existing agent
3. **Video Preview** → Visual feedback
4. **Multi-Clip Upload** → Foundation
5. **Export** → Final output

---

## Demo Flow (4-minute pitch)

1. **30s** - Show the problem (editing takes forever)
2. **30s** - Drop 3 clips, auto-transcribe
3. **60s** - Script editing: select "um", delete → it's cut!
4. **60s** - Prompt: "make it under 60 seconds" → AI edits
5. **30s** - Export vertical, show final result

---

## Success Criteria

- [x] Upload 3-5 clips
- [x] See merged transcript in script editor
- [x] Delete text → video is cut
- [x] Prompt "remove fillers" → AI edits transcript
- [x] Preview plays edited video
- [x] Export downloads 9:16 video

**All success criteria met!** ✅

---

## Time Estimate

| Phase | Time |
|-------|------|
| Multi-Clip Upload | 1 hr |
| Script Editor | 2 hrs |
| Prompt Box | 1 hr |
| Video Preview | 1 hr |
| Export | 0.5 hr |
| **Total** | **~5.5 hrs** |

All frontend work. Backend already exists.

---

## Implementation Status: ✅ COMPLETE

**Date Completed:** January 25, 2026

### What Was Built

1. **MultiClipUpload Component** (`components/MultiClipUpload.tsx`)
   - Drag-and-drop file upload
   - Support for 1-5 video clips
   - Clip thumbnails with preview
   - Reorder clips via drag-and-drop
   - Remove individual clips
   - Process button to upload and transcribe

2. **ScriptEditor Component** (`components/ScriptEditor.tsx`)
   - Word-level transcript display
   - Click word to seek video to that timestamp
   - Double-click word to toggle deletion (cut)
   - Shift+click to select word ranges
   - Ctrl/Cmd+click for multi-select
   - Delete key to cut selected words
   - Visual feedback: strikethrough + red background for deleted words
   - "Apply Changes" button to process deletions
   - Restore all functionality

3. **PromptBox Component** (`components/PromptBox.tsx`)
   - Natural language input for AI editing
   - Quick prompt buttons (Remove fillers, Remove pauses, Under 60s, Tighten cuts)
   - Loading states during processing
   - Success/error messages
   - Integrated with `/api/agent/query` endpoint

4. **VideoPreview Component** (`components/VideoPreview.tsx`)
   - Full video player with controls
   - Play/pause, skip forward/back (5s)
   - Progress bar with click-to-seek
   - Mute/unmute toggle
   - Fullscreen support
   - Time display (current/total)
   - 9:16 aspect ratio support

5. **useEditor Hook** (`hooks/useEditor.ts`)
   - Centralized state management
   - Clip management (add, remove, reorder)
   - Job processing and polling
   - Transcript word management
   - Video playback control
   - Edit application (prompt-based and script-based)
   - Export functionality

6. **Main Editor Page** (`page.tsx`)
   - Integrated all components in responsive layout
   - Two-column layout (video + upload on left, script + prompt on right)
   - Export button in header
   - Error handling and status messages
   - Download functionality for exported videos

### Key Features

- ✅ Multi-clip upload (1-5 videos)
- ✅ Automatic transcription via Deepgram
- ✅ Script-based editing (delete text = cut video)
- ✅ Natural language editing via AI prompts
- ✅ Real-time video preview with playback controls
- ✅ Word-level synchronization (click word → seek video)
- ✅ Export to 9:16 format for social media
- ✅ Full keyboard shortcuts support
- ✅ Drag-and-drop clip reordering

### Technical Details

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State Management:** React hooks (custom `useEditor` hook)
- **API Integration:** RESTful endpoints
- **Video Handling:** HTML5 video element with custom controls

### Next Steps (Optional Enhancements)

- [ ] Add undo/redo functionality
- [ ] Add clip trimming UI
- [ ] Add transition effects
- [ ] Add caption styling options
- [ ] Add batch export for multiple formats
- [ ] Add project save/load functionality
