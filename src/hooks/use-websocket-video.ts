'use client'

import { useCallback } from 'react'
import { useRoomStore } from '@/stores/room-store'

export function useWebSocketVideo() {
  const {
    currentRoom,
    isConnected,
    emitVideoPlay,
    emitVideoPause,
    emitVideoSeek,
    syncVideo,
  } = useRoomStore()

  const isInRoom = Boolean(currentRoom && isConnected)

  const emitPlay = useCallback(
    (currentTime: number) => {
      if (!isInRoom) return Promise.reject('Not in room')
      return emitVideoPlay(currentTime)
    },
    [isInRoom, emitVideoPlay],
  )

  const emitPause = useCallback(
    ({ currentTime }: { currentTime: number }) => {
      if (!isInRoom) return Promise.reject('Not in room')
      return emitVideoPause(currentTime)
    },
    [isInRoom, emitVideoPause],
  )

  const emitSeek = useCallback(
    (fromTime: number, targetTime: number, isPlaying: boolean) => {
      if (!isInRoom) return Promise.reject('Not in room')
      return emitVideoSeek(fromTime, targetTime, isPlaying)
    },
    [isInRoom, emitVideoSeek],
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
