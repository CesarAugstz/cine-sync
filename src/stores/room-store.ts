import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import io, { Socket } from 'socket.io-client'
import { SocketRoom } from '@/lib/websocket/types'

interface User {
  id: string
  name: string
}

interface Room {
  id: string
  name: string
  hostId: string
  users: User[]
}

interface RoomStore {
  socket: Socket | null
  currentRoom: Room | null
  lastRoomId: string | null
  isConnected: boolean
  isLoading: boolean
  userName: string

  setUserName: (name: string) => void
  connectSocket: () => void
  disconnectSocket: () => void
  createRoom: (roomName: string, userName: string) => Promise<boolean>
  joinRoom: (roomId: string, userName: string) => Promise<boolean>
  leaveRoom: () => void
  emitVideoControl: (event: string, data: any) => void
  syncVideo: () => void
  copyRoomId: () => void
}

export const useRoomStore = create<RoomStore>()(
  persist(
    (set, get) => ({
      socket: null,
      currentRoom: null,
      isConnected: false,
      isLoading: false,
      userName: '',
      lastRoomId: null,

      setUserName: userName => set({ userName }),

      connectSocket: () => {
        const { socket } = get()
        if (socket?.connected) return

        const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL)

        newSocket.on('connect', () => {
          set({ isConnected: true })
        })

        newSocket.on('user_joined', (user: User) => {
          const { currentRoom } = get()
          if (!currentRoom) return

          set({
            currentRoom: {
              ...currentRoom,
              users: [...currentRoom.users, user],
            },
          })
        })

        newSocket.on('user_left', (userId: string) => {
          const { currentRoom } = get()
          if (!currentRoom) return

          set({
            currentRoom: {
              ...currentRoom,
              users: currentRoom.users.filter(u => u.id !== userId),
            },
          })
        })

        newSocket.on('error', (error: string) => {
          console.error('Socket error:', error)
          set({ isLoading: false })
        })

        set({ socket: newSocket })
      },

      disconnectSocket: () => {
        const { socket } = get()
        if (!socket) return

        socket.removeAllListeners()
        socket.disconnect()
        set({ socket: null, isConnected: false, currentRoom: null })
      },

      createRoom: async (roomName, userName) => {
        const { socket } = get()
        if (!socket) return false

        set({ isLoading: true })

        return new Promise(resolve => {
          socket.emit('create_room', { roomName, userName })

          const timeout = setTimeout(() => {
            set({ isLoading: false })
            resolve(false)
          }, 5000)

          socket.once(
            'create_room_response',
            (response: { success: boolean; data: SocketRoom }) => {
              clearTimeout(timeout)
              set({ isLoading: false })
              if (!response.success) {
                console.error('Failed to create room')
                return resolve(false)
              }
              set({ currentRoom: response.data, lastRoomId: response.data.id })
              resolve(true)
            },
          )

          socket.once('error', () => {
            clearTimeout(timeout)
            set({ isLoading: false })
            resolve(false)
          })
        })
      },

      joinRoom: async (roomId, userName) => {
        const { socket } = get()
        if (!socket) return false

        set({ isLoading: true })

        return new Promise(resolve => {
          socket.emit('join_room', { roomId, userName })

          const timeout = setTimeout(() => {
            set({ isLoading: false })
            resolve(false)
          }, 5000)

          socket.once(
            'join_room_response',
            (response: { success: boolean; data?: Room; error?: string }) => {
              clearTimeout(timeout)
              set({ isLoading: false })

              if (!response.success || !response.data) {
                console.error('Failed to join room:', response.error)
                return resolve(false)
              }
              set({ currentRoom: response.data, lastRoomId: roomId })
              resolve(true)
            },
          )

          socket.once('error', () => {
            clearTimeout(timeout)
            set({ isLoading: false })
            resolve(false)
          })
        })
      },

      leaveRoom: () => {
        const { socket } = get()
        if (!socket) return

        socket.emit('leave_room')
        set({ currentRoom: null })
      },

      emitVideoControl: (event, data) => {
        const { socket } = get()
        if (!socket) return

        socket.emit(event, data)
      },

      syncVideo: () => {
        const { socket } = get()
        if (!socket) return

        socket.emit('sync_video')
      },

      copyRoomId: () => {
        const { currentRoom } = get()
        if (!currentRoom) return

        navigator.clipboard.writeText(currentRoom.id)
      },
    }),
    {
      name: 'room-settings',
      partialize: state => ({
        userName: state.userName,
        currentRoom: state.currentRoom,
        lastRoomId: state.currentRoom?.id,
      }),
    },
  ),
)
