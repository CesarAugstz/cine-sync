'use client'

import { useState, useCallback } from 'react'

interface NotificationState {
  show: boolean
  message: string
  type: 'info' | 'success' | 'error'
}

export function useVideoNotifications() {
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  })

  const showNotification = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setNotification({ show: true, message, type })
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }, [])

  return {
    notification,
    showNotification
  }
}