'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, UserPlus } from 'lucide-react'

interface StepJoinProps {
  roomId: string
  onRoomIdChange: (id: string) => void
  onBack: () => void
  onJoinRoom: () => void
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

export default function StepJoin({
  roomId,
  onRoomIdChange,
  onBack,
  onJoinRoom,
  isLoading,
  direction
}: StepJoinProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onJoinRoom()
  }

  return (
    <motion.div
      key="join-step"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
      className="p-4 space-y-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h3 className="text-lg font-medium text-white">Join Room</h3>
          <p className="text-sm text-gray-400">Enter a room ID to join</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-300 font-medium">Room ID</label>
          <Input
            value={roomId}
            onChange={e => onRoomIdChange(e.target.value)}
            placeholder="Enter room ID"
            className="bg-gray-800 border-gray-600 text-white h-12"
            onKeyDown={handleKeyDown}
          />
        </div>

        <Button
          onClick={onJoinRoom}
          disabled={!roomId.trim() || isLoading}
          className="w-full h-12 text-base"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isLoading ? 'Joining...' : 'Join Room'}
        </Button>
      </div>
    </motion.div>
  )
}