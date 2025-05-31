import { useCallback } from 'react'
import { useSubtitleStore } from '@/stores/subtitle-store'

interface UseVideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  isPlaying: boolean
  isSeeking: boolean
  needsRecovery: boolean
  duration: number
  volume: number
  isFullscreen: boolean
  setVolume: (value: number) => void
  performSeek: (video: HTMLVideoElement, time: number) => void
  showNotification: (message: string, type: 'forward' | 'backward') => void
}

export function useVideoControls({
  videoRef,
  containerRef,
  isPlaying,
  isSeeking,
  needsRecovery,
  duration,
  volume,
  isFullscreen,
  setVolume,
  performSeek,
  showNotification,
}: UseVideoControlsProps) {
  const { isEnabled, setEnabled } = useSubtitleStore()

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video || isSeeking || needsRecovery) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch(console.error)
    }
  }, [isPlaying, isSeeking, needsRecovery, videoRef])

  const skipForward = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const newTime = Math.min(video.currentTime + 15, duration)
    performSeek(video, newTime)
    showNotification('Forward 15s', 'forward')
  }, [duration, showNotification, performSeek, videoRef])

  const skipBackward = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const newTime = Math.max(video.currentTime - 15, 0)
    performSeek(video, newTime)
    showNotification('Backward 15s', 'backward')
  }, [showNotification, performSeek, videoRef])

  const handleSeek = useCallback(
    (value: number[]) => {
      const video = videoRef.current
      if (!video || !value.length) return

      const time = (value[0] / 100) * duration
      performSeek(video, time)
    },
    [duration, performSeek, videoRef],
  )

  const handleVolumeChange = useCallback((value: number[]) => {
    if (!value.length) return

    const newVolume = value[0] / 100
    setVolume(newVolume)

    const video = videoRef.current
    if (video) {
      video.volume = newVolume
      video.muted = false
    }
  }, [setVolume, videoRef])

  const handleVolumeAdjust = useCallback((delta: number) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = Math.max(0, Math.min(1, volume + delta))
    setVolume(newVolume)
    video.volume = newVolume
    video.muted = false
  }, [volume, setVolume, videoRef])

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen()
      return
    }

    if (containerRef.current) {
      containerRef.current.requestFullscreen()
    }
  }, [isFullscreen, containerRef])

  const toggleSubtitles = useCallback(() => {
    setEnabled(!isEnabled)
  }, [isEnabled, setEnabled])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const wasMuted = video.muted || volume === 0
    video.muted = !wasMuted
    setVolume(wasMuted ? 1 : 0)
  }, [volume, setVolume, videoRef])

  return {
    togglePlay,
    skipForward,
    skipBackward,
    handleSeek,
    handleVolumeChange,
    handleVolumeAdjust,
    toggleFullscreen,
    toggleSubtitles,
    toggleMute,
  }
}
