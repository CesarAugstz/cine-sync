import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import io, { Socket } from 'socket.io-client'
import { SocketRoom, SocketUser, VideoState } from '@/lib/websocket/types'
import { VideoExecutionFunctions } from '@/hooks/use-video-websocket-handlers'
import { toast } from 'sonner'

interface RoomStore {
  socket: Socket | null
  isConnected: boolean
  isLoading: boolean
  isConnecting: boolean
  isAwaitingUsers: boolean

  currentUser: SocketUser | null
  updateUserName: (userName: string) => Promise<SocketUser>

  authenticateUser: (userId?: string, userName?: string) => Promise<SocketUser>
  connectSocket: () => void
  disconnectSocket: () => void

  createRoom: (roomName: string, userName: string) => Promise<SocketRoom>
  joinRoom: (roomId: string, userName: string) => Promise<SocketRoom>
  leaveRoom: () => void
  copyRoomId: () => void
  currentRoom: SocketRoom | null
  lastRoomId: string | null
  availableRooms: SocketRoom[]
  isLoadingRooms: boolean
  getAvailableRooms: () => Promise<SocketRoom[]>

  videoState: VideoState | null
  lastVideoAction: string | null
  videoExecutionFunctions: VideoExecutionFunctions | undefined
  emitVideoPlay: (currentTime: number) => Promise<VideoState>
  emitVideoPause: (currentTime: number) => Promise<VideoState>
  emitVideoSeek: (
    currentTime: number,
    targetTime: number,
    isPlaying: boolean,
  ) => Promise<VideoState>
  emitVideoSeeked: (currentTime: number) => void
  emitVideoCanPlay: (isPlaying: boolean) => void
  emitVideoWaiting: (currentTime: number, isPlaying: boolean) => void
  syncVideo: () => void
  setVideoExecutionFunctions: (functions?: VideoExecutionFunctions) => void
  updateVideoState: (state: Partial<VideoState>) => void
}

export const useRoomStore = create<RoomStore>()(
  persist(
    (set, get) => ({
      socket: null,
      isAwaitingUsers: false,
      currentUser: null,

      currentRoom: null,
      lastRoomId: null,
      availableRooms: [],
      isLoadingRooms: false,

      isConnected: false,
      isLoading: false,
      videoState: null,
      lastVideoAction: null,
      videoExecutionFunctions: undefined,
      isConnecting: false,

      updateVideoState: (state: Partial<VideoState>) => {
        set(prev => ({
          videoState: prev.videoState ? { ...prev.videoState, ...state } : null,
        }))
      },

      setVideoExecutionFunctions: functions => {
        set({ videoExecutionFunctions: functions })
      },

      authenticateUser: async (userId?: string, userName?: string) => {
        const { socket } = get()
        if (!socket) throw new Error('Not connected to socket')

        socket.emit('authenticate_user', { userId, userName })
        const { data } = await waitForSocketResponse<{ data: SocketUser }>({
          socket,
          event: 'authenticate_user_response',
          timeout: 5000,
        })

        set({ currentUser: data })
        return data
      },

      updateUserName: async (userName: string) => {
        const { currentUser } = get()
        if (!currentUser) throw new Error('User not authenticated')

        const updatedUser = await get().authenticateUser(
          currentUser.id,
          userName,
        )
        set({ currentUser: updatedUser })
        return updatedUser
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
              set({ isConnected: true, socket: newSocket })

              const { currentUser, lastRoomId } = get()

              try {
                const user = await get().authenticateUser(
                  currentUser?.id,
                  currentUser?.name,
                )
                console.log('User authenticated:', user)

                if (lastRoomId) {
                  newSocket.emit('reconnect_user', {
                    roomId: lastRoomId,
                    user: user,
                  })

                  await new Promise((resolve, reject) => {
                    setTimeout(
                      () => reject(new Error('Reconnection timeout')),
                      3000,
                    )
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
                          reject(new Error(response.error))
                          return
                        }
                        set({ currentRoom: response.data })
                        resolve(true)
                      },
                    )
                  })
                }
              } catch (error) {
                console.error('Authentication failed:', error)
              }
            })

            newSocket.on('disconnect', () => {
              console.log('Disconnected from socket', {
                socket: get().socket,
                isConnected: get().isConnected,
                isConnecting: get().isConnecting,
                lastRoomId: get().lastRoomId,
              })
              set({
                isConnected: false,
                isConnecting: false,
                currentRoom: null,
              })
            })

            newSocket.on(
              'user_joined',
              (data: { user: SocketUser; room: SocketRoom }) => {
                console.log('user_joined', data)
                toast.success(`The user ${data.user?.name} joined the room`)
                set({ currentRoom: data.room })
              },
            )

            newSocket.on(
              'user_left',
              (data: { room: SocketRoom; user: SocketUser }) => {
                console.log('User left', data)
                toast.warning(`The user ${data.user?.name} left the room`)
                set({ currentRoom: data.room })
              },
            )

            newSocket.on('host_changed', (data: { room: SocketRoom }) => {
              console.log('Host changed', data)
              set({ currentRoom: data.room })
            })

            newSocket.on(
              'user_reconnected',
              (data: { room: SocketRoom; user: SocketUser }) => {
                console.log('User reconnected', data)
                toast.success(`The user ${data.user?.name} reconnected`)
                set({ currentRoom: data.room })
              },
            )

            newSocket.on(
              'user_disconnected',
              (data: { room: SocketRoom; user: SocketUser }) => {
                console.log('User disconnected', data)
                toast.warning(`The user ${data.user?.name} disconnected`)
                set({ currentRoom: data.room })
              },
            )

            newSocket.on('awaiting_users', async () => {
              console.log('Awaiting users')
              set({ isAwaitingUsers: true })

              await waitForSocketResponse({
                socket: newSocket,
                event: 'users_ready',
                timeout: 30_000,
              }).finally(() => {
                set({ isAwaitingUsers: false })
              })
            })

            newSocket.on('video_play', (data: VideoState) => {
              const { videoExecutionFunctions } = get()
              console.log('Received video play event', data)
              set({ lastVideoAction: 'play' })
              videoExecutionFunctions?.executePlay?.(data)
            })

            newSocket.on('video_pause', (data: VideoState) => {
              const { videoExecutionFunctions } = get()
              console.log('Received video pause event', data)
              set({ lastVideoAction: 'pause' })
              videoExecutionFunctions?.executePause(data)
            })

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
                videoExecutionFunctions?.executeSeek(data.targetTime)
              },
            )

            newSocket.on(
              'video_sync',
              (data: {
                currentTime: number
                isPlaying: boolean
                timestamp: number
                hostUserId: string
              }) => {
                const { videoExecutionFunctions } = get()
                console.log('Received video sync response', data)
                set({ lastVideoAction: 'sync' })
                videoExecutionFunctions?.executeSync(
                  data.currentTime ?? 0,
                  data.isPlaying,
                )
              },
            )

            newSocket.on('error', (error: string) => {
              console.error('Socket error:', error)
              set({ isLoading: false })
            })
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
        const { socket, currentUser } = get()
        if (!socket) throw new Error('Not connected to socket')
        if (!currentUser) throw new Error('User not authenticated')

        set({ isLoading: true })

        return new Promise((resolve, reject) => {
          socket.emit('create_room', { roomName, userName })

          const timeout = setTimeout(() => {
            set({ isLoading: false })
            reject(new Error('Failed to create room'))
          }, 5000)

          socket.once(
            'create_room_response',
            (response: {
              success: boolean
              data: SocketRoom
              error?: string
            }) => {
              clearTimeout(timeout)
              set({ isLoading: false })
              if (!response.success) {
                console.error('Failed to create room:', response.error)
                reject(new Error(response.error || 'Failed to create room'))
                return
              }
              set({ currentRoom: response.data, lastRoomId: response.data.id })
              resolve(response.data)
            },
          )

          socket.once('error', error => {
            clearTimeout(timeout)
            set({ isLoading: false })
            reject(new Error('Failed to create room'))
          })
        })
      },

      joinRoom: async (roomId, userName) => {
        console.log('Joining room', roomId, userName)
        const { socket, currentUser } = get()
        if (!socket) throw new Error('Not connected to socket')
        if (!currentUser) throw new Error('User not authenticated')

        set({ isLoading: true })

        return new Promise((resolve, reject) => {
          socket.emit('join_room', { roomId, userName })

          const timeout = setTimeout(() => {
            set({ isLoading: false })
            reject(new Error('Failed to join room'))
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
                reject(new Error(response.error || 'Failed to join room'))
                return
              }
              const { data } = response
              set({ currentRoom: data, lastRoomId: roomId })
              resolve(data)
            },
          )

          socket.once('error', error => {
            clearTimeout(timeout)
            set({ isLoading: false })
            reject(new Error('Failed to join room'))
          })
        })
      },

      leaveRoom: () => {
        const { socket } = get()
        if (!socket) return

        socket.emit('leave_room')
        set({ currentRoom: null, lastRoomId: null })
      },

      emitVideoPlay: (currentTime: number) => {
        const { socket, currentRoom } = get()
        if (!socket || !currentRoom) throw new Error('Not connected to socket')

        socket.emit('video_play', {
          roomId: currentRoom.id,
          currentTime,
          timestamp: Date.now(),
        })
        set({ lastVideoAction: 'play' })

        return new Promise((resolve: (data: VideoState) => void, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Failed to emit video play'))
          }, 2000)

          socket.once(
            'video_play_response',
            ({ success, ...data }: VideoState & { success: boolean }) => {
              console.log('Video play response', data)
              clearTimeout(timeout)
              if (!success) {
                reject(new Error('Failed to emit video play'))
                return
              }
              resolve(data)
            },
          )
        })
      },

      emitVideoPause: (currentTime: number) => {
        const { socket, currentRoom } = get()
        if (!socket || !currentRoom) throw new Error('Not connected to socket')

        socket.emit('video_pause', {
          roomId: currentRoom.id,
          currentTime,
          timestamp: Date.now(),
        })
        set({ lastVideoAction: 'pause' })

        return new Promise((resolve: (data: VideoState) => void, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Failed to emit video pause'))
          }, 2000)

          socket.once(
            'video_pause_response',
            ({ success, ...data }: VideoState & { success: boolean }) => {
              clearTimeout(timeout)
              if (!success) {
                reject(new Error('Failed to emit video pause'))
                return
              }
              resolve(data)
            },
          )
        })
      },

      emitVideoSeek: (
        currentTime: number,
        targetTime: number,
        isPlaying: boolean,
      ) => {
        const { socket, currentRoom } = get()
        if (!socket || !currentRoom) throw new Error('Not connected to socket')

        socket.emit('video_seek', {
          roomId: currentRoom.id,
          currentTime,
          targetTime,
          timestamp: Date.now(),
          isPlaying,
        })
        set({ lastVideoAction: 'seek' })

        return new Promise((resolve: (data: VideoState) => void, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Failed to emit video seek'))
          }, 2000)

          socket.once(
            'video_seek_response',
            ({ success, ...data }: VideoState & { success: boolean }) => {
              clearTimeout(timeout)
              if (!success) {
                reject(new Error('Failed to emit video seek'))
                return
              }
              resolve(data)
            },
          )
        })
      },

      emitVideoSeeked: (currentTime: number) => {
        console.log('emitVideoSeeked', currentTime)
        const { socket, currentRoom } = get()
        if (!socket || !currentRoom) throw new Error('Not connected to socket')

        socket.emit('video_seeked', {
          roomId: currentRoom.id,
          currentTime,
          timestamp: Date.now(),
        })
        set({ lastVideoAction: 'seeked' })
      },

      syncVideo: async () => {
        const { socket } = get()
        if (!socket) throw new Error('Not connected to socket')

        socket.emit('sync_video')
        set({ lastVideoAction: 'sync' })
        return await waitForSocketResponse<{ success: boolean }>({
          timeout: 2000,
          socket,
          event: 'video_sync_response',
        })
      },

      emitVideoWaiting: (currentTime: number, isPlaying: boolean) => {
        const { socket, currentRoom } = get()
        if (!socket || !currentRoom) throw new Error('Not connected to socket')

        console.log('Emitting video waiting', currentTime, isPlaying)

        socket.emit('video_waiting', {
          currentTime,
          timestamp: Date.now(),
          isPlaying,
        })
        set({ lastVideoAction: 'waiting' })
      },

      emitVideoCanPlay: (isPlaying: boolean) => {
        const { socket, currentRoom } = get()
        if (!socket || !currentRoom) throw new Error('Not connected to socket')
        console.log('Emitting video canplay', isPlaying)

        socket.emit('video_canplay', {
          isPlaying,
        })
        set({ lastVideoAction: 'canplay' })
      },

      copyRoomId: () => {
        const { currentRoom } = get()
        if (!currentRoom) return

        navigator.clipboard.writeText(currentRoom.id)
      },

      getAvailableRooms: async () => {
        const { socket } = get()
        if (!socket) throw new Error('Not connected to socket')

        set({ isLoading: true })
        socket.emit('get_available_rooms')

        return await waitForSocketResponse<{
          success: boolean
          data: SocketRoom[]
        }>({
          timeout: 2000,
          socket,
          event: 'available_rooms_response',
        }).then(data => {
          set({ availableRooms: data.data, isLoading: false })
          return data.data
        })
      },
    }),
    {
      name: 'room-settings',
      partialize: state => ({
        currentUser: state.currentUser,
        currentRoom: state.currentRoom,
        lastRoomId: state.lastRoomId,
      }),
    },
  ),
)

async function waitForSocketResponse<T>({
  timeout,
  socket,
  event,
}: {
  timeout: number
  socket: Socket
  event: string
}): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout'))
    }, timeout)

    socket.once(event, (data: T) => {
      clearTimeout(timeoutId)
      if (data && typeof data === 'object' && 'success' in data) {
        if (!data.success) {
          reject(new Error('Failed'))
          return
        }
        resolve(data)
        return
      }
      resolve(data)
    })

    socket.once('error', () => {
      clearTimeout(timeoutId)
      reject(new Error('Error'))
    })
  })
}
