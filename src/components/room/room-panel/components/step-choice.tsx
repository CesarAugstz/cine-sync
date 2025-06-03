'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search, Plus, UserPlus } from 'lucide-react'

interface StepChoiceProps {
  userName: string
  onBack: () => void
  onBrowseRooms: () => void
  onCreateRoom: () => void
  onJoinRoom: () => void
  isLoadingRooms: boolean
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

export default function StepChoice({
  userName,
  onBack,
  onBrowseRooms,
  onCreateRoom,
  onJoinRoom,
  isLoadingRooms,
  direction
}: StepChoiceProps) {
  return (
    <motion.div
      key="choice-step"
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
          <h3 className="text-lg font-medium text-white">Hi, {userName}!</h3>
          <p className="text-sm text-gray-400">What would you like to do?</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={onBrowseRooms}
          variant="outline"
          className="w-full h-14 border-gray-600 text-white hover:bg-gray-800 justify-start"
          disabled={isLoadingRooms}
        >
          <Search className="w-5 h-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Browse Rooms</div>
            <div className="text-xs text-gray-400">Join an existing room</div>
          </div>
        </Button>

        <Button
          onClick={onCreateRoom}
          variant="outline"
          className="w-full h-14 border-gray-600 text-white hover:bg-gray-800 justify-start"
        >
          <Plus className="w-5 h-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Create Room</div>
            <div className="text-xs text-gray-400">Start a new watch party</div>
          </div>
        </Button>

        <Button
          onClick={onJoinRoom}
          variant="outline"
          className="w-full h-14 border-gray-600 text-white hover:bg-gray-800 justify-start"
        >
          <UserPlus className="w-5 h-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Join Room</div>
            <div className="text-xs text-gray-400">Enter a room ID</div>
          </div>
        </Button>
      </div>
    </motion.div>
  )
}