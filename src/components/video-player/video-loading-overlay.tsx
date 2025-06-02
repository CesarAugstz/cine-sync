'use client'

import { Loader2 } from 'lucide-react'

interface VideoLoadingOverlayProps {
  isLoading: boolean
  isSeeking: boolean
  needsRecovery: boolean
}

export default function VideoLoadingOverlay({
  isLoading,
  isSeeking,
  needsRecovery,
}: VideoLoadingOverlayProps) {
  if (!isLoading && !isSeeking && !needsRecovery) return null

  let message = 'Loading...'
  if (isSeeking) message = 'Seeking...'
  if (needsRecovery) message = 'Recovering video...'

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
        <span className="text-white text-sm">{message}</span>
      </div>
    </div>
  )
}