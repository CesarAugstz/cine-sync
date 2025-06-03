'use client'

import { SocketRoom } from '@/lib/websocket/types'
import { useRoomStore } from '@/stores/room-store'

export function useRoomState() {
  const {
    currentRoom,
    isConnected,
    isLoading,
    createRoom,
    joinRoom,
    leaveRoom,
    copyRoomId,
  } = useRoomStore()

  const roomState = {
    currentRoom,
    isConnected,
  }

  const handleCreateRoom = async (
    roomName: string,
    userName: string,
  ): Promise<SocketRoom> => {
    return await createRoom(roomName, userName)
  }

  const handleJoinRoom = async (
    roomId: string,
    userName: string,
  ): Promise<SocketRoom> => {
    return await joinRoom(roomId, userName)
  }

  const handleLeaveRoom = () => {
    leaveRoom()
  }

  const handleCopyRoomId = () => {
    copyRoomId()
  }

  return {
    roomState,
    isLoading,
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleCopyRoomId,
  }
}
