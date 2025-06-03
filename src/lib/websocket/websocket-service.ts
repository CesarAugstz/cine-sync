import { Server as SocketServer, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import { RoomManager } from './room-manager'
import { ConnectionManager } from './connection-manager'
import { UserManager } from './user-manager'
import { RoomEventHandler } from './event-handlers/room-events'
import { VideoEventHandler } from './event-handlers/video-events'
import {
  CreateRoomPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  VideoControlPayload,
  ReconnectPayload,
  AuthenticateUserPayload,
} from './types'

export class WebSocketService {
  private io: SocketServer
  private roomManager: RoomManager
  private connectionManager: ConnectionManager
  private userManager: UserManager
  private roomEventHandler: RoomEventHandler
  private videoEventHandler: VideoEventHandler

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : '*',
        methods: ['GET', 'POST'],
      },
    })

    console.log('WebSocket service initialized')

    this.roomManager = new RoomManager()
    this.connectionManager = new ConnectionManager()
    this.userManager = new UserManager()
    this.roomEventHandler = new RoomEventHandler(
      this.roomManager,
      this.connectionManager,
      this.userManager,
    )
    this.videoEventHandler = new VideoEventHandler(
      this.roomManager,
      this.connectionManager,
      this.userManager,
    )

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('New connection:', socket.id, socket.handshake.address)
      this.handleConnection(socket)
    })
  }

  private handleConnection(socket: Socket): void {
    socket.on('authenticate_user', (payload: AuthenticateUserPayload) => {
      this.handleUserAuthentication(socket, payload)
    })

    socket.on('create_room', (payload: CreateRoomPayload) => {
      console.log('create_room', payload)
      this.roomEventHandler.handleCreateRoom(socket, payload)
    })

    socket.on('join_room', (payload: JoinRoomPayload) => {
      this.roomEventHandler.handleJoinRoom(socket, payload)
    })

    socket.on('leave_room', (payload: LeaveRoomPayload) => {
      this.roomEventHandler.handleLeaveRoom(socket, payload)
    })

    socket.on('get_available_rooms', () => {
      this.handleGetAvailableRooms(socket)
    })

    socket.on('video_play', (payload: VideoControlPayload) => {
      console.log('video_play', payload)
      this.videoEventHandler.handleVideoPlay(socket, payload)
    })

    socket.on('video_pause', (payload: VideoControlPayload) => {
      this.videoEventHandler.handleVideoPause(socket, payload)
    })

    socket.on('video_seek', (payload: VideoControlPayload) => {
      this.videoEventHandler.handleVideoSeek(socket, payload)
    })

    socket.on('video_seeked', (payload: VideoControlPayload) => {
      this.videoEventHandler.handleVideoSeeked(socket, payload)
    })

    socket.on('video_sync_request', (payload: { roomId: string }) => {
      this.videoEventHandler.handleVideoSyncRequest(socket, payload)
    })

    socket.on('sync_video', (payload: { roomId: string }) => {
      this.videoEventHandler.handleVideoSyncRequest(socket, payload)
    })

    socket.on('video_waiting', (payload: VideoControlPayload) => {
      console.log('receive event "video_waiting"')
      this.videoEventHandler.handleVideoWaiting(socket, payload)
    })

    socket.on('video_canplay', (payload: VideoControlPayload) => {
      console.log('receive event "video_canplay"', payload)
      this.videoEventHandler.handleVideoCanPlay(socket, payload)
    })

    socket.on('reconnect_user', (payload: ReconnectPayload) => {
      console.log('rooms', {
        rooms: this.roomManager.getAllRooms(),
        usersInRoom: JSON.stringify(
          this.roomManager.getAllRooms().map(r => r.users),
          null,
          2,
        ),
        users: this.connectionManager.getAllUserSockets(),
      })
      this.handleReconnect(socket, payload)
    })

    socket.on('disconnect', () => {
      console.log('rooms', {
        rooms: this.roomManager.getAllRooms(),
        usersInRoom: JSON.stringify(
          this.roomManager.getAllRooms().map(r => r.users),
          null,
          2,
        ),
        users: this.connectionManager.getAllUserSockets(),
      })

      this.roomEventHandler.handleDisconnect(socket)
    })

    socket.on('error', (error: Error) => {
      console.error('Socket error:', error)
    })
  }

  private handleUserAuthentication(
    socket: Socket,
    payload: AuthenticateUserPayload,
  ): void {
    if (!payload.userId) {
      const newUser = this.userManager.createUser(
        socket.id,
        payload.userName || 'Anonymous',
      )
      this.connectionManager.addConnection(newUser.id, socket)

      socket.emit('authenticate_user_response', {
        success: true,
        data: newUser,
      })
      return
    }

    const existingUser = this.userManager.getUser(payload.userId)
    if (!existingUser) {
      const newUser = this.userManager.createUser(
        socket.id,
        payload.userName || 'Anonymous',
      )
      this.connectionManager.addConnection(newUser.id, socket)

      socket.emit('authenticate_user_response', {
        success: true,
        data: newUser,
      })
      return
    }

    const updatedUser = this.userManager.updateUserSocketId(
      existingUser.id,
      socket.id,
    )
    if (payload.userName && payload.userName !== existingUser.name) {
      this.userManager.updateUserName(existingUser.id, payload.userName)
    }

    this.connectionManager.updateUserSocket(existingUser.id, socket)

    socket.emit('authenticate_user_response', {
      success: true,
      data: updatedUser,
    })
  }

  private handleGetAvailableRooms(socket: Socket): void {
    const rooms = this.roomManager.getAllRooms()

    socket.emit('available_rooms_response', {
      success: true,
      data: rooms,
    })
  }

  private handleReconnect(socket: Socket, payload: ReconnectPayload): void {
    if (!payload?.user?.id) {
      socket.emit('reconnect_response', {
        success: false,
        error: 'UserId not provided',
      })
      return
    }

    if (!payload.roomId?.trim()) {
      socket.emit('reconnect_response', {
        success: true,
        data: null,
      })
      return
    }

    console.log('rooms', this.roomManager.getAllRooms())

    const user = this.userManager.getUser(payload.user.id)

    if (!user) {
      socket.emit('reconnect_response', {
        success: false,
        error: 'User not found',
      })
      return
    }

    const room = this.roomManager.getRoom(payload?.roomId)
    if (!room) {
      socket.emit('reconnect_response', {
        success: false,
        error: 'Room not found',
      })
      return
    }

    console.log('users in room', {
      users: room.users,
      userNames: room.users.map(u => u.name),
      payload,
    })

    console.log('before update', {
      rooms: this.roomManager.getAllRooms(),
      usersInRoom: JSON.stringify(
        this.roomManager.getAllRooms().map(r => r.users),
        null,
        2,
      ),
      users: this.connectionManager.getAllUserSockets(),
      existingUser: user,
    })

    this.userManager.updateUserSocketId(user.id, socket.id)
    this.connectionManager.updateUserSocket(user.id, socket)
    this.roomManager.addUserToRoom(payload.roomId, user)

    console.log('after update', {
      rooms: this.roomManager.getAllRooms(),
      users: this.connectionManager.getAllUserSockets(),
      json: JSON.stringify(
        this.roomManager.getAllRooms().map(r => r.users),
        null,
        2,
      ),
    })

    socket.emit('reconnect_response', {
      success: true,
      data: this.roomManager.getRoom(payload.roomId),
    })

    this.connectionManager.broadcastToRoom(
      room.users,
      'user_reconnected',
      {
        type: 'user_reconnected',
        user: this.userManager.getUser(user.id as string),
        room,
      },
      socket.id,
    )
  }

  getStats(): {
    connectedUsers: number
    activeRooms: number
    totalConnections: number
  } {
    return {
      connectedUsers: this.roomManager.getUserCount(),
      activeRooms: this.roomManager.getRoomCount(),
      totalConnections: this.connectionManager.getConnectionCount(),
    }
  }

  getRooms() {
    return this.roomManager.getAllRooms()
  }

  shutdown(): void {
    this.io.close()
  }

  emitError(socket: Socket, error: string): void {
    socket.emit('error', error)
  }
}
