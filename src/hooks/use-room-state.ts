'use client'

import { useState, useEffect, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface User {
  id: string
  name: string
  joinedAt: number
}

interface Room {
  id: string
  name: string
  hostId: string
  users: User[]
  createdAt: number
}

interface RoomState {
  currentRoom: Room | null
  isConnected: boolean
}

export function useRoomState() {
  const [roomState, setRoomState] = useState<RoomState>({
    currentRoom: null,
    isConnected: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (socket) return

    const newSocket = io()
    setSocket(newSocket)

    newSocket.on('connect', () => {
      setRoomState(prev => ({ ...prev, isConnected: true }))
    })

    newSocket.on('disconnect', () => {
      setRoomState(prev => ({ ...prev, isConnected: false }))
    })

    newSocket.on('user_joined', (data: { user: User; room: Room }) => {
      console.log('user_joined', data)
      setRoomState(prev => ({ ...prev, currentRoom: data.room }))
    })

    newSocket.on('user_left', (data: { room: Room }) => {
      setRoomState(prev => ({ ...prev, currentRoom: data.room }))
    })

    newSocket.on('host_changed', (data: { room: Room }) => {
      setRoomState(prev => ({ ...prev, currentRoom: data.room }))
    })

    newSocket.on('user_disconnected', (data: { room: Room }) => {
      setRoomState(prev => ({ ...prev, currentRoom: data.room }))
    })

    return () => {
      newSocket.close()
      newSocket.removeAllListeners()
    }
  }, [socket])

  const handleCreateRoom = useCallback(
    async (roomName: string, userName: string): Promise<boolean> => {
      if (!socket) return false

      setIsLoading(true)

      return new Promise(resolve => {
        const timeoutId = setTimeout(() => {
          setIsLoading(false)
          resolve(false)
        }, 5000)

        socket.emit('create_room', { roomName, userName })

        socket.once(
          'create_room_response',
          (response: { success: boolean; data?: Room; error?: string }) => {
            clearTimeout(timeoutId)
            setIsLoading(false)

            if (response.success && response.data) {
              setRoomState(prev => ({ ...prev, currentRoom: response.data! }))
              resolve(true)
            } else {
              console.error('Failed to create room:', response.error)
              resolve(false)
            }
          },
        )
      })
    },
    [socket],
  )

  const handleJoinRoom = useCallback(
    async (roomId: string, userName: string): Promise<boolean> => {
      if (!socket) return false

      setIsLoading(true)

      return new Promise(resolve => {
        const timeoutId = setTimeout(() => {
          setIsLoading(false)
          resolve(false)
        }, 5000)

        socket.emit('join_room', { roomId, userName })

        socket.once(
          'join_room_response',
          (response: { success: boolean; data?: Room; error?: string }) => {
            clearTimeout(timeoutId)
            setIsLoading(false)

            if (response.success && response.data) {
              setRoomState(prev => ({ ...prev, currentRoom: response.data! }))
              resolve(true)
            } else {
              console.error('Failed to join room:', response.error)
              resolve(false)
            }
          },
        )
      })
    },
    [socket],
  )

  const handleLeaveRoom = useCallback(() => {
    if (!socket || !roomState.currentRoom) return

    socket.emit('leave_room', { roomId: roomState.currentRoom.id })
    setRoomState(prev => ({ ...prev, currentRoom: null }))
  }, [socket, roomState.currentRoom])

  const handleCopyRoomId = useCallback(() => {
    if (!roomState.currentRoom) return

    navigator.clipboard.writeText(roomState.currentRoom.id).catch(err => {
      console.error('Failed to copy room ID:', err)
    })
  }, [roomState.currentRoom])

  return {
    roomState,
    isLoading,
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleCopyRoomId,
  }
}
