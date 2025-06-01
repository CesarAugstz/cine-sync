import { useState, useCallback } from 'react'
import { Room, User, RoomState } from '@/types/room'
import { useWebSocketMock } from './use-websocket-mock'

export function useRoomState() {
  const [roomState, setRoomState] = useState<RoomState>({
    currentRoom: null,
    isConnected: false,
    currentUser: null
  })
  const [isLoading, setIsLoading] = useState(false)

  const { 
    isConnected, 
    connect, 
    disconnect, 
    createRoom, 
    joinRoom, 
    leaveRoom, 
    emitVideoControl 
  } = useWebSocketMock()

  const handleCreateRoom = useCallback(async (roomName: string, userName: string) => {
    setIsLoading(true)
    try {
      connect()
      const room = await createRoom(roomName, userName)
      const currentUser = room.users.find(user => user.name === userName) || null
      
      setRoomState({
        currentRoom: room,
        isConnected: true,
        currentUser
      })
      
      return room
    } finally {
      setIsLoading(false)
    }
  }, [createRoom, connect])

  const handleJoinRoom = useCallback(async (roomId: string, userName: string) => {
    setIsLoading(true)
    try {
      connect()
      const room = await joinRoom(roomId, userName)
      const currentUser = room.users.find(user => user.name === userName) || null
      
      setRoomState({
        currentRoom: room,
        isConnected: true,
        currentUser
      })
      
      return room
    } finally {
      setIsLoading(false)
    }
  }, [joinRoom, connect])

  const handleLeaveRoom = useCallback(() => {
    leaveRoom()
    disconnect()
    setRoomState({
      currentRoom: null,
      isConnected: false,
      currentUser: null
    })
  }, [leaveRoom, disconnect])

  const handleCopyRoomId = useCallback(() => {
    if (!roomState.currentRoom) return
    
    navigator.clipboard.writeText(roomState.currentRoom.id)
      .then(() => console.log('Room ID copied'))
      .catch(() => console.error('Failed to copy room ID'))
  }, [roomState.currentRoom])

  const handleVideoControl = useCallback((action: string, data: any) => {
    if (!roomState.isConnected) return
    emitVideoControl(action, data)
  }, [roomState.isConnected, emitVideoControl])

  return {
    roomState,
    isLoading,
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleCopyRoomId,
    handleVideoControl
  }
}