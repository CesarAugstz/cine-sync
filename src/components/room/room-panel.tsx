'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRoomStore } from '@/stores/room-store'
import {
  Users,
  X,
  Copy,
  UserPlus,
  Settings,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

interface RoomPanelProps {
  onWidthChange: (width: number, collapsed: boolean) => void
}

export default function RoomPanel({ onWidthChange }: RoomPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [roomName, setRoomName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)

  const {
    currentRoom,
    isConnected,
    isLoading,
    userName: storedUserName,
    videoState,
    lastVideoAction,
    setUserName: setStoredUserName,
    connectSocket,
    disconnectSocket,
    createRoom,
    joinRoom,
    leaveRoom,
    copyRoomId,
    syncVideo,
  } = useRoomStore()

  const panelWidth = 350

  useEffect(() => {
    onWidthChange(panelWidth, isCollapsed)
  }, [isCollapsed, onWidthChange])

  useEffect(() => {
    setUserName(storedUserName)
  }, [storedUserName])

  useEffect(() => {
    console.log('isConnected', isConnected)
    if (!isConnected) {
      connectSocket()
    }

    return () => {
      if (currentRoom) {
        //leaveRoom()
      }
    }
  }, [connectSocket, currentRoom, disconnectSocket, isConnected, leaveRoom])

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const handleCreateRoom = useCallback(async () => {
    if (!roomName.trim() || !userName.trim()) return

    setStoredUserName(userName)
    const success = await createRoom(roomName, userName)
    if (!success) return toast.error('Failed to create room')

    toast.success('Room created successfully!', {
      action: {
        label: 'Leave Room',
        onClick: () => leaveRoom(),
      },
    })
    setShowCreateForm(false)
    setRoomName('')
  }, [roomName, userName, createRoom, setStoredUserName, leaveRoom])

  const handleJoinRoom = useCallback(async () => {
    if (!roomId.trim() || !userName.trim()) return

    setStoredUserName(userName)
    const success = await joinRoom(roomId, userName)
    if (success) {
      setShowJoinForm(false)
      setRoomId('')
    }
  }, [roomId, userName, joinRoom, setStoredUserName])

  const handleLeaveRoom = useCallback(() => {
    leaveRoom()
    setShowCreateForm(false)
    setShowJoinForm(false)
  }, [leaveRoom])

  const handleCopyRoomId = useCallback(() => {
    copyRoomId()
  }, [copyRoomId])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getLastActionText = () => {
    if (!lastVideoAction || !videoState) return ''

    switch (lastVideoAction) {
      case 'play':
        return 'Started playing'
      case 'pause':
        return 'Paused'
      case 'seek':
        return `Seeked to ${formatTime(videoState.currentTime)}`
      case 'sync':
        return 'Synced with room'
      default:
        return ''
    }
  }

  return (
    <>
      {/* Collapse/Expand Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleCollapse}
        className="fixed top-4 right-4 z-40 bg-black/50 text-white hover:bg-black/70"
      >
        {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </Button>

      {/* Room Panel */}
      <div
        className={`fixed top-0 right-0 h-full bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 transition-transform duration-300 z-30 ${
          isCollapsed ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{ width: panelWidth }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-start space-x-2">
              <h2 className="text-white font-semibold flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Watch Together
              </h2>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-xs text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!currentRoom ? (
              /* Not in a room */
              <div className="p-4 space-y-4">
                <div className="text-center text-gray-400 mb-6">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Create or join a room to watch together</p>
                </div>

                {/* User Name Input */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Your Name</label>
                  <Input
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                {/* Create Room */}
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    variant="outline"
                    className="w-full border-gray-600 text-white hover:bg-gray-800"
                    disabled={isLoading}
                  >
                    Create Room
                  </Button>

                  {showCreateForm && (
                    <div className="space-y-2">
                      <Input
                        value={roomName}
                        onChange={e => setRoomName(e.target.value)}
                        placeholder="Room name"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleCreateRoom}
                          disabled={
                            !roomName.trim() || !userName.trim() || isLoading
                          }
                          className="flex-1"
                        >
                          {isLoading ? 'Creating...' : 'Create'}
                        </Button>
                        <Button
                          onClick={() => setShowCreateForm(false)}
                          variant="outline"
                          className="border-gray-600"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Join Room */}
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowJoinForm(!showJoinForm)}
                    variant="outline"
                    className="w-full border-gray-600 text-white hover:bg-gray-800"
                    disabled={isLoading}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Room
                  </Button>

                  {showJoinForm && (
                    <div className="space-y-2">
                      <Input
                        value={roomId}
                        onChange={e => setRoomId(e.target.value)}
                        placeholder="Room ID"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleJoinRoom}
                          disabled={
                            !roomId.trim() || !userName.trim() || isLoading
                          }
                          className="flex-1"
                        >
                          {isLoading ? 'Joining...' : 'Join'}
                        </Button>
                        <Button
                          onClick={() => setShowJoinForm(false)}
                          variant="outline"
                          className="border-gray-600"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* In a room */
              <div className="p-4 space-y-4">
                {/* Room Info */}
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">
                      {currentRoom.name}
                    </h3>
                    <Button
                      onClick={handleLeaveRoom}
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                    >
                      <X size={16} />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 flex-1">
                      {currentRoom.id}
                    </code>
                    <Button
                      onClick={handleCopyRoomId}
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>

                {/* Video State */}
                {videoState && (
                  <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">
                        Video Status
                      </span>
                      <Button
                        onClick={syncVideo}
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-white"
                      >
                        <RefreshCw size={14} />
                      </Button>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">State:</span>
                        <span
                          className={`${
                            videoState.isPlaying
                              ? 'text-green-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {videoState.isPlaying ? 'Playing' : 'Paused'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white">
                          {formatTime(videoState.currentTime)}
                        </span>
                      </div>
                      {lastVideoAction && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last:</span>
                          <span className="text-blue-400">
                            {getLastActionText()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Users List */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h4 className="text-sm text-gray-300 mb-2">
                    Users ({currentRoom.users.length})
                  </h4>
                  <div className="space-y-1">
                    {currentRoom.users.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm text-white flex-1">
                          {user.name}
                        </span>
                        {user.id === currentRoom.hostId && (
                          <span className="text-xs bg-blue-600 px-1 py-0.5 rounded text-white">
                            Host
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Room Settings */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h4 className="text-sm text-gray-300 mb-2 flex items-center">
                    <Settings className="w-4 h-4 mr-1" />
                    Settings
                  </h4>
                  <div className="space-y-2 text-xs text-gray-400">
                    <p>• Video controls are synchronized</p>
                    <p>• Volume and subtitles are local</p>
                    <p>• Fullscreen is local only</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
