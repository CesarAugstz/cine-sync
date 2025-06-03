import { Socket } from 'socket.io'
import { SocketUser } from './types'

export class ConnectionManager {
  private connections = new Map<string, Socket>()
  private userSockets = new Map<string, string>()

  getAllUserSockets(): Map<string, string> {
    return this.userSockets
  }

  addConnection(socket: Socket, userId: string): void {
    this.connections.set(socket.id, socket)
    this.userSockets.set(userId, socket.id)
  }

  removeConnection(socketId: string): string | null {
    this.connections.delete(socketId)
    
    for (const [userId, userSocketId] of this.userSockets.entries()) {
      if (userSocketId === socketId) {
        this.userSockets.delete(userId)
        return userId
      }
    }
    
    return null
  }

  getSocket(socketId: string): Socket | null {
    return this.connections.get(socketId) || null
  }

  getSocketByUserId(userId: string): Socket | null {
    const socketId = this.userSockets.get(userId)
    if (!socketId) return null
    return this.connections.get(socketId) || null
  }

  updateUserSocket(userId: string, newSocketId: string): void {
    this.userSockets.set(userId, newSocketId)
  }

  getUserIdBySocketId(socketId: string): string | null {
    for (const [userId, userSocketId] of this.userSockets.entries()) {
      if (userSocketId === socketId) return userId
    }
    return null
  }

  createUser(socketId: string, userName: string): SocketUser {
    return {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: userName,
      socketId,
      joinedAt: Date.now()
    }
  }

  broadcastToRoom(roomUsers: SocketUser[], event: string, data: any, excludeSocketId?: string): void {
    console.log('broadcastToRoom', event, data, excludeSocketId, roomUsers)
    roomUsers.forEach(user => {
      console.log('broadcastToRoom', {
        user,
        excludeSocketId,
        match: user.socketId === excludeSocketId
      })
      if (user.socketId === excludeSocketId) return
      
      const socket = this.connections.get(user.socketId)
      console.log('broadcastToRoom', socket, {
        connected: socket?.connected,
        disconnected: socket?.disconnected
      })
      if (socket) {
        socket.emit(event, data)
      }
    })
  }

  emitToUser(userId: string, event: string, data: any): boolean {
    const socket = this.getSocketByUserId(userId)
    if (!socket) return false
    
    socket.emit(event, data)
    return true
  }

  getConnectionCount(): number {
    return this.connections.size
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId)
  }
}
