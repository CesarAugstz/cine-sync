export interface SocketUser {
  id: string
  name: string
  socketId: string
  joinedAt: number
  isHost?: boolean
}

export interface VideoState {
  currentTime: number
  isPlaying: boolean
  timestamp: number
  lastUpdatedBy: string
}

export interface SocketRoom {
  id: string
  name: string
  hostId: string
  users: SocketUser[]
  videoState: VideoState
  createdAt: number
}

export interface CreateRoomPayload {
  roomName: string
  userName: string
}

export interface JoinRoomPayload {
  roomId: string
  userName: string
}

export interface LeaveRoomPayload {
  roomId: string
}

export interface VideoControlPayload {
  roomId: string
  timestamp: number
  currentTime: number
  targetTime?: number
}

export interface ReconnectPayload {
  roomId?: string
  userName: string
}

export interface SocketResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface BroadcastEvent {
  type: string
  [key: string]: any
}

export type ErrorCode = 
  | 'ROOM_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'INVALID_PERMISSIONS'
  | 'ROOM_FULL'
  | 'INVALID_ROOM_ID'
  | 'USER_NOT_IN_ROOM'
