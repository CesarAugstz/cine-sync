'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  Minimize,
  Subtitles,
  SkipForward,
  SkipBack,
  VolumeX,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import SubtitleSettings from './subtitle-settings'
import { SubtitleTrack } from '@/types/movie'
import { useRoomStore } from '@/stores/room-store'

interface VideoControlsProps {
  isPlaying: boolean
  duration: number
  volume: number
  isFullscreen: boolean
  progressPercentage: number
  formattedCurrentTime: string
  formattedDuration: string
  subtitles: SubtitleTrack[]
  isEnabled: boolean
  isSeeking?: boolean
  isPending?: boolean
  onPlay: () => void
  onSkipForward: () => void
  onSkipBackward: () => void
  onSeek: (value: number[]) => void
  onVolumeChange: (value: number[]) => void
  onToggleFullscreen: () => void
  onToggleSubtitles: () => void
  onToggleMute: () => void
  onSyncWithRoom?: () => void
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export default function VideoControls({
  isPlaying,
  duration,
  volume,
  isFullscreen,
  progressPercentage,
  formattedCurrentTime,
  formattedDuration,
  subtitles,
  isEnabled,
  isSeeking = false,
  isPending = false,
  onPlay,
  onSkipForward,
  onSkipBackward,
  onSeek,
  onVolumeChange,
  onToggleFullscreen,
  onToggleSubtitles,
  onToggleMute,
  onSyncWithRoom,
}: VideoControlsProps) {
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverPosition, setHoverPosition] = useState<number>(0)
  const [isHovering, setIsHovering] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const { currentRoom, isConnected } = useRoomStore()

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!sliderRef.current || !duration) return

      const rect = sliderRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
      const time = (percentage / 100) * duration

      setHoverTime(time)
      setHoverPosition(x)
      setIsHovering(true)
    },
    [duration],
  )

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setHoverTime(null)
  }, [])

  const isDisabled = isSeeking || isPending

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipBackward}
          disabled={isDisabled}
          className="text-white hover:text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Skip backward 15s"
        >
          <SkipBack size={24} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onPlay}
          disabled={isDisabled}
          className="text-white hover:text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipForward}
          disabled={isDisabled}
          className="text-white hover:text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Skip forward 15s"
        >
          <SkipForward size={24} />
        </Button>

        <div className="flex-1 px-2 relative">
          <div
            ref={sliderRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative"
          >
            <Slider
              value={[progressPercentage]}
              onValueChange={onSeek}
              max={100}
              step={0.1}
              disabled={isDisabled || !duration}
              className="w-full cursor-pointer"
            />

            {/* Hover tooltip */}
            {isHovering && hoverTime !== null && (
              <div
                className="absolute -top-12 transform -translate-x-1/2 bg-white text-black text-sm font-medium px-3 py-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-20 border border-gray-200"
                style={{ left: `${hoverPosition}px` }}
              >
                {formatTime(hoverTime)}
                {/* Arrow pointing down */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
              </div>
            )}
          </div>
        </div>

        <span className="text-white text-sm min-w-[80px] text-center">
          {formattedCurrentTime} / {formattedDuration}
        </span>

        <div className="flex cursor-pointer items-center space-x-2">
          {volume === 0 ? (
            <VolumeX
              onClick={onToggleMute}
              size={20}
              className="text-white hover:text-gray-300 transition-colors"
            />
          ) : (
            <Volume2
              onClick={onToggleMute}
              size={20}
              className="text-white hover:text-gray-300 transition-colors"
            />
          )}
          <div className="w-20">
            <Slider
              value={[volume * 100]}
              onValueChange={onVolumeChange}
              max={100}
              step={1}
              className="w-full cursor-pointer"
            />
          </div>
        </div>

        {subtitles.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSubtitles}
              className={`transition-colors ${
                isEnabled
                  ? 'text-white hover:text-gray-300 hover:bg-white/10'
                  : 'text-gray-500 hover:text-gray-400 hover:bg-white/5'
              }`}
              title={isEnabled ? 'Disable subtitles' : 'Enable subtitles'}
            >
              <Subtitles size={20} />
            </Button>
            <SubtitleSettings tracks={subtitles} />
          </>
        )}

        {currentRoom && isConnected && onSyncWithRoom && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSyncWithRoom}
            className="text-white hover:text-gray-300 hover:bg-white/10 transition-colors"
            title="Sync with room"
          >
            <RefreshCw size={20} />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFullscreen}
          className="text-white hover:text-gray-300 hover:bg-white/10 transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </Button>
      </div>
    </div>
  )
}
