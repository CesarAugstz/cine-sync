import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'

const MOVIES_DIR = process.env.MOVIES_DIR || '/path/to/your/movies'

const SUPPORTED_FORMATS = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska', 
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm'
}

interface MovieInfo {
  title?: string
  description?: string
  year?: number
  genre?: string[]
  director?: string
  cast?: string[]
  duration?: string
  rating?: string
  poster?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const directories = await fs.readdir(MOVIES_DIR, { withFileTypes: true })
    
    const movieDirectories = directories.filter(dir => dir.isDirectory())
    const movieIndex = parseInt(id)
    
    if (movieIndex < 0 || movieIndex >= movieDirectories.length) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }
    
    const dir = movieDirectories[movieIndex]
    const movieDir = path.join(MOVIES_DIR, dir.name)
    
    const files = await fs.readdir(movieDir)
    
    const videoFile = files.find(file => {
      const ext = path.extname(file).toLowerCase()
      return Object.keys(SUPPORTED_FORMATS).includes(ext)
    })
    
    if (!videoFile) {
      return NextResponse.json({ error: 'No video file found' }, { status: 404 })
    }
    
    const subtitleFiles = files
      .filter(file => file.endsWith('.vtt'))
      .map(file => {
        const lang = file.replace('.vtt', '')
        return {
          languageTitle: getLanguageLabel(lang),
          language: lang,
          filename: file,
          path: path.join(dir.name, file)
        }
      })
    
    let movieInfo: MovieInfo = {}
    const infoPath = path.join(movieDir, 'info.yml')
    
    try {
      const infoContent = await fs.readFile(infoPath, 'utf-8')
      movieInfo = yaml.load(infoContent) as MovieInfo || {}
    } catch (error) {
      console.warn(`No info.yml found for ${dir.name}`)
    }
    
    const videoPath = path.join(movieDir, videoFile)
    const stats = await fs.stat(videoPath)
    const ext = path.extname(videoFile).toLowerCase()

    const movie = {
      id: movieIndex.toString(),
      directoryName: dir.name,
      title: movieInfo.title || dir.name,
      description: movieInfo.description || '',
      year: movieInfo.year || new Date(stats.birthtime).getFullYear(),
      genre: movieInfo.genre || ['Movie'],
      director: movieInfo.director || '',
      cast: movieInfo.cast || [],
      duration: movieInfo.duration || '',
      rating: movieInfo.rating || '',
      poster: movieInfo.poster || '',
      videoFile: {
        filename: videoFile,
        path: path.join(dir.name, videoFile),
        size: stats.size,
        mimeType: SUPPORTED_FORMATS[ext as keyof typeof SUPPORTED_FORMATS]
      },
      subtitles: subtitleFiles,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    }
    
    return NextResponse.json(movie)
  } catch (error) {
    console.error('Error loading movie:', error)
    return NextResponse.json({ error: 'Failed to load movie' }, { status: 500 })
  }
}

function getLanguageLabel(lang: string): string {
  const labels: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese'
  }
  const converted = labels[lang] 
  console.log('converted', {
    lang,
    converted
  })
  if (converted) return converted

  for (const key in labels) {
    if (lang.includes(key))
      return labels[key]
  }

  return lang.toUpperCase()
}
