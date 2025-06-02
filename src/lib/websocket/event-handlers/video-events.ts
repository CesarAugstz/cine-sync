import { Socket } from 'socket.io'
import { RoomManager } from '../room-manager'
import { ConnectionManager } from '../connection-manager'
import { VideoControlPayload } from '../types'

export class VideoEventHandler {
  constructor(
    private roomManager: RoomManager,
    private connectionManager: ConnectionManager,
  ) {}

  handleVideoPlay(socket: Socket, payload: VideoControlPayload): void {
    const userId = this.connectionManager.getUserIdBySocketId(socket.id)
    console.log('handleVideoPlay', userId)
    if (!userId) return

    if (!this.validateVideoControl(socket, payload, userId)) return

    const room = this.roomManager.updateVideoState(payload.roomId, userId, {
      currentTime: payload.currentTime,
      isPlaying: true,
      timestamp: payload.timestamp,
    })

    console.log('handleVideoPlay', room)

    if (!room) return

    console.log('users', room.users)
    this.connectionManager.broadcastToRoom(
      room.users,
      'video_play',
      {
        type: 'video_play',
        timestamp: payload.timestamp,
        currentTime: payload.currentTime,
        userId,
      },
    )
  }

  handleVideoPause(socket: Socket, payload: VideoControlPayload): void {
    const userId = this.connectionManager.getUserIdBySocketId(socket.id)
    if (!userId) return

    if (!this.validateVideoControl(socket, payload, userId)) return

    const room = this.roomManager.updateVideoState(payload.roomId, userId, {
      currentTime: payload.currentTime,
      isPlaying: false,
      timestamp: payload.timestamp,
    })

    if (!room) return

    this.connectionManager.broadcastToRoom(
      room.users,
      'video_pause',
      {
        type: 'video_pause',
        timestamp: payload.timestamp,
        currentTime: payload.currentTime,
        userId,
      },
    )
  }

  handleVideoSeek(socket: Socket, payload: VideoControlPayload): void {
    const userId = this.connectionManager.getUserIdBySocketId(socket.id)
    if (!userId) return

    if (!this.validateVideoControl(socket, payload, userId)) return
    if (!payload.targetTime) return

    const room = this.roomManager.updateVideoState(payload.roomId, userId, {
      currentTime: payload.targetTime,
      timestamp: payload.timestamp,
    })

    if (!room) return

    this.connectionManager.broadcastToRoom(
      room.users,
      'video_seek',
      {
        type: 'video_seek',
        timestamp: payload.timestamp,
        currentTime: payload.currentTime,
        targetTime: payload.targetTime,
        userId,
      },
    )
  }

  handleVideoSyncRequest(socket: Socket, payload: { roomId: string }): void {
    const userId = this.connectionManager.getUserIdBySocketId(socket.id)
    if (!userId) return

    const room = this.roomManager.getRoom(payload.roomId)
    if (!room) {
      socket.emit('error', {
        type: 'error',
        message: 'Room not found',
        code: 'ROOM_NOT_FOUND',
      })
      return
    }

    const userInRoom = room.users.find(u => u.id === userId)
    if (!userInRoom) {
      socket.emit('error', {
        type: 'error',
        message: 'User not in room',
        code: 'USER_NOT_IN_ROOM',
      })
      return
    }

    this.connectionManager.broadcastToRoom(room.users, 'video_sync_response', {
      type: 'video_sync_response',
      currentTime: room.videoState.currentTime,
      isPlaying: room.videoState.isPlaying,
      timestamp: room.videoState.timestamp,
      hostUserId: room.hostId,
    })
  }

  private validateVideoControl(
    socket: Socket,
    payload: VideoControlPayload,
    userId: string,
  ): boolean {
    if (!payload.roomId?.trim()) {
      socket.emit('error', {
        type: 'error',
        message: 'Room ID is required',
        code: 'INVALID_ROOM_ID',
      })
      return false
    }

    const room = this.roomManager.getRoom(payload.roomId)
    if (!room) {
      socket.emit('error', {
        type: 'error',
        message: 'Room not found',
        code: 'ROOM_NOT_FOUND',
      })
      return false
    }

    const userInRoom = room.users.find(u => u.id === userId)
    if (!userInRoom) {
      socket.emit('error', {
        type: 'error',
        message: 'User not in room',
        code: 'USER_NOT_IN_ROOM',
      })
      return false
    }

    return true
  }
}
