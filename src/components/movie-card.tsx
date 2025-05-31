'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Play } from 'lucide-react'
import { Movie } from '@/types/movie'


interface MovieCardProps {
  movie: Movie
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link href={`/movie/${movie.id}`}>
      <Card className="group cursor-pointer overflow-hidden border-0 bg-card/50 hover:scale-105 transition-transform duration-200">
        <CardContent className="p-0">
          <div className="relative aspect-[2/3] overflow-hidden bg-muted">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <Play className="h-12 w-12 text-white" />
            </div>
          </div>

          <div className="p-3">
            <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
            <p className="text-muted-foreground text-xs mt-1">{movie.year}</p>
            <p className="text-muted-foreground text-xs">
              {(movie.videoFile.size / 1024 / 1024 / 1024).toFixed(1)} GB
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
