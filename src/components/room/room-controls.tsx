'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, LogOut, Users } from 'lucide-react'
import UserList from './user-list'
import { SocketRoom } from '@/lib/websocket/types'

interface RoomControlsProps {
  room: SocketRoom
  onLeaveRoom: () => void
  onCopyRoomId: () => void
}

export default function RoomControls({
  room,
  onLeaveRoom,
  onCopyRoomId,
}: RoomControlsProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>{room.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-muted rounded p-2 text-sm font-mono">
            {room.id}
          </div>
          <Button variant="outline" size="sm" onClick={onCopyRoomId}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <UserList users={room.users} />

        <Button variant="destructive" className="w-full" onClick={onLeaveRoom}>
          <LogOut className="h-4 w-4 mr-2" />
          Leave Room
        </Button>
      </CardContent>
    </Card>
  )
}
