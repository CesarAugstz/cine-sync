import { SocketUser } from './types'

export class UserManager {
  private users = new Map<string, SocketUser>()

  createUser(socketId: string, userName: string): SocketUser {
    const user: SocketUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: userName,
      socketId,
      joinedAt: Date.now(),
    }
    this.users.set(user.id, user)
    return user
  }

  getUser(userId: string): SocketUser | undefined {
    return this.users.get(userId)
  }

  updateUser(userId: string, updates: Partial<SocketUser>): SocketUser | null {
    const user = this.users.get(userId)
    if (!user) return null

    const updatedUser = { ...user, ...updates }
    this.users.set(userId, updatedUser)
    return updatedUser
  }

  updateUserSocketId(userId: string, socketId: string): SocketUser | null {
    return this.updateUser(userId, { socketId })
  }

  updateUserName(userId: string, name: string): SocketUser | null {
    return this.updateUser(userId, { name })
  }

  deleteUser(userId: string): boolean {
    return this.users.delete(userId)
  }

  getAllUsers(): SocketUser[] {
    return Array.from(this.users.values())
  }
}