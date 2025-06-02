'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Movie, SubtitleTrack } from '@/types/movie'
import { useParams } from 'next/navigation'
import VideoPlayer from '@/components/video-player/video-player'
import RoomPanel from '@/components/room/room-panel'

export default function MoviePage() {
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [panelWidth, setPanelWidth] = useState(0)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const params = useParams()

  const handlePanelWidthChange = useCallback((width: number, isCollapsed: boolean) => {
    setPanelWidth(width)
    setIsPanelCollapsed(isCollapsed)
  }, [])

  useEffect(() => {
    if (!params.id) return

    const fetchMovie = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/movies/${params.id}`)
        
        if (!response.ok) {
          throw new Error('Movie not found')
        }
        
        const movieData = await response.json()
        setMovie(movieData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load movie')
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-white text-center">
          <div className="text-xl mb-4">{error || 'Movie not found'}</div>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Back to Movies
          </Link>
        </div>
      </div>
    )
  }

  const videoSrc = `/api/stream/${encodeURIComponent(movie.videoFile.path)}`
  
  const subtitleTracks: SubtitleTrack[] = movie.subtitles.map(subtitle => ({
    languageTitle: subtitle.languageTitle,
    lang: subtitle.language,
    label: subtitle.language.toUpperCase(),
    src: `/api/subtitles/${encodeURIComponent(subtitle.path)}`
  }))

  return (
    <div className="min-h-screen bg-black relative">
      <motion.div
        animate={{ 
          marginRight: isPanelCollapsed ? '0px' : `${panelWidth}px` 
        }}
        transition={{ 
          duration: 0.4, 
          ease: "easeInOut" 
        }}
      >
        <div className="p-4">
          <Link href="/" className="inline-flex items-center text-white hover:text-gray-300 mb-4">
            <ArrowLeft size={20} className="mr-2" />
            Back to Movies
          </Link>
        </div>
        
        <div className="p-4">
          <VideoPlayer 
            src={videoSrc}
            title={movie.title}
            subtitles={subtitleTracks}
          />
        </div>
        
        <div className="p-4 text-white">
          <h1 className="text-2xl font-bold mb-2">{movie.title}</h1>
          {movie.description && (
            <p className="text-gray-300 mb-4">{movie.description}</p>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Year: <span className="text-white">{movie.year}</span></p>
              <p className="text-gray-400">Size: <span className="text-white">{(movie.videoFile.size / 1024 / 1024 / 1024).toFixed(2)} GB</span></p>
            </div>
            <div>
              {movie.director && (
                <p className="text-gray-400">Director: <span className="text-white">{movie.director}</span></p>
              )}
              {movie.genre.length > 0 && (
                <p className="text-gray-400">Genre: <span className="text-white">{movie.genre.join(', ')}</span></p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <RoomPanel onWidthChange={handlePanelWidthChange} />
    </div>
  )
}
