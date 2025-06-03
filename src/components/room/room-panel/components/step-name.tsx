'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, ChevronRight } from 'lucide-react'

interface StepNameProps {
  userName: string
  onUserNameChange: (name: string) => void
  onContinue: () => void
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

export default function StepName({ userName, onUserNameChange, onContinue, direction }: StepNameProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onContinue()
  }

  return (
    <motion.div
      key="name-step"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
      className="p-4 space-y-6"
    >
      <div className="text-center text-gray-400 mb-6">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <h3 className="text-lg font-medium text-white mb-2">Welcome!</h3>
        <p className="text-sm">Let&apos;s get started by entering your name</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-300 font-medium">Your Name</label>
          <Input
            value={userName}
            onChange={e => onUserNameChange(e.target.value)}
            placeholder="Enter your name"
            className="bg-gray-800 border-gray-600 text-white h-12"
            onKeyDown={handleKeyDown}
          />
        </div>

        <Button
          onClick={onContinue}
          disabled={!userName.trim()}
          className="w-full h-12 text-base"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  )
}