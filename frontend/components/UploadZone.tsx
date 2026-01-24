'use client'

import { useState } from 'react'
import { Upload, Film } from 'lucide-react'

interface UploadZoneProps {
  onUpload: (files: File[]) => void
}

export default function UploadZone({ onUpload }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

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
    
    if (files.length >= 3 && files.length <= 5) {
      onUpload(files)
    } else {
      alert('Please upload 3-5 video clips')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      file => file.type.startsWith('video/')
    )
    
    if (files.length >= 3 && files.length <= 5) {
      onUpload(files)
    } else {
      alert('Please upload 3-5 video clips')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        className={`w-full max-w-2xl p-12 border-4 border-dashed rounded-2xl text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="p-6 bg-gray-700 rounded-full">
            <Upload className="w-12 h-12 text-gray-400" />
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold mb-2">Upload Your Clips</h3>
            <p className="text-gray-400">
              Drop 3-5 short video clips here, or click to browse
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Film className="w-4 h-4" />
            <span>Supports MP4, MOV, WebM</span>
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
        </div>
      </div>
    </div>
  )
}