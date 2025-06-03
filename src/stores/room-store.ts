import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import io, { Socket } from 'socket.io-client'
import { SocketRoom, SocketUser } from '@/lib/websocket/types'

interface VideoState {
  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
}

interface RoomStore {
  socket: Socket | null
  currentRoom: SocketRoom | null
  lastRoomId: string | null
  isConnected: boolean
  isLoading: boolean
  userName: string
  videoState: VideoState | null
  lastVideoAction: string | null
  videoExecutionFunctions: {
    executePlay?: () => void
    executePause?: () => void
    executeSeek?: (targetTime: number) => void
    executeSync?: (currentTime: number, isPlaying: boolean) => void
  }
  isConnecting: boolean

  setUserName: (name: string) => void
  connectSocket: () => void
  disconnectSocket: () => void
  createRoom: (roomName: string, userName: string) => Promise<SocketRoom>
  joinRoom: (roomId: string, userName: string) => Promise<SocketRoom>
  leaveRoom: () => void
  emitVideoControl: (event: string, data: any) => void
  syncVideo: () => void
  copyRoomId: () => void
  setVideoExecutionFunctions: (functions: {
    executePlay?: () => void
    executePause?: () => void
    executeSeek?: (targetTime: number) => void
    executeSync?: (currentTime: number, isPlaying: boolean) => void
  }) => void
  updateVideoState: (state: Partial<VideoState>) => void
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
      videoState: null,
      lastVideoAction: null,
      videoExecutionFunctions: {},
      isConnecting: false,

      setUserName: userName => set({ userName }),

      updateVideoState: (state: Partial<VideoState>) => {
        set(prev => ({
          videoState: prev.videoState ? { ...prev.videoState, ...state } : null,
        }))
      },

      setVideoExecutionFunctions: functions => {
        set({ videoExecutionFunctions: functions })
      },

      connectSocket: async () => {
        console.log('called connect socket', {
          socket: get().socket,
          isConnected: get().isConnected,
          isConnecting: get().isConnecting,
        })

        if (get().isConnecting) return
        set({ isConnecting: true })

        try {
          const connect = async () => {
            const { socket } = get()
            if (socket?.connected) return

            const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL)

            console.log(
              'Connecting to socket',
              process.env.NEXT_PUBLIC_WEBSOCKET_URL,
            )

            newSocket.on('connect', async () => {
              console.log('Connected to socket')
              set({ isConnected: true })

              const { lastRoomId } = get()
              console.log('Last room id', lastRoomId)
              if (!lastRoomId) return

              newSocket.emit('reconnect_user', {
                roomId: lastRoomId,
                userName: get().userName,
              })
              await new Promise(resolve => {
                setTimeout(resolve, 3000)
                newSocket.once(
                  'reconnect_response',
                  (response: {
                    success: boolean
                    data?: SocketRoom
                    error?: string
                  }) => {
                    console.log('Reconnect response', response)
                    if (!response.success || !response.data) {
                      console.error(
                        'Failed to reconnect to room:',
                        response.error,
                      )
                      return
                    }
                    set({ currentRoom: response.data })
                    resolve(true)
                  },
                )
              })
            })

            newSocket.on('disconnect', () => {
              console.log('Disconnected from socket', {
                socket: get().socket,
                isConnected: get().isConnected,
                isConnecting: get().isConnecting,
                lastRoomId: get().lastRoomId,
              },
            )
              set({ isConnected: false })
              set({ isConnecting: false })
              set({ currentRoom: null })
            })

            newSocket.on(
              'user_joined',
              (data: { user: SocketUser; room: SocketRoom }) => {
                set({ currentRoom: data.room })
              },
            )

            newSocket.on('user_left', (data: { room: SocketRoom }) => {
              console.log('User left', data)
              set({ currentRoom: data.room })
            })

            newSocket.on('host_changed', (data: { room: SocketRoom }) => {
              console.log('Host changed', data)
              set({ currentRoom: data.room })
            })

            newSocket.on('user_disconnected', (data: { room: SocketRoom }) => {
              console.log('User disconnected', data)
              set({ currentRoom: data.room })
            })

            newSocket.on(
              'video_play',
              (data: {
                currentTime: number
                timestamp: number
                userId: string
              }) => {
                const { videoExecutionFunctions } = get()
                console.log('Received video play event', data)
                set({ lastVideoAction: 'play' })
                if (videoExecutionFunctions.executePlay) {
                  videoExecutionFunctions.executePlay()
                }
              },
            )

            newSocket.on(
              'video_pause',
              (data: {
                currentTime: number
                timestamp: number
                userId: string
              }) => {
                const { videoExecutionFunctions } = get()
                console.log('Received video pause event', data)
                set({ lastVideoAction: 'pause' })
                if (videoExecutionFunctions.executePause) {
                  videoExecutionFunctions.executePause()
                }
              },
            )

            newSocket.on(
              'video_seek',
              (data: {
                targetTime: number
                currentTime: number
                timestamp: number
                userId: string
              }) => {
                const { videoExecutionFunctions } = get()
                console.log('Received video seek event', data)
                set({ lastVideoAction: 'seek' })
                if (videoExecutionFunctions.executeSeek) {
                  videoExecutionFunctions.executeSeek(data.targetTime)
                }
              },
            )

            newSocket.on(
              'video_sync_response',
              (data: {
                currentTime: number
                isPlaying: boolean
                timestamp: number
                hostUserId: string
              }) => {
                const { videoExecutionFunctions } = get()
                console.log('Received video sync response', data)
                set({ lastVideoAction: 'sync' })
                if (videoExecutionFunctions.executeSync) {
                  videoExecutionFunctions.executeSync(
                    data.currentTime,
                    data.isPlaying,
                  )
                }
              },
            )

            newSocket.on('error', (error: string) => {
              console.error('Socket error:', error)
              set({ isLoading: false })
            })

            set({ socket: newSocket })
          }
          await connect()
        } catch (err) {
          console.error('Failed to connect to socket', err)
          set({ isLoading: false })
        }
        set({ isConnecting: false })
      },

      disconnectSocket: () => {
        const { socket } = get()
        if (!socket) return

        socket.removeAllListeners()
        socket.disconnect()
        set({ socket: null, isConnected: false, currentRoom: null })
      },

      createRoom: async (roomName, userName) => {
        console.log('Creating room', roomName, userName)
        const { socket } = get()
        if (!socket) throw new Error('Not connected to socket')

        set({ isLoading: true })

        return new Promise(resolve => {
          socket.emit('create_room', { roomName, userName })

          const timeout = setTimeout(() => {
            set({ isLoading: false })
            throw new Error('Failed to create room')
          }, 5000)

          socket.once(
            'create_room_response',
            (response: { success: boolean; data: SocketRoom }) => {
              clearTimeout(timeout)
              set({ isLoading: false })
              if (!response.success) {
                console.error('Failed to create room')
                throw new Error('Failed to create room')
              }
              set({ currentRoom: response.data, lastRoomId: response.data.id })
              resolve(response.data)
            },
          )

          socket.once('error', () => {
            clearTimeout(timeout)
            set({ isLoading: false })
            throw new Error('Failed to create room')
          })
        })
      },

      joinRoom: async (roomId, userName) => {
        console.log('Joining room', roomId, userName)
        const { socket } = get()
        if (!socket) throw new Error('Not connected to socket')

        set({ isLoading: true })

        return new Promise(resolve => {
          socket.emit('join_room', { roomId, userName })

          const timeout = setTimeout(() => {
            set({ isLoading: false })
            throw new Error('Failed to join room')
          }, 5000)

          socket.once(
            'join_room_response',
            (response: {
              success: boolean
              data?: SocketRoom
              error?: string
            }) => {
              clearTimeout(timeout)
              set({ isLoading: false })

              if (!response.success || !response.data) {
                console.error('Failed to join room:', response.error)
                throw new Error('Failed to join room')
              }
              const { data } = response
              set({ currentRoom: data, lastRoomId: roomId })
              resolve(data)
            },
          )

          socket.once('error', () => {
            clearTimeout(timeout)
            set({ isLoading: false })
            throw new Error('Failed to join room')
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

        if (event === 'video_play') set({ lastVideoAction: 'play' })
        else if (event === 'video_pause') set({ lastVideoAction: 'pause' })
        else if (event === 'video_seek') set({ lastVideoAction: 'seek' })
      },

      syncVideo: () => {
        const { socket } = get()
        if (!socket) return

        socket.emit('sync_video')
        set({ lastVideoAction: 'sync' })
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
        lastRoomId: state.lastRoomId,
      }),
    },
  ),
)
