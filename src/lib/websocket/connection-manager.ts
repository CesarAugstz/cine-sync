import { Socket } from 'socket.io'
import { SocketUser } from './types'

export class ConnectionManager {
  private userSockets = new Map<string, Socket>()

  addConnection(userId: string, socket: Socket): void {
    this.userSockets.set(userId, socket)
  }

  removeConnection(socketId: string): string | null {
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket.id === socketId) {
        this.userSockets.delete(userId)
        return userId
      }
    }
    return null
  }

  updateUserSocket(userId: string, socket: Socket): void {
    this.userSockets.set(userId, socket)
  }

  getSocket(userId: string): Socket | null {
    return this.userSockets.get(userId) || null
  }

  getUserIdBySocketId(socketId: string): string | null {
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket.id === socketId) return userId
    }
    return null
  }

  broadcastToRoom(
    roomUsers: SocketUser[],
    event: string,
    data: any,
    excludeSocketId?: string,
  ): void {
    roomUsers.forEach(user => {
      if (user.socketId === excludeSocketId) return

      const socket = this.userSockets.get(user.id)
      if (socket) {
        socket.emit(event, data)
      }
    })
  }

  emitToUser(userId: string, event: string, data: any): boolean {
    const socket = this.getSocket(userId)
    if (!socket) return false

    socket.emit(event, data)
    return true
  }

  getConnectionCount(): number {
    return this.userSockets.size
  }

  getAllUserSockets(): Map<string, Socket> {
    return this.userSockets
  }
}
