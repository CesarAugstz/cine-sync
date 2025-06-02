'use client'

import { useEffect } from 'react'
import { useRoomStore } from '@/stores/room-store'

interface VideoExecutionFunctions {
  executePlay: () => void
  executePause: () => void
  executeSeek: (targetTime: number) => void
  executeSync: (currentTime: number, isPlaying: boolean) => void
}

export function useVideoWebSocketHandlers({
  executePlay,
  executePause, 
  executeSeek,
  executeSync
}: VideoExecutionFunctions) {
  const { socket, isConnected, currentRoom } = useRoomStore()

  useEffect(() => {
    console.log('useVideoWebSocketHandlers', { socket, isConnected, currentRoom })
    if (!socket || !isConnected || !currentRoom) return
      console.log('pass useVideoWebSocketHandlers', { socket, isConnected, currentRoom })

    const handleVideoPlay = (data: { currentTime: number; timestamp: number; userId: string }) => {
      console.log('Received video play event', data)
      executePlay()
    }

    const handleVideoPause = (data: { currentTime: number; timestamp: number; userId: string }) => {
      console.log('Received video pause event', data)
      executePause()
    }

    const handleVideoSeek = (data: { targetTime: number; currentTime: number; timestamp: number; userId: string }) => {
      console.log('Received video seek event', data)
      executeSeek(data.targetTime)
    }

    const handleVideoSyncResponse = (data: { currentTime: number; isPlaying: boolean; timestamp: number; hostUserId: string }) => {
      console.log('Received video sync response', data)
      executeSync(data.currentTime, data.isPlaying)
    }

    socket.on('video_play', handleVideoPlay)
    socket.on('video_pause', handleVideoPause)
    socket.on('video_seek', handleVideoSeek)
    socket.on('video_sync_response', handleVideoSyncResponse)

    return () => {
      socket.off('video_play', handleVideoPlay)
      socket.off('video_pause', handleVideoPause)
      socket.off('video_seek', handleVideoSeek)
      socket.off('video_sync_response', handleVideoSyncResponse)
    }
  }, [socket, isConnected, currentRoom, executePlay, executePause, executeSeek, executeSync])
}
