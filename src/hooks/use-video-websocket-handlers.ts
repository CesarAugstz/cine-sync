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
  const { setVideoExecutionFunctions } = useRoomStore()

  useEffect(() => {
    setVideoExecutionFunctions({
      executePlay,
      executePause,
      executeSeek,
      executeSync,
    })

    return () => {
      setVideoExecutionFunctions({})
    }
  }, [executePlay, executePause, executeSeek, executeSync, setVideoExecutionFunctions])
}
