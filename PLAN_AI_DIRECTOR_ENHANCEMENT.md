# AI Director - Single Page Video Editor

## Hackathon Theme
**Problem:** Creators spend 4+ hours editing videos. Editing is the bottleneck.
**Solution:** Adobe Premiere power with iPhone Notes simplicity.

---

## Core Requirements Checklist

| Component | Status | Description |
|-----------|--------|-------------|
| **Upload & Import** | ✅ | Existing upload zone (extend to 3-5 clips) |
| **Transcript Generation** | ✅ | Existing Deepgram integration |
| **Timeline Auto-Stitching** | ✅ | Existing smart merge / jump cut processor |
| **Script-Driven Editing** | 🔲 | Change text → change video |
| **Manual Controls** | 🔲 | Via prompt box (natural language) |
| **Social-Ready Preview** | ✅ | Existing Remotion 9:16 rendering |

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
- [ ] Modify `UploadZone` to accept multiple files
- [ ] Show clip thumbnails with duration
- [ ] "Process All" button → uploads sequentially
- [ ] Merge transcripts client-side

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
- [ ] Create `ScriptEditor` component
- [ ] Word-level selection and deletion
- [ ] Strikethrough CSS for deleted words
- [ ] Map deleted words → time ranges
- [ ] "Apply Changes" → call existing edit endpoint

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
- [ ] Create `PromptBox` component
- [ ] Text input with submit button
- [ ] Loading state during processing
- [ ] Update script editor with result

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
- [ ] Create `VideoPreview` component
- [ ] Play/pause controls
- [ ] Click word → seek to timestamp
- [ ] Highlight current word during playback

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
- [ ] Export button in header
- [ ] Loading state during render
- [ ] Download on complete

---

## File Structure

```
apps/web/src/app/ai-director/
├── page.tsx                    # Main single-page editor (modify existing)
├── components/
│   ├── MultiClipUpload.tsx     # Extended upload zone
│   ├── ScriptEditor.tsx        # Text-based editing (NEW)
│   ├── PromptBox.tsx           # Natural language input (NEW)
│   ├── VideoPreview.tsx        # 9:16 preview player (NEW)
│   └── ExportButton.tsx        # Export trigger (NEW)
└── hooks/
    └── useEditor.ts            # Shared state management (NEW)
```

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

- [ ] Upload 3-5 clips
- [ ] See merged transcript in script editor
- [ ] Delete text → video is cut
- [ ] Prompt "remove fillers" → AI edits transcript
- [ ] Preview plays edited video
- [ ] Export downloads 9:16 video

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
