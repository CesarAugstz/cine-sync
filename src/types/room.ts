export interface User {
  id: string
  name: string
  isHost: boolean
}

export interface Room {
  id: string
  name: string
  users: User[]
  createdAt: string
}

export interface RoomState {
  currentRoom: Room | null
  isConnected: boolean
  currentUser: User | null
}
