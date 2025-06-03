import { useRoomStore } from '@/stores/room-store'
import { useEffect, useCallback } from 'react'

interface UseVideoEventsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  setCurrentTime: (value: number) => void
  setDuration: (value: number) => void
  setIsPlaying: (value: boolean) => void
  setIsLoading: (value: boolean) => void
  setIsFullscreen: (value: boolean) => void
  handleVideoSeeked: (video: HTMLVideoElement) => void
  isSeeking: boolean
  needsRecovery: boolean
}

export function useVideoEvents({
  videoRef,
  setCurrentTime,
  setDuration,
  setIsPlaying,
  setIsLoading,
  setIsFullscreen,
  handleVideoSeeked,
  isSeeking,
  needsRecovery,
}: UseVideoEventsProps) {
  const emitVideoCanPlay = useRoomStore(state => state.emitVideoCanPlay)
  const emitVideoWaiting = useRoomStore(state => state.emitVideoWaiting)

  const handleVideoError = useCallback(() => {
    setIsLoading(false)
  }, [setIsLoading])

  const handleVideoWaiting = useCallback(() => {
    setIsLoading(true)
    emitVideoWaiting(
      videoRef?.current?.currentTime ?? 0,
      !(videoRef?.current?.paused ?? false),
    )
  }, [emitVideoWaiting, setIsLoading, videoRef])

  const handleVideoCanPlay = useCallback(() => {
    setIsLoading(false)
    emitVideoCanPlay(!(videoRef?.current?.paused ?? false))
  }, [emitVideoCanPlay, setIsLoading, videoRef])

  const handleVideoLoadStart = useCallback(() => {
    setIsLoading(true)
  }, [setIsLoading])

  const handleVideoLoadedData = useCallback(() => {
    setIsLoading(false)
  }, [setIsLoading])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      if (isSeeking || needsRecovery) return
      setCurrentTime(video.currentTime)
    }

    const updateDuration = () => setDuration(video.duration)
    const handleFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleSeeked = () => handleVideoSeeked(video)

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('waiting', handleVideoWaiting)
    video.addEventListener('canplay', handleVideoCanPlay)
    video.addEventListener('loadstart', handleVideoLoadStart)
    video.addEventListener('loadeddata', handleVideoLoadedData)
    video.addEventListener('error', handleVideoError)
    video.addEventListener('seeked', handleSeeked)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('waiting', handleVideoWaiting)
      video.removeEventListener('canplay', handleVideoCanPlay)
      video.removeEventListener('loadstart', handleVideoLoadStart)
      video.removeEventListener('loadeddata', handleVideoLoadedData)
      video.removeEventListener('error', handleVideoError)
      video.removeEventListener('seeked', handleSeeked)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [
    videoRef,
    isSeeking,
    needsRecovery,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    handleVideoWaiting,
    handleVideoCanPlay,
    handleVideoLoadStart,
    handleVideoLoadedData,
    handleVideoError,
    handleVideoSeeked,
    setIsFullscreen,
  ])
}
