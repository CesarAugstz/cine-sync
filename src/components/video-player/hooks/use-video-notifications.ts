import { useState, useRef, useCallback } from 'react'

interface Notification {
  show: boolean
  message: string
  type: 'forward' | 'backward'
}

export function useVideoNotifications() {
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'forward',
  })

  const showNotification = useCallback(
    (message: string, type: 'forward' | 'backward') => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }

      setNotification({
        show: true,
        message,
        type,
      })

      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(prev => ({
          ...prev,
          show: false,
        }))
      }, 1500)
    },
    [],
  )

  return {
    notification,
    showNotification,
    notificationTimeoutRef,
  }
}