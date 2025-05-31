'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { SkipForward, SkipBack, Loader2 } from 'lucide-react'
import { useSubtitleStore } from '@/stores/subtitle-store'
import { SubtitleTrack } from '@/types/movie'
import VideoControls from './video-controls'

interface VideoPlayerProps {
  src: string
  title: string
  subtitles?: SubtitleTrack[]
}

export default function VideoPlayer({
  src,
  title,
  subtitles = [],
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [wasPlayingBeforeSeek, setWasPlayingBeforeSeek] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: 'forward' | 'backward'
  }>({
    show: false,
    message: '',
    type: 'forward',
  })

  const { isEnabled, currentLang, settings, setEnabled, initializeLanguage } =
    useSubtitleStore()

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

  const showNotification = useCallback(
    (message: string, type: 'forward' | 'backward') => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }

      setNotification({
        show: true,
        message,
        type,
      })

      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(prev => ({
          ...prev,
          show: false,
        }))
      }, 1500)
    },
    [],
  )

  const handleVideoError = useCallback(() => {
    console.error('Video error occurred')
    setIsLoading(false)
    setIsSeeking(false)
  }, [])

  const handleVideoWaiting = useCallback(() => {
    setIsLoading(true)
  }, [])

  const handleVideoCanPlay = useCallback(() => {
    setIsLoading(false)
    if (isSeeking) {
      setIsSeeking(false)
      if (wasPlayingBeforeSeek) {
        const video = videoRef.current
        if (video) {
          video.play().catch(console.error)
        }
      }
    }
  }, [isSeeking, wasPlayingBeforeSeek])

  const handleVideoLoadStart = useCallback(() => {
    setIsLoading(true)
  }, [])

  const handleVideoLoadedData = useCallback(() => {
    setIsLoading(false)
  }, [])

  const performSeek = useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return

    setIsSeeking(true)
    setWasPlayingBeforeSeek(!video.paused)

    if (!video.paused) {
      video.pause()
    }

    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current)
    }

    seekTimeoutRef.current = setTimeout(() => {
      video.currentTime = time
      setCurrentTime(time)
    }, 50)
  }, [])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video || isSeeking) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch(console.error)
    }
  }, [isPlaying, isSeeking])

  const skipForward = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const newTime = Math.min(video.currentTime + 15, duration)
    performSeek(newTime)
    showNotification('Forward 15s', 'forward')
  }, [duration, showNotification, performSeek])

  const skipBackward = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const newTime = Math.max(video.currentTime - 15, 0)
    performSeek(newTime)
    showNotification('Backward 15s', 'backward')
  }, [showNotification, performSeek])

  const handleSeek = useCallback(
    (value: number[]) => {
      const video = videoRef.current
      if (!video || !value.length) return

      const time = (value[0] / 100) * duration
      performSeek(time)
    },
    [duration, performSeek],
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
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen()
      return
    }

    if (containerRef.current) {
      containerRef.current.requestFullscreen()
    }
  }, [isFullscreen])

  const toggleSubtitles = useCallback(() => {
    setEnabled(!isEnabled)
  }, [isEnabled, setEnabled])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const wasMuted = video.muted || volume === 0
    video.muted = !wasMuted
    setVolume(wasMuted ? 1 : 0)
  }, [volume])

  const handleMouseEnter = useCallback(() => {
    setShowControls(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setShowControls(false)
  }, [])

  useEffect(() => {
    if (!subtitles.length) return
    const availableLanguages = subtitles.map(sub => sub.lang)
    initializeLanguage(availableLanguages)
  }, [subtitles, initializeLanguage])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime)
      }
    }
    const updateDuration = () => setDuration(video.duration)
    const handleFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('waiting', handleVideoWaiting)
    video.addEventListener('canplay', handleVideoCanPlay)
    video.addEventListener('loadstart', handleVideoLoadStart)
    video.addEventListener('loadeddata', handleVideoLoadedData)
    video.addEventListener('error', handleVideoError)
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
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [
    isSeeking,
    handleVideoWaiting,
    handleVideoCanPlay,
    handleVideoLoadStart,
    handleVideoLoadedData,
    handleVideoError,
  ])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !subtitles.length) return

    const tracks = video.textTracks
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      track.mode =
        track.language === currentLang && isEnabled ? 'showing' : 'hidden'
    }
  }, [isEnabled, currentLang, subtitles])

  useEffect(() => {
    if (styleRef.current) {
      document.head.removeChild(styleRef.current)
      styleRef.current = null
    }

    if (!isEnabled) return

    const style = document.createElement('style')
    style.setAttribute('data-subtitle-styles', 'true')

    const alphaHex = Math.round(settings.opacity * 255)
      .toString(16)
      .padStart(2, '0')

    style.textContent = `
    video::cue {
      font-size: ${settings.fontSize}px !important;
      font-family: "${settings.fontFamily}", sans-serif !important;
      color: ${settings.color} !important;
      background-color: ${settings.backgroundColor}${alphaHex} !important;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8) !important;
      white-space: pre-line !important;
    }
    
    video::cue(.speaker) {
      font-size: ${settings.fontSize}px !important;
      font-family: "${settings.fontFamily}", sans-serif !important;
      color: ${settings.color} !important;
      background-color: ${settings.backgroundColor}${alphaHex} !important;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8) !important;
    }
  `

    document.head.appendChild(style)
    styleRef.current = style

    return () => {
      if (styleRef.current && document.head.contains(styleRef.current)) {
        document.head.removeChild(styleRef.current)
        styleRef.current = null
      }
    }
  }, [settings, isEnabled])

  useEffect(() => {
    return () => {
      if (styleRef.current && document.head.contains(styleRef.current)) {
        document.head.removeChild(styleRef.current)
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative max-h-[90vh] bg-black group ${
        isFullscreen ? 'w-screen h-screen' : 'w-full'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showControls && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
          <h1 className="text-white text-2xl font-bold">{title}</h1>
        </div>
      )}

      <video
        ref={videoRef}
        className={`w-full h-auto ${
          isFullscreen ? 'h-full object-contain' : 'max-h-[90vh]'
        }`}
        poster=""
        preload="metadata"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        crossOrigin="anonymous"
      >
        <source src={src} type="video/mp4" />
        {subtitles.map(subtitle => (
          <track
            key={subtitle.lang}
            kind="subtitles"
            src={subtitle.src}
            srcLang={subtitle.lang}
            label={subtitle.label}
            default={subtitle.lang === currentLang}
          />
        ))}
        Your browser does not support the video tag.
      </video>

      {(isLoading || isSeeking) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 pointer-events-none">
          <div className="flex items-center space-x-3 bg-black/80 text-white px-6 py-3 rounded-lg backdrop-blur-sm border border-white/20">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-sm font-medium">
              {isSeeking ? 'Seeking...' : 'Loading...'}
            </span>
          </div>
        </div>
      )}

      {notification.show && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center space-x-2 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
            {notification.type === 'forward' ? (
              <SkipForward size={20} />
            ) : (
              <SkipBack size={20} />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {showControls && (
        <VideoControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isFullscreen={isFullscreen}
          progressPercentage={progressPercentage}
          formattedCurrentTime={formattedCurrentTime}
          formattedDuration={formattedDuration}
          subtitles={subtitles}
          isEnabled={isEnabled}
          isSeeking={isSeeking}
          onPlay={togglePlay}
          onSkipForward={skipForward}
          onSkipBackward={skipBackward}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleFullscreen={toggleFullscreen}
          onToggleSubtitles={toggleSubtitles}
          onToggleMute={toggleMute}
        />
      )}
    </div>
  )
}
