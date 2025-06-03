'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Users, Plus, UserPlus } from 'lucide-react'
import RoomCreator from './room-creator'
import RoomJoiner from './room-joiner'
import RoomControls from './room-controls'
import { useRoomStore } from '@/stores/room-store'
import { SocketRoom } from '@/lib/websocket/types'

type RoomView = 'menu' | 'create' | 'join'

export default function RoomManager() {
  const [currentView, setCurrentView] = useState<RoomView>('menu')
  const {
    currentRoom,
    currentUser,
    isLoading,
    isConnected,
    connectSocket,
    authenticateUser,
    createRoom,
    joinRoom,
    leaveRoom,
    copyRoomId,
  } = useRoomStore()

  useEffect(() => {
    if (!isConnected) {
      connectSocket()
    }
  }, [isConnected, connectSocket])

  const handleCreateRoom = async (
    roomName: string,
    userName: string,
  ): Promise<SocketRoom> => {
    if (!currentUser) {
      await authenticateUser(undefined, userName)
    }
    return await createRoom(roomName, userName)
  }

  const handleJoinRoom = async (
    roomId: string,
    userName: string,
  ): Promise<SocketRoom> => {
    if (!currentUser) {
      await authenticateUser(undefined, userName)
    }
    return await joinRoom(roomId, userName)
  }

  const handleLeaveRoom = () => {
    leaveRoom()
  }

  const handleCopyRoomId = () => {
    copyRoomId()
  }

  if (!isConnected) {
    return (
      <div className="bg-card/50 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">Connecting...</h3>
        </div>
      </div>
    )
  }

  if (currentRoom) {
    return (
      <RoomControls
        room={currentRoom}
        onLeaveRoom={handleLeaveRoom}
        onCopyRoomId={handleCopyRoomId}
      />
    )
  }

  if (currentView === 'create') {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setCurrentView('menu')}>
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
        <Button variant="outline" onClick={() => setCurrentView('menu')}>
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
        {currentUser && (
          <span className="text-sm text-muted-foreground">
            ({currentUser.name})
          </span>
        )}
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
