import { Server as SocketServer, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import { RoomManager } from './room-manager'
import { ConnectionManager } from './connection-manager'
import { RoomEventHandler } from './event-handlers/room-events'
import { VideoEventHandler } from './event-handlers/video-events'
import {
  CreateRoomPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  VideoControlPayload,
  ReconnectPayload
} from './types'

export class WebSocketService {
  private io: SocketServer
  private roomManager: RoomManager
  private connectionManager: ConnectionManager
  private roomEventHandler: RoomEventHandler
  private videoEventHandler: VideoEventHandler

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : '*',
        methods: ['GET', 'POST']
      }
    })

    console.log('WebSocket service initialized')

    this.roomManager = new RoomManager()
    this.connectionManager = new ConnectionManager()
    this.roomEventHandler = new RoomEventHandler(this.roomManager, this.connectionManager)
    this.videoEventHandler = new VideoEventHandler(this.roomManager, this.connectionManager)

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('New connection:', socket.id, socket.handshake.address)
      this.handleConnection(socket)
    })
  }

  private handleConnection(socket: Socket): void {
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

    socket.on('video_sync_request', (payload: { roomId: string }) => {
      this.videoEventHandler.handleVideoSyncRequest(socket, payload)
    })

    socket.on('reconnect_user', (payload: ReconnectPayload) => {
      this.handleReconnect(socket, payload)
    })

    socket.on('disconnect', () => {
      this.roomEventHandler.handleDisconnect(socket)
    })

    socket.on('error', (error: Error) => {
      console.error('Socket error:', error)
    })
  }

  private handleReconnect(socket: Socket, payload: ReconnectPayload): void {
    if (!payload.userName?.trim()) {
      socket.emit('reconnect_response', {
        success: false,
        error: 'User name is required'
      })
      return
    }

    if (!payload.roomId?.trim()) {
      socket.emit('reconnect_response', {
        success: true,
        data: null
      })
      return
    }

    const room = this.roomManager.getRoom(payload.roomId)
    if (!room) {
      socket.emit('reconnect_response', {
        success: false,
        error: 'Room not found'
      })
      return
    }

    const existingUser = room.users.find(u => u.name === payload.userName)
    if (!existingUser) {
      socket.emit('reconnect_response', {
        success: false,
        error: 'User not found in room'
      })
      return
    }

    this.connectionManager.updateUserSocket(existingUser.id, socket.id)
    this.roomManager.updateUserSocketId(existingUser.id, socket.id)

    socket.emit('reconnect_response', {
      success: true,
      data: room
    })

    this.connectionManager.broadcastToRoom(
      room.users,
      'user_reconnected',
      {
        type: 'user_reconnected',
        user: existingUser,
        room
      },
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
      totalConnections: this.connectionManager.getConnectionCount()
    }
  }

  getRooms() {
    return this.roomManager.getAllRooms()
  }

  shutdown(): void {
    this.io.close()
  }
}
