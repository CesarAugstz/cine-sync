import { SocketRoom, SocketUser } from '@/lib/websocket/types'

export interface RoomState {
  currentRoom: SocketRoom | null
  isConnected: boolean
  currentUser: SocketUser | null
}
