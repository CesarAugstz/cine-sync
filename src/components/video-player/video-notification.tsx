'use client'

import { SkipForward, SkipBack } from 'lucide-react'

interface VideoNotificationProps {
  show: boolean
  message: string
  type: 'forward' | 'backward'
}

export default function VideoNotification({
  show,
  message,
  type,
}: VideoNotificationProps) {
  if (!show) return null

  return (
    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
      <div className="flex items-center space-x-2 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
        {type === 'forward' ? (
          <SkipForward size={20} />
        ) : (
          <SkipBack size={20} />
        )}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}