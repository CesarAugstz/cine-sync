'use client'

import { Users } from 'lucide-react'

interface PanelHeaderProps {
  isConnected: boolean
}

export default function PanelHeader({ isConnected }: PanelHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex items-center justify-start space-x-2">
        <h2 className="text-white font-semibold flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Watch Together
        </h2>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  )
}