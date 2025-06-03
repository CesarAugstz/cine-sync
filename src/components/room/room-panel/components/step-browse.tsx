'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw, Users, User, Clock } from 'lucide-react'
import { dayJs } from '@/lib/dayjs'

interface Room {
  id: string
  name: string
  users: Array<{ id: string; name: string }>
  createdAt: string
}

interface StepBrowseProps {
  userName: string
  onBack: () => void
  onJoinRoom: (userName: string, roomId: string) => void
  onRefreshRooms: () => void
  availableRooms: Room[]
  isLoadingRooms: boolean
  isLoading: boolean
  direction: number
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 350 : -350,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 350 : -350,
    opacity: 0,
  }),
}

export default function StepBrowse({
  userName,
  onBack,
  onJoinRoom,
  onRefreshRooms,
  availableRooms,
  isLoadingRooms,
  isLoading,
  direction
}: StepBrowseProps) {
  return (
    <motion.div
      key="browse-step"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
      className="p-4 space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={18} />
          </Button>
          <h3 className="text-lg font-medium text-white">Available Rooms</h3>
        </div>
        <Button
          onClick={onRefreshRooms}
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white"
          disabled={isLoadingRooms}
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingRooms ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3">
        {isLoadingRooms && (
          <div className="text-center py-8 text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
            Loading rooms...
          </div>
        )}

        {!isLoadingRooms && availableRooms.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
            No rooms available
          </div>
        )}

        {!isLoadingRooms && availableRooms.map(room => (
          <div
            key={room.id}
            className="bg-gray-800/50 rounded-lg p-4 space-y-3 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
          >
            <div className="space-y-2">
              <h4 className="text-white font-medium truncate">{room.name}</h4>
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{room.users.length} users</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{dayJs(room.createdAt).fromNow()}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => onJoinRoom(userName, room.id)}
              disabled={!userName.trim() || isLoading}
              size="sm"
              className="w-full"
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </Button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}