'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SocketRoom } from '@/lib/websocket/types'

interface RoomCreatorProps {
  onRoomCreated: (room: SocketRoom) => void
  onCreateRoom: (roomName: string, userName: string) => Promise<SocketRoom>
  isLoading: boolean
}

export default function RoomCreator({
  onRoomCreated,
  onCreateRoom,
  isLoading,
}: RoomCreatorProps) {
  const [roomName, setRoomName] = useState('')
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roomName.trim() || !userName.trim()) {
      setError('Please fill in all fields')
      return
    }

    try {
      setError('')
      const room = await onCreateRoom(roomName.trim(), userName.trim())
      onRoomCreated(room)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Room</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Room name"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              disabled={isLoading}
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
            {isLoading ? 'Creating...' : 'Create Room'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
