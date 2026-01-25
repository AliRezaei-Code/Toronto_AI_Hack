# Rententio Upload Screen Spec

## UX goal (1 sentence)
Enable creators to upload clips with zero uncertainty, then immediately reassure them that analysis is underway.

## Rententio Upload Rules
1) One dominant action: the upload area is the single strongest element.
2) Instruction before capability: show what to upload, how to upload, what happens next.
3) Spacious, forgiving layout: large padding, generous whitespace.
4) Upload area is CTA + feedback: drag/click, file name, inline progress, smooth transition to processing.
5) Calm, declarative copy only: short, confident, no hype.
6) Reassurance immediately after upload: success + analysis started.
7) AI presence without intimidation: narrate the process simply.

## Copy placeholders
- Headline: “Upload your clips”
- Subtext: “Drag and drop multiple files, or click to browse. We’ll analyze them for retention.”
- Upload zone text: “Drop files here or browse”
- Constraints: “MP4, MOV, WAV · Up to 2GB total”
- Upload status (in progress): “Uploading {filename}…”
- Upload success: “Upload complete. Starting analysis…”
- Processing status: “Identifying high‑retention moments…”
- Error: “Upload failed. Try again or check the file format.”

## Component list
- Page header (app name + workspace context)
- Primary headline (H1)
- Subtext (1 sentence)
- Upload dropzone card (drag + click)
- Browse button inside dropzone (secondary)
- Constraints line (muted)
- Upload list (file name + size)
- Inline progress bar (per file or overall)
- Status narration line (uploading → processing)
- Error state (inline, calm)

## State model
- Idle: upload prompt visible
- Uploading: file list + progress visible
- Uploaded: success confirmation shown
- Processing: status narration visible, upload disabled
- Error: inline error with retry
