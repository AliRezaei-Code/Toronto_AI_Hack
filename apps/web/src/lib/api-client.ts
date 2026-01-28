const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ============================================================================
// Hierarchical Transcript Types (Clips -> Segments -> Words)
// ============================================================================

export interface Word {
  word: string
  start: number
  end: number
}

export interface Segment {
  text: string
  start: number
  end: number
  words: Word[]
}

export interface Clip {
  clip_index: number
  duration: number
  start_offset: number
  segments: Segment[]
}

export interface Transcript {
  text?: string
  duration?: number
  clips: Clip[]
}

// ============================================================================
// Creator Context (auto-detected during processing)
// ============================================================================

export interface CreatorContext {
  industry: string
  role: string
  target_audience: string
  tone: string
  suggested_hook_style: string
}

interface EditResponse {
  video_url: string
  transcript: Transcript
  message: string
}

export async function uploadVideos(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<{ job_id: string; message: string }> {
  const formData = new FormData()
  files.forEach((file, index) => {
    formData.append(`clip_${index}`, file)
  })

  const xhr = new XMLHttpRequest()

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 30)
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          if (onProgress) {
            onProgress(30)
          }
          resolve(response)
        } catch (e) {
          reject(new Error('Invalid response from server'))
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'))
    })

    xhr.open('POST', `${API_URL}/api/upload`)
    xhr.send(formData)
  })
}

export async function startDemoJob(): Promise<{ job_id: string; message: string }> {
  const response = await fetch(`${API_URL}/api/demo`, {
    method: 'POST',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Failed to start demo')
  }

  return response.json()
}

export async function getTranscript(jobId: string): Promise<Transcript> {
  const response = await fetch(`${API_URL}/api/transcript/${jobId}`)
  
  if (!response.ok) {
    throw new Error('Failed to get transcript')
  }

  return response.json()
}

export async function processEdit(
  jobId: string,
  query: string
): Promise<EditResponse> {
  const response = await fetch(`${API_URL}/api/agent/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ job_id: jobId, query }),
  })

  if (!response.ok) {
    throw new Error('Failed to process edit')
  }

  return response.json()
}

export async function editTranscriptText(
  jobId: string,
  editedText: string,
  editedWords?: Map<number, string>,  // Optional: word index -> new word text
  deletedIndices?: Set<number>        // Optional: deleted word indices
): Promise<EditResponse> {
  // Build request body with optional structured data
  const body: {
    job_id: string
    edited_text: string
    edited_word_indices?: Record<number, string>
    deleted_word_indices?: number[]
  } = {
    job_id: jobId,
    edited_text: editedText,
  }

  // Include structured data if provided (enables fast direct processing path)
  if (editedWords && editedWords.size > 0) {
    body.edited_word_indices = Object.fromEntries(editedWords)
  }
  if (deletedIndices && deletedIndices.size > 0) {
    body.deleted_word_indices = Array.from(deletedIndices)
  }

  console.log('[editTranscriptText] Sending request:', {
    jobId,
    editedTextLength: editedText.length,
    hasEditedWords: editedWords ? editedWords.size : 0,
    deletedIndices: deletedIndices ? Array.from(deletedIndices) : [],
  })

  const response = await fetch(`${API_URL}/api/transcript/${jobId}/edit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[editTranscriptText] Failed:', response.status, errorText)
    throw new Error(`Failed to edit transcript: ${errorText}`)
  }

  const result = await response.json()
  console.log('[editTranscriptText] Success:', result.message)
  console.log('[editTranscriptText] New transcript word count:',
    result.transcript?.clips?.reduce((sum: number, clip: Clip) =>
      sum + clip.segments.reduce((segSum: number, seg: Segment) => segSum + seg.words.length, 0), 0) || 0
  )
  return result
}

export async function getJobStatus(jobId: string): Promise<{
  status: 'processing' | 'completed' | 'error'
  video_url?: string
  transcript?: Transcript
  creator_context?: CreatorContext
  error?: string
  warning?: string
}> {
  const response = await fetch(`${API_URL}/api/job/${jobId}/status`)
  
  if (!response.ok) {
    throw new Error('Failed to get job status')
  }

  return response.json()
}

export interface JobSummary {
  job_id: string
  status: string
  created_at: string
}

export async function getJobs(): Promise<{ jobs: JobSummary[] }> {
  const response = await fetch(`${API_URL}/api/jobs`)
  
  if (!response.ok) {
    throw new Error('Failed to get jobs')
  }

  return response.json()
}
