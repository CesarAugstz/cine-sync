import { SocketRoom, SocketUser, VideoState } from './types'

export class RoomManager {
  private rooms = new Map<string, SocketRoom>()
  private userToRoom = new Map<string, string>()

  constructor() {
    this.rooms.set('public', {
      id: 'public',
      name: 'Public',
      hostId: 'public',
      users: [],
      videoState: {
        currentTime: 0,
        isPlaying: false,
        timestamp: Date.now(),
        lastUpdatedBy: 'public',
      },
      createdAt: Date.now(),
    })
  }

  generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  createRoom(roomName: string, hostUser: SocketUser): SocketRoom {
    const roomId = this.generateRoomId()

    const room: SocketRoom = {
      id: roomId,
      name: roomName,
      hostId: hostUser.id,
      users: [hostUser],
      videoState: {
        currentTime: 0,
        isPlaying: false,
        timestamp: Date.now(),
        lastUpdatedBy: hostUser.id,
      },
      createdAt: Date.now(),
    }

    this.rooms.set(roomId, room)
    this.userToRoom.set(hostUser.id, roomId)

    console.log('Created room', { room, rooms: this.rooms })

    return room
  }

  getRoom(roomId: string): SocketRoom | null {
    return this.rooms.get(roomId) || null
  }

  getRoomByUserId(userId: string): SocketRoom | null {
    const roomId = this.userToRoom.get(userId)
    if (!roomId) return null
    return this.getRoom(roomId)
  }

  getUserById(userId: string): SocketUser | null {
    const room = this.getRoomByUserId(userId)
    if (!room) return null
    return room.users.find(u => u.id === userId) || null
  }

  addUserToRoom(roomId: string, user: SocketUser): SocketRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    const existingUser = room.users.find(u => u.name === user.name)
    if (existingUser) return null

    room.users.push(user)
    this.userToRoom.set(user.id, roomId)

    return room
  }

  removeUserFromRoom(userId: string): {
    room: SocketRoom | null
    wasHost: boolean
  } {
    const roomId = this.userToRoom.get(userId)
    if (!roomId) return { room: null, wasHost: false }

    const room = this.rooms.get(roomId)
    if (!room) return { room: null, wasHost: false }

    const wasHost = room.hostId === userId
    room.users = room.users.filter(u => u.id !== userId)
    this.userToRoom.delete(userId)

    if (room.users.length === 0 && roomId !== 'public') {
      this.rooms.delete(roomId)
      return { room: null, wasHost }
    }

    if (wasHost && room.users.length > 0) {
      room.hostId = room.users[0].id
    }

    return { room, wasHost }
  }

  updateVideoState(
    roomId: string,
    userId: string,
    videoState: Partial<VideoState>,
  ): SocketRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    room.videoState = {
      ...room.videoState,
      ...videoState,
      timestamp: Date.now(),
      lastUpdatedBy: userId,
    }

    return room
  }

  getUserBySocketId(
    socketId: string,
  ): { user: SocketUser; room: SocketRoom } | null {
    for (const room of this.rooms.values()) {
      const user = room.users.find(u => u.socketId === socketId)
      if (user) return { user, room }
    }
    return null
  }

  isUserHost(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId)
    return room?.hostId === userId || false
  }

  updateUserSocketId(userId: string, newSocketId: string): SocketRoom | null {
    const roomId = this.userToRoom.get(userId)
    if (!roomId) return null

    const room = this.rooms.get(roomId)
    if (!room) return null

    const user = room.users.find(u => u.id === userId)
    if (!user) return null

    user.socketId = newSocketId
    return room
  }

  updateUserName(userId: string, newName: string): SocketRoom | null {
    const roomId = this.userToRoom.get(userId)
    if (!roomId) return null

    const room = this.rooms.get(roomId)
    if (!room) return null

    const user = room.users.find(u => u.id === userId)
    if (!user) return null

    user.name = newName
    return room
  }

  getAllRooms(): SocketRoom[] {
    return Array.from(this.rooms.values())
  }

  getRoomCount(): number {
    return this.rooms.size
  }

  getUserCount(): number {
    return this.userToRoom.size
  }

  resetAllReadyStates(roomId: string): SocketRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    room.users.forEach(u => (u.isReady = false))
    return room
  }

  getIsAllReady(roomId: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room) return false

    return room.users.every(u => u.isReady)
  }

  setIsUserReady(
    roomId: string,
    userId: string,
    isReady: boolean,
  ): SocketRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    const user = room.users.find(u => u.id === userId)
    if (!user) return null

    user.isReady = isReady
    return room
  }

  setWaitingToPlay(roomId: string, isWaiting: boolean): SocketRoom | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    room.videoState.waitingToPlay = isWaiting
    return room
  }
}
