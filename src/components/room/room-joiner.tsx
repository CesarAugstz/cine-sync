'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SocketRoom } from '@/lib/websocket/types'

interface RoomJoinerProps {
  onRoomJoined: (room: SocketRoom) => void
  onJoinRoom: (roomId: string, userName: string) => Promise<SocketRoom>
  isLoading: boolean
}

export default function RoomJoiner({
  onRoomJoined,
  onJoinRoom,
  isLoading,
}: RoomJoinerProps) {
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roomId.trim() || !userName.trim()) {
      setError('Please fill in all fields')
      return
    }

    try {
      setError('')
      const room = await onJoinRoom(
        roomId.trim().toUpperCase(),
        userName.trim(),
      )
      onRoomJoined(room)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join Room</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Room ID"
              value={roomId}
              onChange={e => setRoomId(e.target.value.toUpperCase())}
              disabled={isLoading}
              maxLength={6}
            />
          </div>
          <div>
            <Input
              placeholder="Your name"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join Room'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
