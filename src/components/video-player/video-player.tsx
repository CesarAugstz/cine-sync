'use client'

import { useRef, useCallback } from 'react'
import { SubtitleTrack } from '@/types/movie'
import VideoControls from '../video-controls'
import VideoLoadingOverlay from './video-loading-overlay'
import VideoNotification from './video-notification'
import VideoTitle from './video-title'
import { useVideoState } from './hooks/use-video-state'
import { useVideoNotifications } from './hooks/use-video-notifications'
import { useVideoSeek } from './hooks/use-video-seek'
import { useVideoSubtitles } from './hooks/use-video-subtitles'
import { useVideoEvents } from './hooks/use-video-events'
import { useVideoControls } from './hooks/use-video-controls'
import { useVideoKeyboard } from './hooks/use-video-keyboard'

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
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
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
  } = useVideoState()

  const { notification, showNotification } = useVideoNotifications()

  const { performSeek, handleVideoSeeked } = useVideoSeek({
    setIsSeeking,
    setWasPlayingBeforeSeek,
    setNeedsRecovery,
    setCurrentTime,
    isSeeking,
    wasPlayingBeforeSeek,
  })

  const { isEnabled } = useVideoSubtitles(videoRef, subtitles)

  useVideoEvents({
    videoRef,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setIsLoading,
    setIsFullscreen,
    handleVideoSeeked,
    isSeeking,
    needsRecovery,
  })

  const {
    togglePlay,
    skipForward,
    skipBackward,
    handleSeek,
    handleVolumeChange,
    handleVolumeAdjust,
    toggleFullscreen,
    toggleSubtitles,
    toggleMute,
  } = useVideoControls({
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
  })

  useVideoKeyboard({
    onPlay: togglePlay,
    onSkipForward: skipForward,
    onSkipBackward: skipBackward,
    onToggleFullscreen: toggleFullscreen,
    onToggleMute: toggleMute,
    onVolumeChange: handleVolumeAdjust,
    disabled: isSeeking || needsRecovery,
  })

  const handleMouseEnter = useCallback(() => {
    setShowControls(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setShowControls(false)
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
      <VideoTitle title={title} showControls={showControls} />

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
            default={subtitle.lang === subtitle.lang}
          />
        ))}
        Your browser does not support the video tag.
      </video>

      <VideoLoadingOverlay
        isLoading={isLoading}
        isSeeking={isSeeking}
        needsRecovery={needsRecovery}
      />

      <VideoNotification
        show={notification.show}
        message={notification.message}
        type={notification.type}
      />

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
          isSeeking={isSeeking || needsRecovery}
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