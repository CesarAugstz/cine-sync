'use client'

import { 
  Play, 
  Pause, 
  Volume2, 
  Maximize, 
  Minimize, 
  Subtitles, 
  SkipForward, 
  SkipBack, 
  VolumeX 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import SubtitleSettings from './subtitle-settings'
import { SubtitleTrack } from '@/types/movie'

interface VideoControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isFullscreen: boolean
  progressPercentage: number
  formattedCurrentTime: string
  formattedDuration: string
  subtitles: SubtitleTrack[]
  isEnabled: boolean
  isSeeking?: boolean
  onPlay: () => void
  onSkipForward: () => void
  onSkipBackward: () => void
  onSeek: (value: number[]) => void
  onVolumeChange: (value: number[]) => void
  onToggleFullscreen: () => void
  onToggleSubtitles: () => void
  onToggleMute: () => void
}

export default function VideoControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isFullscreen,
  progressPercentage,
  formattedCurrentTime,
  formattedDuration,
  subtitles,
  isEnabled,
  isSeeking = false,
  onPlay,
  onSkipForward,
  onSkipBackward,
  onSeek,
  onVolumeChange,
  onToggleFullscreen,
  onToggleSubtitles,
  onToggleMute,
}: VideoControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipBackward}
          disabled={isSeeking}
          className="text-white hover:text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Skip backward 15s"
        >
          <SkipBack size={24} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onPlay}
          disabled={isSeeking}
          className="text-white hover:text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSkipForward}
          disabled={isSeeking}
          className="text-white hover:text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Skip forward 15s"
        >
          <SkipForward size={24} />
        </Button>

        <div className="flex-1 px-2">
          <Slider
            value={[progressPercentage]}
            onValueChange={onSeek}
            max={100}
            step={0.1}
            disabled={isSeeking || !duration}
            className="w-full"
          />
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
              className="w-full"
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