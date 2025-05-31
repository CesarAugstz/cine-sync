'use client'

import { useState, useEffect } from 'react'
import MovieCard from './movie-card'
import { Movie } from '@/types/movie'

export default function MovieGrid() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => {
        if (data?.error) 
          throw new Error(data.error)

        setMovies(data ?? [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading movies:', error)
        setLoading(false)
      })
  }, [])


  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] bg-muted rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {movies?.map(movie => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  )
}
