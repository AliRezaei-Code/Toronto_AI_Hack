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
  editedText: string
): Promise<EditResponse> {
  const response = await fetch(`${API_URL}/api/transcript/${jobId}/edit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ job_id: jobId, edited_text: editedText }),
  })

  if (!response.ok) {
    throw new Error('Failed to edit transcript')
  }

  return response.json()
}

export async function getJobStatus(jobId: string): Promise<{
  status: 'processing' | 'completed' | 'error'
  video_url?: string
  transcript?: Transcript
  error?: string
  warning?: string
}> {
  const response = await fetch(`${API_URL}/api/job/${jobId}/status`)
  
  if (!response.ok) {
    throw new Error('Failed to get job status')
  }

  return response.json()
}
