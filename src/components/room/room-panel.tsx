'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useRoomStore } from '@/stores/room-store'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import PanelHeader from './room-panel/components/panel-header'
import StepName from './room-panel/components/step-name'
import StepChoice from './room-panel/components/step-choice'
import StepBrowse from './room-panel/components/step-browse'
import StepCreate from './room-panel/components/step-create'
import StepJoin from './room-panel/components/step-join'
import RoomInfo from './room-panel/components/room-info'

interface RoomPanelProps {
  onWidthChange: (width: number, collapsed: boolean) => void
}

type Step = 'name' | 'choice' | 'browse' | 'create' | 'join'

export default function RoomPanel({ onWidthChange }: RoomPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [currentStep, setCurrentStep] = useState<Step>('name')
  const [direction, setDirection] = useState(0)
  const [roomName, setRoomName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState('')

  const {
    currentRoom,
    isConnected,
    isLoading,
    currentUser,
    videoState,
    lastVideoAction,
    connectSocket,
    createRoom,
    joinRoom,
    leaveRoom,
    copyRoomId,
    syncVideo,
    availableRooms,
    isLoadingRooms,
    getAvailableRooms,
    authenticateUser,
  } = useRoomStore()

  const panelWidth = 350

  useEffect(() => {
    onWidthChange(panelWidth, isCollapsed)
  }, [isCollapsed, onWidthChange])

  useEffect(() => {
    setUserName(currentUser?.name ?? '')
  }, [currentUser?.name, setUserName])

  useEffect(() => {
    if (!isConnected) connectSocket()
  }, [connectSocket, isConnected])

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const navigateToStep = useCallback((step: Step, dir: number = 1) => {
    setDirection(dir)
    setCurrentStep(step)
  }, [])

  const handleContinueFromName = useCallback(async () => {
    if (!userName.trim()) return
    await authenticateUser(currentUser?.id, userName)
    navigateToStep('choice', 1)
  }, [userName, authenticateUser, currentUser?.id, navigateToStep])

  const handleCreateRoom = useCallback(async () => {
    if (!roomName.trim() || !userName.trim()) return

    const success = await createRoom(roomName, userName)
    if (!success) return toast.error('Failed to create room')

    toast.success('Room created successfully!', {
      action: {
        label: 'Leave Room',
        onClick: () => leaveRoom(),
      },
    })
    setRoomName('')
  }, [roomName, userName, createRoom, leaveRoom])

  const handleJoinRoom = useCallback(
    async (usernameProp?: string, roomIdProp?: string) => {
      const name = usernameProp || userName
      const id = roomIdProp || roomId

      if (!name?.trim() || !id?.trim()) return

      const success = await joinRoom(id, name)
      if (success) {
        setRoomId('')
      }
    },
    [roomId, userName, joinRoom],
  )

  const handleBrowseRooms = useCallback(async () => {
    navigateToStep('browse', 1)
    try {
      await getAvailableRooms()
    } catch (error) {
      console.error('Failed to load available rooms:', error)
      toast.error('Failed to load available rooms')
    }
  }, [getAvailableRooms, navigateToStep])

  const handleRefreshRooms = useCallback(async () => {
    try {
      await getAvailableRooms()
    } catch (error) {
      console.error('Failed to refresh rooms:', error)
      toast.error('Failed to refresh rooms')
    }
  }, [getAvailableRooms])

  const handleLeaveRoom = useCallback(() => {
    leaveRoom()
    setCurrentStep('name')
    setRoomName('')
    setRoomId('')
  }, [leaveRoom])

  const handleBack = useCallback(() => {
    if (currentStep === 'choice') {
      navigateToStep('name', -1)
    } else if (
      currentStep === 'browse' ||
      currentStep === 'create' ||
      currentStep === 'join'
    ) {
      navigateToStep('choice', -1)
    }
  }, [currentStep, navigateToStep])

  const renderStepContent = () => {
    if (currentRoom) {
      return (
        <RoomInfo
          currentRoom={currentRoom}
          videoState={videoState ?? undefined}
          lastVideoAction={lastVideoAction ?? undefined}
          onLeaveRoom={handleLeaveRoom}
          onCopyRoomId={copyRoomId}
          onSyncVideo={syncVideo}
        />
      )
    }

    switch (currentStep) {
      case 'name':
        return (
          <StepName
            userName={userName}
            onUserNameChange={setUserName}
            onContinue={handleContinueFromName}
            direction={direction}
          />
        )

      case 'choice':
        return (
          <StepChoice
            userName={userName}
            onBack={handleBack}
            onBrowseRooms={handleBrowseRooms}
            onCreateRoom={() => navigateToStep('create', 1)}
            onJoinRoom={() => navigateToStep('join', 1)}
            isLoadingRooms={isLoadingRooms}
            direction={direction}
          />
        )

      case 'browse':
        return (
          <StepBrowse
            userName={userName}
            onBack={handleBack}
            onJoinRoom={handleJoinRoom}
            onRefreshRooms={handleRefreshRooms}
            availableRooms={availableRooms}
            isLoadingRooms={isLoadingRooms}
            isLoading={isLoading}
            direction={direction}
          />
        )

      case 'create':
        return (
          <StepCreate
            roomName={roomName}
            onRoomNameChange={setRoomName}
            onBack={handleBack}
            onCreateRoom={handleCreateRoom}
            isLoading={isLoading}
            direction={direction}
          />
        )

      case 'join':
        return (
          <StepJoin
            roomId={roomId}
            onRoomIdChange={setRoomId}
            onBack={handleBack}
            onJoinRoom={() => handleJoinRoom()}
            isLoading={isLoading}
            direction={direction}
          />
        )

      default:
        return null
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleCollapse}
        className="fixed top-4 right-4 z-40 bg-black/50 text-white hover:bg-black/70"
      >
        {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </Button>

      <div
        className={`fixed top-0 right-0 h-full bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 transition-transform duration-300 z-30 ${
          isCollapsed ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{ width: panelWidth }}
      >
        <div className="flex flex-col h-full">
          <PanelHeader isConnected={isConnected} />

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait" custom={direction}>
              {renderStepContent()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  )
}
