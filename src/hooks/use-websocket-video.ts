'use client'

import { useCallback } from 'react'
import { useRoomStore } from '@/stores/room-store'

export function useWebSocketVideo() {
  const {
    currentRoom,
    isConnected,
    emitVideoControl,
    syncVideo,
  } = useRoomStore()

  const isInRoom = Boolean(currentRoom && isConnected)

  const emitPlay = useCallback(
    (currentTime: number) => {
      if (!isInRoom) return
      emitVideoControl('video_play', {
        roomId: currentRoom!.id,
        currentTime,
        timestamp: Date.now(),
      })
    },
    [isInRoom, emitVideoControl, currentRoom],
  )

  const emitPause = useCallback(
    ({ currentTime }: { currentTime: number }) => {
      if (!isInRoom) return
      emitVideoControl('video_pause', {
        roomId: currentRoom!.id,
        currentTime,
        timestamp: Date.now(),
      })
    },
    [isInRoom, emitVideoControl, currentRoom],
  )

  const emitSeek = useCallback(
    (fromTime: number, targetTime: number) => {
      if (!isInRoom) return
      emitVideoControl('video_seek', {
        roomId: currentRoom!.id,
        currentTime: fromTime,
        targetTime,
        timestamp: Date.now(),
      })
    },
    [isInRoom, emitVideoControl, currentRoom],
  )

  const requestSync = useCallback(() => {
    if (!isInRoom) return
    syncVideo()
  }, [isInRoom, syncVideo])

  return {
    isInRoom,
    emitPlay,
    emitPause,
    emitSeek,
    requestSync,
  }
}
