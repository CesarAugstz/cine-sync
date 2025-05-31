'use client'

interface VideoTitleProps {
  title: string
  showControls: boolean
}

export default function VideoTitle({ title, showControls }: VideoTitleProps) {
  if (!showControls) return null

  return (
    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
      <h1 className="text-white text-2xl font-bold">{title}</h1>
    </div>
  )
}