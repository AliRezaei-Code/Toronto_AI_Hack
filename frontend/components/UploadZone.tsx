'use client'

import { useState } from 'react'
import { Upload, Film, FileVideo, X } from 'lucide-react'

interface UploadZoneProps {
  onUpload: (files: File[]) => void
  isUploading?: boolean
  uploadProgress?: number
  uploadStatus?: string
}

interface FileWithInfo {
  file: File
  id: string
}

export function UploadZone({
  onUpload,
  isUploading = false,
  uploadProgress = 0,
  uploadStatus = '',
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileWithInfo[]>([])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('video/')
    )
    
    addFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      file => file.type.startsWith('video/')
    )
    
    addFiles(files)
  }

  const addFiles = (files: File[]) => {
    const fileWithInfo = files.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`
    }))
    
    const newFiles = [...selectedFiles, ...fileWithInfo].slice(0, 5)
    setSelectedFiles(newFiles)
  }

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleUpload = () => {
    if (selectedFiles.length >= 3 && selectedFiles.length <= 5) {
      onUpload(selectedFiles.map(f => f.file))
      setSelectedFiles([])
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-blue-500'
    if (progress < 70) return 'bg-blue-600'
    return 'bg-green-500'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isValidCount = selectedFiles.length >= 3 && selectedFiles.length <= 5

  if (isUploading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl p-12 bg-gray-800 rounded-2xl">
          <div className="text-center mb-8">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <h3 className="text-2xl font-semibold mb-2">Uploading & Processing</h3>
            <p className="text-gray-400">{uploadStatus || 'Uploading your videos...'}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(uploadProgress)} transition-all duration-300 ease-out`}
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Upload Progress</span>
              <span className="text-white font-medium">{uploadProgress}%</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-900/30 border border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Film className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm text-gray-300">
                  This may take 1-3 minutes depending on video size and length.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-4xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Script-Based Video Editor</h2>
          <p className="text-gray-400">Upload 3-5 video clips to get started</p>
        </div>

        <div
          className={`mb-6 p-8 border-4 border-dashed rounded-2xl text-center transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-700 rounded-full">
              <Upload className="w-10 h-10 text-gray-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Drop videos here</h3>
              <p className="text-gray-400">
                Drag and drop up to 10 clips, or click to browse
              </p>
            </div>
            
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="video/*"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
                Browse Files
              </div>
            </label>

            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <FileVideo className="w-4 h-4" />
              <span>MP4, MOV, WebM supported • Max 100MB each</span>
            </div>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Selected Videos ({selectedFiles.length}/5)
              </h3>
              <button
                onClick={() => setSelectedFiles([])}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedFiles.map(({ file, id }) => (
                <div
                  key={id}
                  className="bg-gray-700 rounded-lg p-4 flex items-start gap-3"
                >
                  <div className="p-2 bg-gray-600 rounded-lg flex-shrink-0">
                    <Film className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(id)}
                    className="p-1 hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {isValidCount 
                  ? 'Ready to upload!' 
                  : `Need ${3 - selectedFiles.length} more video${selectedFiles.length < 2 ? '' : 's'} to continue`
                }
              </p>
              
              {isValidCount && (
                <button
                  onClick={handleUpload}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Videos
                </button>
              )}
            </div>

            {!isValidCount && selectedFiles.length > 5 && (
              <p className="mt-2 text-sm text-red-400 text-center">
                Maximum 5 videos allowed
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-xl p- text-center p-4">
            <div className="text-2xl font-bold text-blue-400 mb-1">3-5</div>
            <div className="text-sm text-gray-400">Video clips</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p- text-center p-4">
            <div className="text-2xl font-bold text-blue-400 mb-1">AI</div>
            <div className="text-sm text-gray-400">Auto transcription</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p- text-center p-4">
            <div className="text-2xl font-bold text-blue-400 mb-1">Edit</div>
            <div className="text-sm text-gray-400">By editing text</div>
          </div>
        </div>
      </div>
    </div>
  )
}