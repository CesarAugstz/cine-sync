import { Socket } from 'socket.io'
import { RoomManager } from '../room-manager'
import { ConnectionManager } from '../connection-manager'
import { UserManager } from '../user-manager'
import { VideoControlPayload } from '../types'
import { WSErrorResponse } from '@/lib/erros'

export class VideoEventHandler {
  constructor(
    private roomManager: RoomManager,
    private connectionManager: ConnectionManager,
    private userManager: UserManager,
  ) {}

  handleVideoPlay(socket: Socket, payload: VideoControlPayload): void {
    const userId = this.connectionManager.getUserIdBySocketId(socket.id)
    console.log('handleVideoPlay', userId)
    if (!userId) throw new WSErrorResponse('User not found')

    if (!this.validateVideoControl(socket, payload, userId))
      throw new WSErrorResponse('Invalid video control', {
        payload,
        userId,
      })

    const room = this.roomManager.updateVideoState(payload.roomId, userId, {
      currentTime: payload.currentTime,
      isPlaying: true,
      timestamp: payload.timestamp,
    })

    console.log('handleVideoPlay', room)

    if (!room) throw new WSErrorResponse('Room not found')

    socket.emit('video_play_response', {
      type: 'video_play_response',
      success: true,
      currentTime: payload.currentTime,
      isPlaying: true,
      timestamp: payload.timestamp,
    })

    console.log('users', room.users)
    this.connectionManager.broadcastToRoom(room.users, 'video_play', {
      type: 'video_play',
      timestamp: payload.timestamp,
      currentTime: payload.currentTime,
    })
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

    socket.emit('video_pause_response', {
      type: 'video_pause_response',
      success: true,
      currentTime: payload.currentTime,
      isPlaying: false,
      timestamp: payload.timestamp,
    })

    this.connectionManager.broadcastToRoom(room.users, 'video_pause', {
      type: 'video_pause',
      timestamp: payload.timestamp,
      currentTime: payload.currentTime,
      userId,
    })
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

    this.roomManager.resetAllReadyStates(payload.roomId)
    this.roomManager.setWaitingToPlay(
      payload.roomId,
      payload.isPlaying ?? false,
    )

    socket.emit('video_seek_response', {
      type: 'video_seek_response',
      success: true,
      currentTime: payload.targetTime,
      isPlaying: room.videoState.isPlaying,
      timestamp: payload.timestamp,
    })

    this.connectionManager.broadcastToRoom(
      room.users,
      'awaiting_users',
      {},
    )

    this.connectionManager.broadcastToRoom(room.users, 'video_seek', {
      type: 'video_seek',
      timestamp: payload.timestamp,
      currentTime: payload.currentTime,
      targetTime: payload.targetTime,
      userId,
    })
  }

  handleVideoSeeked(socket: Socket, payload: VideoControlPayload): void {
    console.log('called handleVideoSeeked', {
      userId: this.connectionManager.getUserIdBySocketId(socket.id),
    })
    const userId = this.connectionManager.getUserIdBySocketId(socket.id)
    if (!userId) return

    if (!this.validateVideoControl(socket, payload, userId)) return

    const room = this.roomManager.updateVideoState(payload.roomId, userId, {
      currentTime: payload.currentTime,
      timestamp: payload.timestamp,
    })

    if (!room) return

    this.roomManager.setIsUserReady(payload.roomId, userId, true)

    console.log('users ready', this.roomManager.getIsAllReady(payload.roomId))

    if (
      this.roomManager.getIsAllReady(payload.roomId) &&
      room.videoState.waitingToPlay
    ) {
      this.connectionManager.broadcastToRoom(room.users, 'video_play', {
        type: 'video_play',
        timestamp: payload.timestamp,
        currentTime: payload.currentTime,
      })
      this.roomManager.setWaitingToPlay(payload.roomId, false)
    }
  }

  handleVideoSyncRequest(socket: Socket, payload: { roomId: string }): void {
    const userId = this.connectionManager.getUserIdBySocketId(socket.id)
    if (!userId) return

    const room = this.roomManager.getRoomByUserId(userId)

    if (!room) {
      socket.emit('error', {
        type: 'error',
        message: 'Room not found',
        code: 'ROOM_NOT_FOUND',
      })
      return
    }

    socket.emit('video_sync_response', {
      type: 'video_sync_response',
      success: true,
    })

    this.connectionManager.broadcastToRoom(room.users, 'video_sync', {
      type: 'video_sync',
      currentTime: room.videoState.currentTime,
      isPlaying: room.videoState.isPlaying,
      timestamp: room.videoState.timestamp,
      hostUserId: room.hostId,
    })
  }

  handleVideoWaiting(
    socket: Socket,
    { currentTime, timestamp, isPlaying }: VideoControlPayload,
  ): void {
    const userId = this.connectionManager.getUserIdBySocketId(socket.id)
    if (!userId) return

    const room = this.roomManager.getRoomByUserId(userId)

    if (!room) {
      socket.emit('error', {
        type: 'error',
        message: 'Room not found',
        code: 'ROOM_NOT_FOUND',
      })
      return
    }

    this.roomManager.setIsUserReady(room.id, userId, false)

    this.roomManager.updateVideoState(room.id, userId, {
      currentTime,
      isPlaying: false,
      timestamp,
    })

    this.connectionManager.broadcastToRoom(room.users, 'video_pause', {
      type: 'video_pause',
      timestamp: timestamp ?? room.videoState.timestamp,
      currentTime: currentTime ?? room.videoState.currentTime,
      userId,
    })

    this.connectionManager.broadcastToRoom(
      room.users,
      'awaiting_users',
      {},
      userId,
    )

    this.roomManager.setWaitingToPlay(room.id, isPlaying ?? false)
  }

  handleVideoCanPlay(socket: Socket, { isPlaying }: VideoControlPayload): void {
    const userId = this.connectionManager.getUserIdBySocketId(socket.id)
    if (!userId) return

    const room = this.roomManager.getRoomByUserId(userId)

    if (!room) {
      socket.emit('error', {
        type: 'error',
        message: 'Room not found',
        code: 'ROOM_NOT_FOUND',
      })
      return
    }

    this.roomManager.setIsUserReady(room.id, userId, true)

    if (!this.roomManager.getIsAllReady(room.id)) return

    this.connectionManager.broadcastToRoom(
      room.users,
      'users_ready',
      {},
      userId,
    )

    if (!room.videoState.waitingToPlay) return

    this.connectionManager.broadcastToRoom(room.users, 'video_play', {
      type: 'video_play',
      timestamp: room.videoState.timestamp,
      currentTime: room.videoState.currentTime,
    })
    this.roomManager.setWaitingToPlay(room.id, false)
    return
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
