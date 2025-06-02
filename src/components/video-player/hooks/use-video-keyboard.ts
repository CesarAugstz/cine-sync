'use client'

import { useEffect, useCallback } from 'react'

interface UseVideoKeyboardProps {
  onPlay: () => void
  onSkipForward: () => void
  onSkipBackward: () => void
  onToggleFullscreen: () => void
  onToggleMute: () => void
  onVolumeChange: (direction: 'up' | 'down') => void
  disabled?: boolean
}

export function useVideoKeyboard({
  onPlay,
  onSkipForward,
  onSkipBackward,
  onToggleFullscreen,
  onToggleMute,
  onVolumeChange,
  disabled = false,
}: UseVideoKeyboardProps) {
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return

      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          onPlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onSkipBackward()
          break
        case 'ArrowRight':
          e.preventDefault()
          onSkipForward()
          break
        case 'KeyF':
          e.preventDefault()
          onToggleFullscreen()
          break
        case 'KeyM':
          e.preventDefault()
          onToggleMute()
          break
        case 'ArrowUp':
          e.preventDefault()
          onVolumeChange('up')
          break
        case 'ArrowDown':
          e.preventDefault()
          onVolumeChange('down')
          break
        case 'KeyJ':
          e.preventDefault()
          onSkipBackward()
          break
        case 'KeyK':
          e.preventDefault()
          onPlay()
          break
        case 'KeyL':
          e.preventDefault()
          onSkipForward()
          break
      }
    },
    [disabled, onPlay, onSkipForward, onSkipBackward, onToggleFullscreen, onToggleMute, onVolumeChange]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])
}