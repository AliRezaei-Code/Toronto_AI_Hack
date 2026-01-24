'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

interface MagicBoxProps {
  onSendMessage: (message: string) => void
  isProcessing?: boolean
}

export default function MagicBox({
  onSendMessage,
  isProcessing = false,
}: MagicBoxProps) {
  const [message, setMessage] = useState('')

  const suggestions = [
    'Make it snappier',
    'Remove the silence',
    'Delete the second sentence',
    'Cut out the umms and aahs',
    'Make this intro faster',
  ]

  const handleSend = () => {
    if (message.trim() && !isProcessing) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (!isProcessing) {
      onSendMessage(suggestion)
    }
  }

  return (
    <div className="border-t border-gray-700 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what to edit... (e.g., 'Make it snappier')"
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || isProcessing}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Send className={`w-5 h-5 ${isProcessing ? 'animate-pulse' : ''}`} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Try:</span>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isProcessing}
              className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}