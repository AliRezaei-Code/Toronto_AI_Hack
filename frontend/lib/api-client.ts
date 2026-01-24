const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Word {
  word: string
  start: number
  end: number
}

interface Transcript {
  words: Word[]
}

interface EditResponse {
  video_url: string
  transcript: Transcript
  message: string
}

export async function uploadVideos(files: File[]): Promise<{ job_id: string; message: string }> {
  const formData = new FormData()
  files.forEach((file, index) => {
    formData.append(`clip_${index}`, file)
  })

  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload videos')
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

export async function getJobStatus(jobId: string): Promise<{
  status: 'processing' | 'completed' | 'error'
  video_url?: string
  transcript?: Transcript
  error?: string
}> {
  const response = await fetch(`${API_URL}/api/job/${jobId}/status`)
  
  if (!response.ok) {
    throw new Error('Failed to get job status')
  }

  return response.json()
}