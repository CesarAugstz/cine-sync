'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Info, AlertCircle } from 'lucide-react'

interface VideoNotificationProps {
  show: boolean
  message: string
  type: 'info' | 'success' | 'error'
}

export default function VideoNotification({
  show,
  message,
  type,
}: VideoNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
    }
  }, [show])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600/90 text-white border-green-500'
      case 'error':
        return 'bg-red-600/90 text-white border-red-500'
      default:
        return 'bg-blue-600/90 text-white border-blue-500'
    }
  }

  return (
    <AnimatePresence>
      {show && isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30"
        >
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border backdrop-blur-sm ${getStyles()}`}
          >
            {getIcon()}
            <span className="font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
