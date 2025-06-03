'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, Copy, RefreshCw, Settings } from 'lucide-react'
import { SocketRoom, VideoState } from '@/lib/websocket/types'

interface RoomInfoProps {
  currentRoom: SocketRoom
  videoState?: VideoState
  lastVideoAction?: string
  onLeaveRoom: () => void
  onCopyRoomId: () => void
  onSyncVideo: () => void
}

export default function RoomInfo({
  currentRoom,
  videoState,
  lastVideoAction,
  onLeaveRoom,
  onCopyRoomId,
  onSyncVideo,
}: RoomInfoProps) {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getLastActionText = () => {
    if (!lastVideoAction || !videoState) return ''

    switch (lastVideoAction) {
      case 'play':
        return 'Started playing'
      case 'pause':
        return 'Paused'
      case 'seek':
        return `Seeked to ${formatTime(videoState.currentTime ?? 0)}`
      case 'sync':
        return 'Synced with room'
      default:
        return ''
    }
  }

  return (
    <motion.div
      key="room-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 space-y-4"
    >
      <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">{currentRoom.name}</h3>
          <Button
            onClick={onLeaveRoom}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <code className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 flex-1">
            {currentRoom.id}
          </code>
          <Button
            onClick={onCopyRoomId}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <Copy size={14} />
          </Button>
        </div>
      </div>

      {videoState && (
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Video Status</span>
            <Button
              onClick={onSyncVideo}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw size={14} />
            </Button>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">State:</span>
              <span
                className={`${
                  videoState.isPlaying ? 'text-green-400' : 'text-yellow-400'
                }`}
              >
                {videoState.isPlaying ? 'Playing' : 'Paused'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Time:</span>
              <span className="text-white">
                {formatTime(videoState.currentTime ?? 0)}
              </span>
            </div>
            {lastVideoAction && (
              <div className="flex justify-between">
                <span className="text-gray-400">Last:</span>
                <span className="text-blue-400">{getLastActionText()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-lg p-3">
        <h4 className="text-sm text-gray-300 mb-2">
          Users ({currentRoom.users.length})
        </h4>
        <div className="space-y-1">
          {currentRoom.users.map(user => (
            <div key={user.id} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-white flex-1">{user.name}</span>
              {user.id === currentRoom.hostId && (
                <span className="text-xs bg-blue-600 px-1 py-0.5 rounded text-white">
                  Host
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-3">
        <h4 className="text-sm text-gray-300 mb-2 flex items-center">
          <Settings className="w-4 h-4 mr-1" />
          Settings
        </h4>
        <div className="space-y-2 text-xs text-gray-400">
          <p>• Video controls are synchronized</p>
          <p>• Volume and subtitles are local</p>
          <p>• Fullscreen is local only</p>
        </div>
      </div>
    </motion.div>
  )
}
