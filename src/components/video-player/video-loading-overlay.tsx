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

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 pointer-events-none">
      <div className="flex items-center space-x-3 bg-black/80 text-white px-6 py-3 rounded-lg backdrop-blur-sm border border-white/20">
        <Loader2 size={24} className="animate-spin" />
        <span className="text-sm font-medium">
          {needsRecovery
            ? 'Recovering...'
            : isSeeking
            ? 'Seeking...'
            : 'Loading...'}
        </span>
      </div>
    </div>
  )
}