'use client'

import { useCallback, useRef } from 'react'
import { useWebSocketVideo } from '@/hooks/use-websocket-video'
import { VideoState } from '@/lib/websocket/types'

interface UseVideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  isSeeking: boolean
  needsRecovery: boolean
  duration: number
  volume: number
  isFullscreen: boolean
  setIsFullscreen: (fullscreen: boolean) => void
  setVolume: (volume: number) => void
  performSeek: (video: HTMLVideoElement, time: number) => void
  showNotification: (
    message: string,
    type?: 'info' | 'success' | 'error',
  ) => void
}

export function useVideoControls({
  videoRef,
  containerRef,
  isPlaying,
  setIsPlaying,
  isSeeking,
  needsRecovery,
  duration,
  volume,
  isFullscreen,
  setIsFullscreen,
  setVolume,
  performSeek,
  showNotification,
}: UseVideoControlsProps) {
  const { isInRoom, emitPlay, emitPause, emitSeek, requestSync } =
    useWebSocketVideo()

  const pendingActionRef = useRef<string | null>(null)

  const executeSeek = useCallback(
    (targetTime: number) => {
      const video = videoRef.current
      if (!video) return

      performSeek(video, targetTime)
      pendingActionRef.current = null
    },
    [videoRef, performSeek],
  )

  const executeSync = useCallback(
    (currentTime: number, isPlaying: boolean) => {
      const video = videoRef.current
      if (!video) return

      performSeek(video, currentTime)
      if (isPlaying && video.paused) {
        video.play().catch(console.error)
        setIsPlaying(true)
      } else if (!isPlaying && !video.paused) {
        video.pause()
        setIsPlaying(false)
      }
      pendingActionRef.current = null
      showNotification('Synced with room')
    },
    [videoRef, performSeek, setIsPlaying, showNotification],
  )

  const executeSyncWhenOutOfSync = useCallback(
    (videoState: VideoState) => {
      const video = videoRef.current
      if (!video) return

      const currentTime = video.currentTime
      const currentTimeRoom = videoState.currentTime ?? 0
      const diff = Math.abs(currentTime - currentTimeRoom)
      if (diff > 2) {
        showNotification('Out of sync, syncing with room...', 'info')
        executeSync(currentTimeRoom, videoState.isPlaying ?? false)
      }
    },
    [videoRef, showNotification, executeSync],
  )

  const executePause = useCallback(
    (videoState?: VideoState) => {
      const video = videoRef.current
      if (!video) return

      if (videoState) executeSyncWhenOutOfSync(videoState)

      video.pause()
      setIsPlaying(false)
      pendingActionRef.current = null
    },
    [videoRef, executeSyncWhenOutOfSync, setIsPlaying],
  )

  const executePlay = useCallback(
    (videoState?: VideoState) => {
      const video = videoRef.current
      if (!video) return

      if (videoState) executeSyncWhenOutOfSync(videoState)

      video.play().catch(console.error)
      setIsPlaying(true)
      pendingActionRef.current = null
    },
    [videoRef, executeSyncWhenOutOfSync, setIsPlaying],
  )

  const togglePlay = useCallback(async () => {
    const video = videoRef.current
    if (!video || isSeeking || needsRecovery || pendingActionRef.current) return

    if (isInRoom) {
      try {
        if (isPlaying) {
          pendingActionRef.current = 'pause'
          showNotification('Requesting pause...', 'info')
          await emitPause({ currentTime: video.currentTime })
          showNotification('Pause confirmed', 'success')
        } else {
          pendingActionRef.current = 'play'
          showNotification('Requesting play...', 'info')
          await emitPlay(video.currentTime)
          showNotification('Play confirmed', 'success')
        }
      } catch (error) {
        console.error(error)
        pendingActionRef.current = null
        showNotification('Request failed', 'error')
      }
      return
    }

    if (isPlaying) {
      executePause()
    } else {
      executePlay()
    }
  }, [
    videoRef,
    isSeeking,
    needsRecovery,
    isInRoom,
    isPlaying,
    executePlay,
    executePause,
    showNotification,
    emitPlay,
    emitPause,
  ])

  const skipForward = useCallback(async () => {
    const video = videoRef.current
    if (!video || isSeeking || needsRecovery || pendingActionRef.current) return

    const newTime = Math.min(video.currentTime + 15, duration)

    if (isInRoom) {
      try {
        pendingActionRef.current = 'seek'
        showNotification('Requesting skip forward...', 'info')
        await emitSeek(video.currentTime, newTime, isPlaying)
        showNotification('Skip forward confirmed', 'success')
      } catch (error) {
        console.error(error)
        pendingActionRef.current = null
        showNotification('Request failed', 'error')
      }
      return
    }

    executeSeek(newTime)
    showNotification('+15s')
  }, [
    videoRef,
    isSeeking,
    needsRecovery,
    duration,
    isInRoom,
    executeSeek,
    showNotification,
    emitSeek,
    isPlaying,
  ])

  const skipBackward = useCallback(async () => {
    const video = videoRef.current
    if (!video || isSeeking || needsRecovery || pendingActionRef.current) return

    const newTime = Math.max(video.currentTime - 15, 0)

    if (isInRoom) {
      try {
        pendingActionRef.current = 'seek'
        showNotification('Requesting skip backward...', 'info')
        await emitSeek(video.currentTime, newTime, isPlaying)
        showNotification('Skip backward confirmed', 'success')
      } catch (error) {
        console.error('skipBackward', error)
        pendingActionRef.current = null
        showNotification('Request failed', 'error')
      }
      return
    }

    executeSeek(newTime)
    showNotification('-15s')
  }, [
    videoRef,
    isSeeking,
    needsRecovery,
    isInRoom,
    executeSeek,
    showNotification,
    emitSeek,
    isPlaying,
  ])

  const handleSeek = useCallback(
    async (value: number[]) => {
      const video = videoRef.current
      if (
        !video ||
        isSeeking ||
        needsRecovery ||
        !duration ||
        pendingActionRef.current
      )
        return

      const newTime = (value[0] / 100) * duration

      if (isInRoom) {
        try {
          pendingActionRef.current = 'seek'
          showNotification('Requesting seek...', 'info')
          await emitSeek(video.currentTime, newTime, isPlaying)
          showNotification('Seek confirmed', 'success')
        } catch (error) {
          console.error('handleSeek', error)
          pendingActionRef.current = null
          showNotification('Request failed', 'error')
        }
        return
      }

      executeSeek(newTime)
    },
    [
      videoRef,
      isSeeking,
      needsRecovery,
      duration,
      isInRoom,
      executeSeek,
      showNotification,
      emitSeek,
      isPlaying,
    ],
  )

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const video = videoRef.current
      if (!video) return

      const newVolume = value[0] / 100
      video.volume = newVolume
      setVolume(newVolume)
    },
    [videoRef, setVolume],
  )

  const handleVolumeAdjust = useCallback(
    (direction: 'up' | 'down') => {
      const video = videoRef.current
      if (!video) return

      const adjustment = direction === 'up' ? 0.1 : -0.1
      const newVolume = Math.max(0, Math.min(1, volume + adjustment))

      video.volume = newVolume
      setVolume(newVolume)
      showNotification(`Volume: ${Math.round(newVolume * 100)}%`)
    },
    [videoRef, volume, setVolume, showNotification],
  )

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    if (isInRoom) {
      showNotification('Fullscreen is local only in rooms', 'info')
    }

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container
          .requestFullscreen()
          .then(() => {
            setIsFullscreen(true)
          })
          .catch(console.error)
      }
    } else {
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => {
            setIsFullscreen(false)
          })
          .catch(console.error)
      }
    }
  }, [containerRef, isFullscreen, setIsFullscreen, isInRoom, showNotification])

  const toggleSubtitles = useCallback(() => {
    showNotification('Subtitle settings applied locally')
  }, [showNotification])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const newVolume = video.volume > 0 ? 0 : 1
    video.volume = newVolume
    setVolume(newVolume)
    showNotification(newVolume > 0 ? 'Unmuted' : 'Muted')
  }, [videoRef, setVolume, showNotification])

  const syncWithRoom = useCallback(() => {
    if (!isInRoom) return

    requestSync()
    showNotification('Syncing with room...', 'info')
  }, [isInRoom, requestSync, showNotification])

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
    syncWithRoom,
    executePlay,
    executePause,
    executeSeek,
    executeSync,
    isPending: !!pendingActionRef.current,
  }
}
