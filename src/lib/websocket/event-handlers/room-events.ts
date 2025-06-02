import { Socket } from 'socket.io'
import { RoomManager } from '../room-manager'
import { ConnectionManager } from '../connection-manager'
import { CreateRoomPayload, JoinRoomPayload, LeaveRoomPayload, SocketResponse } from '../types'

export class RoomEventHandler {
  constructor(
    private roomManager: RoomManager,
    private connectionManager: ConnectionManager
  ) {}

  handleCreateRoom(socket: Socket, payload: CreateRoomPayload): void {
    if (!payload.roomName?.trim() || !payload.userName?.trim()) {
      socket.emit('create_room_response', {
        success: false,
        error: 'Room name and user name are required'
      } as SocketResponse)
      return
    }

    const user = this.connectionManager.createUser(socket.id, payload.userName.trim())
    const room = this.roomManager.createRoom(payload.roomName.trim(), user)
    
    this.connectionManager.addConnection(socket, user.id)
    
    socket.emit('create_room_response', {
      success: true,
      data: room
    } as SocketResponse)
  }

  handleJoinRoom(socket: Socket, payload: JoinRoomPayload): void {
    if (!payload.roomId?.trim() || !payload.userName?.trim()) {
      socket.emit('join_room_response', {
        success: false,
        error: 'Room ID and user name are required'
      } as SocketResponse)
      return
    }

    const existingRoom = this.roomManager.getRoom(payload.roomId.trim())
    if (!existingRoom) {
      socket.emit('join_room_response', {
        success: false,
        error: 'Room not found'
      } as SocketResponse)
      return
    }

    const user = this.connectionManager.createUser(socket.id, payload.userName.trim())
    const room = this.roomManager.addUserToRoom(payload.roomId.trim(), user)
    
    if (!room) {
      socket.emit('join_room_response', {
        success: false,
        error: 'User with this name already exists in room'
      } as SocketResponse)
      return
    }

    this.connectionManager.addConnection(socket, user.id)
    
    socket.emit('join_room_response', {
      success: true,
      data: room
    } as SocketResponse)

    this.connectionManager.broadcastToRoom(
      room.users,
      'user_joined',
      { type: 'user_joined', user, room },
      socket.id
    )
  }

  handleLeaveRoom(socket: Socket, payload: LeaveRoomPayload): void {
    const userId = this.connectionManager.getUserIdBySocketId(socket.id)
    if (!userId) return

    const { room, wasHost } = this.roomManager.removeUserFromRoom(userId)
    if (!room) return

    this.connectionManager.broadcastToRoom(
      room.users,
      'user_left',
      { 
        type: 'user_left', 
        userId,
        room,
        newHost: wasHost ? room.users[0] : undefined
      }
    )

    if (wasHost && room.users.length > 0) {
      this.connectionManager.broadcastToRoom(
        room.users,
        'host_changed',
        { type: 'host_changed', newHost: room.users[0], room }
      )
    }
  }

  handleDisconnect(socket: Socket): void {
    const userId = this.connectionManager.removeConnection(socket.id)
    if (!userId) return

    const { room, wasHost } = this.roomManager.removeUserFromRoom(userId)
    if (!room) return

    this.connectionManager.broadcastToRoom(
      room.users,
      'user_disconnected',
      { 
        type: 'user_disconnected', 
        userId,
        room,
        newHost: wasHost ? room.users[0] : undefined
      }
    )

    if (wasHost && room.users.length > 0) {
      this.connectionManager.broadcastToRoom(
        room.users,
        'host_changed',
        { type: 'host_changed', newHost: room.users[0], room }
      )
    }
  }
}