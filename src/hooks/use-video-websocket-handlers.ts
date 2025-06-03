'use client'

import { useEffect } from 'react'
import { useRoomStore } from '@/stores/room-store'
import { VideoState } from '@/lib/websocket/types'

export interface VideoExecutionFunctions {
  executePlay: (videoState: VideoState) => void
  executePause: (videoState: VideoState) => void
  executeSeek: (targetTime: number) => void
  executeSync: (currentTime: number, isPlaying: boolean) => void
}

export function useVideoWebSocketHandlers({
  executePlay,
  executePause, 
  executeSeek,
  executeSync
}: VideoExecutionFunctions) {
  const { setVideoExecutionFunctions } = useRoomStore()

  useEffect(() => {
    setVideoExecutionFunctions({
      executePlay,
      executePause,
      executeSeek,
      executeSync,
    })

    return () => {
      setVideoExecutionFunctions(undefined)
    }
  }, [executePlay, executePause, executeSeek, executeSync, setVideoExecutionFunctions])
}
