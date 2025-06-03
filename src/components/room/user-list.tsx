'use client'

import { SocketUser } from '@/lib/websocket/types'
import { Crown, User as UserIcon } from 'lucide-react'

interface UserListProps {
  users: SocketUser[] }

export default function UserList({ users }: UserListProps) {
  if (!users.length) return null

  return (
    <div className="bg-card/50 rounded-lg p-4">
      <h3 className="font-semibold mb-3 text-sm">Users ({users.length})</h3>
      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="flex items-center space-x-2">
            {user.isHost ? (
              <Crown className="h-4 w-4 text-yellow-500" />
            ) : (
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">{user.name}</span>
            {user.isHost && (
              <span className="text-xs text-muted-foreground">Host</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
