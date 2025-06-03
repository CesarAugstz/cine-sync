'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'

export function useVideoNotifications() {
  const showNotification = useCallback(
    (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      console.log('showNotification', message, type)
      switch (type) {
        case 'info':
          toast.info(message)
          break
        case 'success':
          toast.success(message)
          break
        case 'error':
          toast.error(message)
          break
      }
    },
    [],
  )

  return {
    showNotification,
  }
}
