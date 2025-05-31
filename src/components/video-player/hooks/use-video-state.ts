import { useState, useMemo } from 'react'

export function useVideoState() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [wasPlayingBeforeSeek, setWasPlayingBeforeSeek] = useState(false)
  const [needsRecovery, setNeedsRecovery] = useState(false)

  const progressPercentage = useMemo(() => {
    if (!duration) return 0
    return (currentTime / duration) * 100
  }, [currentTime, duration])

  const formattedCurrentTime = useMemo(() => {
    const minutes = Math.floor(currentTime / 60)
    const seconds = Math.floor(currentTime % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [currentTime])

  const formattedDuration = useMemo(() => {
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [duration])

  return {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    setVolume,
    showControls,
    setShowControls,
    isFullscreen,
    setIsFullscreen,
    isLoading,
    setIsLoading,
    isSeeking,
    setIsSeeking,
    wasPlayingBeforeSeek,
    setWasPlayingBeforeSeek,
    needsRecovery,
    setNeedsRecovery,
    progressPercentage,
    formattedCurrentTime,
    formattedDuration,
  }
}