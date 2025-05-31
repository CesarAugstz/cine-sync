import { useRef, useCallback } from 'react'

interface UseVideoSeekProps {
  setIsSeeking: (value: boolean) => void
  setWasPlayingBeforeSeek: (value: boolean) => void
  setNeedsRecovery: (value: boolean) => void
  setCurrentTime: (value: number) => void
  isSeeking: boolean
  wasPlayingBeforeSeek: boolean
}

export function useVideoSeek({
  setIsSeeking,
  setWasPlayingBeforeSeek,
  setNeedsRecovery,
  setCurrentTime,
  isSeeking,
  wasPlayingBeforeSeek,
}: UseVideoSeekProps) {
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSeekTimeRef = useRef<number>(0)
  const seekCountRef = useRef<number>(0)
  const isRecoveringRef = useRef<boolean>(false)

  const forceVideoRecovery = useCallback(
    (video: HTMLVideoElement) => {
      if (isRecoveringRef.current) {
        console.log('[DEBUG] Recovery already in progress, skipping')
        return
      }

      console.log('[DEBUG] Starting video recovery', {
        currentTime: video.currentTime,
        readyState: video.readyState,
        paused: video.paused,
        videoWidth: video.videoWidth,
      })

      isRecoveringRef.current = true
      const targetTime = video.currentTime
      const wasPlaying = !video.paused

      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
        seekTimeoutRef.current = null
      }
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
        recoveryTimeoutRef.current = null
      }

      setNeedsRecovery(true)
      setIsSeeking(false)

      video.pause()
      video.currentTime = 0
      video.load()

      const handleRecovery = () => {
        console.log('[DEBUG] Video recovery canplay event', {
          targetTime,
          readyState: video.readyState,
        })

        video.removeEventListener('canplay', handleRecovery)

        video.currentTime = targetTime
        setCurrentTime(targetTime)

        setTimeout(() => {
          if (video.readyState >= 3) {
            console.log('[DEBUG] Video ready, completing recovery')
            setNeedsRecovery(false)
            isRecoveringRef.current = false

            if (!wasPlaying) return
            console.log('[DEBUG] Resuming playback after recovery')
            video
              .play()
              .catch(err =>
                console.error('[DEBUG] Play error after recovery:', err),
              )

            return
          }
          console.log('[DEBUG] Video not ready yet, waiting longer')
          setTimeout(() => {
            setNeedsRecovery(false)
            isRecoveringRef.current = false
            if (!wasPlaying) return
            video
              .play()
              .catch(err =>
                console.error('[DEBUG] Play error after recovery:', err),
              )
          }, 500)
        }, 100)
      }

      video.addEventListener('canplay', handleRecovery)

      setTimeout(() => {
        if (!isRecoveringRef.current) return
        console.log('[DEBUG] Recovery timeout, forcing completion')
        video.removeEventListener('canplay', handleRecovery)
        setNeedsRecovery(false)
        isRecoveringRef.current = false
      }, 5000)
    },
    [setNeedsRecovery, setIsSeeking, setCurrentTime],
  )

  const handleVideoSeeked = useCallback(
    (video: HTMLVideoElement) => {
      if (isRecoveringRef.current) {
        console.log('[DEBUG] Skipping seeked handler, recovery in progress')
        return
      }

      console.log('[DEBUG] Video seeked event', {
        currentTime: video.currentTime,
        readyState: video.readyState,
        paused: video.paused,
        videoWidth: video.videoWidth,
      })

      setCurrentTime(video.currentTime)
      setIsSeeking(false)

      if (!wasPlayingBeforeSeek) return
      console.log('[DEBUG] Resuming playback after seek')
      setTimeout(() => {
        video
          .play()
          .then(() => console.log('[DEBUG] Playback resumed successfully'))
          .catch(err => console.error('[DEBUG] Error resuming playback:', err))
      }, 100)
    },
    [wasPlayingBeforeSeek, setCurrentTime, setIsSeeking],
  )

  const performSeek = useCallback(
    (video: HTMLVideoElement, time: number) => {
      if (isRecoveringRef.current) {
        console.log('[DEBUG] Skipping seek, recovery in progress')
        return
      }

      const now = Date.now()
      console.log('[DEBUG] Performing seek - will force recovery', {
        targetTime: time,
        currentTime: video.currentTime,
        seekCount: seekCountRef.current,
        isSeeking,
        readyState: video.readyState,
      })

      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
        seekTimeoutRef.current = null
      }
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
        recoveryTimeoutRef.current = null
      }

      if (now - lastSeekTimeRef.current < 200) {
        seekCountRef.current += 1
        console.log(
          '[DEBUG] Throttling rapid seeks, count:',
          seekCountRef.current,
        )
        return
      }
      seekCountRef.current = 0

      lastSeekTimeRef.current = now

      if (!isSeeking) {
        const wasPlaying = !video.paused
        console.log('[DEBUG] Starting seek operation, was playing:', wasPlaying)
        setWasPlayingBeforeSeek(wasPlaying)
        setIsSeeking(true)
      }

      if (!video.paused) {
        console.log('[DEBUG] Pausing video for seek')
        video.pause()
      }

      video.currentTime = time

      setTimeout(() => {
        forceVideoRecovery(video)
      }, 50)
    },
    [isSeeking, setWasPlayingBeforeSeek, setIsSeeking, forceVideoRecovery],
  )

  return {
    performSeek,
    handleVideoSeeked,
    forceVideoRecovery,
    seekTimeoutRef,
    recoveryTimeoutRef,
  }
}
