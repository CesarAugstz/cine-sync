'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { SubtitleTrack } from '@/types/movie'
import VideoControls from '../video-controls'
import VideoLoadingOverlay from './video-loading-overlay'
import VideoTitle from './video-title'
import RoomPanel from '../room/room-panel'
import { useVideoState } from './hooks/use-video-state'
import { useVideoNotifications } from './hooks/use-video-notifications'
import { useVideoSeek } from './hooks/use-video-seek'
import { useVideoSubtitles } from './hooks/use-video-subtitles'
import { useVideoEvents } from './hooks/use-video-events'
import { useVideoControls } from './hooks/use-video-controls'
import { useVideoKeyboard } from './hooks/use-video-keyboard'
import { useVideoWebSocketHandlers } from '@/hooks/use-video-websocket-handlers'
import { useRoomStore } from '@/stores/room-store'

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
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [roomPanelWidth, setRoomPanelWidth] = useState(0)
  const [isRoomPanelCollapsed, setIsRoomPanelCollapsed] = useState(true)
  const isAwaitingUsers = useRoomStore(state => state.isAwaitingUsers)

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

  const { showNotification } = useVideoNotifications()

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
    syncWithRoom,
    executePlay,
    executePause,
    executeSeek,
    executeSync,
    isPending,
  } = useVideoControls({
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
  })

  useVideoWebSocketHandlers({
    executePlay,
    executePause,
    executeSeek,
    executeSync,
  })

  useVideoKeyboard({
    onPlay: togglePlay,
    onSkipForward: skipForward,
    onSkipBackward: skipBackward,
    onToggleFullscreen: toggleFullscreen,
    onToggleMute: toggleMute,
    onVolumeChange: handleVolumeAdjust,
    disabled: isSeeking || needsRecovery || isPending,
  })

  const clearHideControlsTimeout = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
      hideControlsTimeoutRef.current = null
    }
  }, [])

  const startHideControlsTimer = useCallback(() => {
    clearHideControlsTimeout()
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
      hideControlsTimeoutRef.current = null
    }, 3000)
  }, [clearHideControlsTimeout, setShowControls])

  const handleMouseActivity = useCallback(() => {
    setShowControls(true)
    startHideControlsTimer()
  }, [setShowControls, startHideControlsTimer])

  const handleMouseEnter = useCallback(() => {
    setShowControls(true)
    startHideControlsTimer()
  }, [setShowControls, startHideControlsTimer])

  const handleMouseLeave = useCallback(() => {
    clearHideControlsTimeout()
    setShowControls(false)
  }, [clearHideControlsTimeout, setShowControls])

  const handleMouseMove = useCallback(() => {
    handleMouseActivity()
  }, [handleMouseActivity])

  const handleRoomPanelChange = useCallback(
    (width: number, collapsed: boolean) => {
      setRoomPanelWidth(width)
      setIsRoomPanelCollapsed(collapsed)
    },
    [],
  )

  useEffect(() => {
    return () => {
      clearHideControlsTimeout()
    }
  }, [clearHideControlsTimeout])

  return (
    <div className="relative max-h-[85vh] flex w-full h-screen bg-black">
      <div
        className={`flex-1 transition-all duration-300 ${
          isFullscreen ? 'w-screen h-screen' : ''
        }`}
        style={{
          marginRight: isFullscreen
            ? 0
            : isRoomPanelCollapsed
            ? 0
            : roomPanelWidth,
        }}
      >
        <div
          ref={containerRef}
          className={`relative h-full bg-black group ${
            isFullscreen ? 'w-screen h-screen' : 'w-full'
          } ${!showControls ? 'cursor-none' : 'cursor-auto'}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          <VideoTitle title={title} showControls={showControls} />

          <video
            ref={videoRef}
            className={`w-full h-full ${
              isFullscreen ? 'object-contain' : 'object-contain'
            }`}
            poster=""
            preload="auto"
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
            isAwaitingUsers={isAwaitingUsers}
            needsRecovery={needsRecovery}
          />

          {showControls && (
            <VideoControls
              isPlaying={isPlaying}
              duration={duration}
              volume={volume}
              isFullscreen={isFullscreen}
              progressPercentage={progressPercentage}
              formattedCurrentTime={formattedCurrentTime}
              formattedDuration={formattedDuration}
              subtitles={subtitles}
              isEnabled={isEnabled}
              isSeeking={isSeeking || needsRecovery}
              isPending={isPending}
              onPlay={togglePlay}
              onSkipForward={skipForward}
              onSkipBackward={skipBackward}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
              onToggleFullscreen={toggleFullscreen}
              onToggleSubtitles={toggleSubtitles}
              onToggleMute={toggleMute}
              onSyncWithRoom={syncWithRoom}
            />
          )}
        </div>
      </div>

      {!isFullscreen && <RoomPanel onWidthChange={handleRoomPanelChange} />}
    </div>
  )
}
