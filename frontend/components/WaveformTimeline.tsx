import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface Word {
  word: string
  start: number
  end: number
}

interface WaveformTimelineProps {
  transcript: Word[]
  currentTime: number
  onSeek: (time: number) => void
}

export function WaveformTimeline({
  transcript,
  currentTime,
  onSeek,
}: WaveformTimelineProps) {
  const duration = transcript.length ? transcript[transcript.length - 1].end : 0

  const bars = useMemo(() => {
    const count = Math.min(70, Math.max(24, transcript.length || 24))
    const items = []

    for (let i = 0; i < count; i += 1) {
      const wordIndex = Math.floor((i / count) * transcript.length)
      const word = transcript[wordIndex]
      const base = word ? word.word.length : 4
      const intensity = Math.min(1, 0.25 + base / 12)
      const height = 14 + intensity * 34
      const time = word ? (word.start + word.end) / 2 : (i / count) * duration

      items.push({
        height,
        time,
        key: `${i}-${word?.word || 'bar'}`,
      })
    }

    return items
  }, [duration, transcript])

  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!transcript.length) {
    return (
      <motion.div
        className="px-4 pb-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="bg-gray-800/40 border border-gray-700/60 rounded-lg p-4 text-sm text-gray-400">
          Timeline appears once the transcript is ready.
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="px-4 pb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <motion.div
        className="bg-gray-800/40 border border-gray-700/60 rounded-lg p-4 timeline-panel"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
          <span>Timeline</span>
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <div className="relative h-16 flex items-end gap-1">
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-400/80 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
            style={{ left: `${progress}%` }}
          />
          {bars.map((bar, index) => (
            <button
              key={bar.key}
              type="button"
              onClick={() => onSeek(bar.time)}
              className="flex-1 flex items-end group"
            >
              <span
                className="block w-full rounded-sm bg-gray-500/60 group-hover:bg-blue-400/70 transition-colors timeline-bar"
                style={{
                  height: `${bar.height}px`,
                  animationDelay: `${Math.min(index * 18, 300)}ms`,
                }}
              />
            </button>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-gray-500">
          <span>Start</span>
          <span>End</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
