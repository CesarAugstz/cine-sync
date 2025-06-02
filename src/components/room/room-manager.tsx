'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Users, Plus, UserPlus } from 'lucide-react'
import RoomCreator from './room-creator'
import RoomJoiner from './room-joiner'
import RoomControls from './room-controls'
import { useRoomState } from '@/hooks/use-room-state'
import { Room } from '@/types/room'

type RoomView = 'menu' | 'create' | 'join'

export default function RoomManager() {
  const [currentView, setCurrentView] = useState<RoomView>('menu')
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
      <RoomControls
        room={roomState.currentRoom as unknown as Room}
        onLeaveRoom={handleLeaveRoom}
        onCopyRoomId={handleCopyRoomId}
      />
    )
  }

  if (currentView === 'create') {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setCurrentView('menu')}
        >
          Back
        </Button>
        <RoomCreator
          onRoomCreated={() => {}}
          onCreateRoom={handleCreateRoom}
          isLoading={isLoading}
        />
      </div>
    )
  }

  if (currentView === 'join') {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setCurrentView('menu')}
        >
          Back
        </Button>
        <RoomJoiner
          onRoomJoined={() => {}}
          onJoinRoom={handleJoinRoom}
          isLoading={isLoading}
        />
      </div>
    )
  }

  return (
    <div className="bg-card/50 rounded-lg p-6 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="h-5 w-5" />
        <h3 className="font-semibold">Watch Together</h3>
      </div>
      
      <div className="space-y-3">
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => setCurrentView('create')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Room
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => setCurrentView('join')}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Join Room
        </Button>
      </div>
    </div>
  )
}
