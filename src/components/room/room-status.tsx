'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Users, ChevronDown } from 'lucide-react'
import { useRoomState } from '@/hooks/use-room-state'
import RoomCreator from './room-creator'
import RoomJoiner from './room-joiner'
import UserList from './user-list'

export default function RoomStatus() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'menu' | 'create' | 'join'>('menu')
  const {
    roomState,
    isLoading,
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleCopyRoomId
  } = useRoomState()

  if (roomState.currentRoom) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2"
        >
          <Users className="h-4 w-4" />
          <span>{roomState.currentRoom.name}</span>
          <span className="text-xs bg-green-500 text-white px-1 rounded">
            {roomState.currentRoom.users.length}
          </span>
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-card border rounded-lg shadow-lg p-4 z-50">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{roomState.currentRoom.name}</h3>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex-1 bg-muted rounded p-2 text-sm font-mono">
                    {roomState.currentRoom.id}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyRoomId}>
                    Copy
                  </Button>
                </div>
              </div>
              
              <UserList users={roomState.currentRoom.users} />
              
              <Button 
                variant="destructive" 
                size="sm"
                className="w-full" 
                onClick={handleLeaveRoom}
              >
                Leave Room
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <Users className="h-4 w-4" />
        <span>Watch Together</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-card border rounded-lg shadow-lg p-4 z-50">
          {currentView === 'create' && (
            <div className="space-y-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentView('menu')}
              >
                ← Back
              </Button>
              <RoomCreator
                onRoomCreated={() => setIsOpen(false)}
                onCreateRoom={handleCreateRoom}
                isLoading={isLoading}
              />
            </div>
          )}

          {currentView === 'join' && (
            <div className="space-y-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentView('menu')}
              >
                ← Back
              </Button>
              <RoomJoiner
                onRoomJoined={() => setIsOpen(false)}
                onJoinRoom={handleJoinRoom}
                isLoading={isLoading}
              />
            </div>
          )}

          {currentView === 'menu' && (
            <div className="space-y-3">
              <h3 className="font-semibold">Watch Together</h3>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('create')}
              >
                Create Room
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('join')}
              >
                Join Room
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}