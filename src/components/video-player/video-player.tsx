'use client'

import { useRef, useCallback, useState } from 'react'
import { SubtitleTrack } from '@/types/movie'
import VideoControls from '../video-controls'
import VideoLoadingOverlay from './video-loading-overlay'
import VideoNotification from './video-notification'
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
  const [roomPanelWidth, setRoomPanelWidth] = useState(0)
  const [isRoomPanelCollapsed, setIsRoomPanelCollapsed] = useState(true)

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

  const handleMouseEnter = useCallback(() => {
    setShowControls(true)
  }, [setShowControls])

  const handleMouseLeave = useCallback(() => {
    setShowControls(false)
  }, [setShowControls])

  const handleRoomPanelChange = useCallback(
    (width: number, collapsed: boolean) => {
      setRoomPanelWidth(width)
      setIsRoomPanelCollapsed(collapsed)
    },
    [],
  )

  return (
    <div className="relative flex w-full h-screen bg-black">
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
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <VideoTitle title={title} showControls={showControls} />

          <video
            ref={videoRef}
            className={`w-full h-full ${
              isFullscreen ? 'object-contain' : 'object-contain'
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
