import { useState, useCallback } from 'react'
import { Room, User } from '@/types/room'

export function useWebSocketMock() {
  const [isConnected, setIsConnected] = useState(false)

  const connect = useCallback(() => {
    setTimeout(() => setIsConnected(true), 500)
  }, [])

  const disconnect = useCallback(() => {
    setIsConnected(false)
  }, [])

  const createRoom = useCallback((roomName: string, userName: string): Promise<Room> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const room: Room = {
          id: Math.random().toString(36).substring(2, 8).toUpperCase(),
          name: roomName,
          users: [{
            id: 'user-1',
            name: userName,
            isHost: true
          }],
          createdAt: new Date().toISOString(),
          videoState: {
            isPlaying: false,
            currentTime: 0,
            lastUpdate: new Date().toISOString()
          }
        }
        resolve(room)
      }, 1000)
    })
  }, [])

  const joinRoom = useCallback((roomId: string, userName: string): Promise<Room> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (roomId === 'INVALID') {
          reject(new Error('Room not found'))
          return
        }

        const room: Room = {
          id: roomId,
          name: 'Mock Room',
          users: [
            {
              id: 'user-1',
              name: 'Host User',
              isHost: true
            },
            {
              id: 'user-2',
              name: userName,
              isHost: false
            }
          ],
          createdAt: new Date().toISOString(),
          videoState: {
            isPlaying: false,
            currentTime: 0,
            lastUpdate: new Date().toISOString()
          }
        }
        resolve(room)
      }, 1000)
    })
  }, [])

  const leaveRoom = useCallback(() => {
    setTimeout(() => {
      setIsConnected(false)
    }, 300)
  }, [])

  const emitVideoControl = useCallback((action: string, data: any) => {
    console.log('Mock emit:', action, data)
  }, [])

  return {
    isConnected,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    emitVideoControl
  }
}