export interface SubtitleFile {
  languageTitle: string
  language: string
  filename: string
  path: string
}

export interface VideoFile {
  filename: string
  path: string
  size: number
  mimeType: string
}

export interface Movie {
  id: string
  directoryName: string
  title: string
  description: string
  year: number
  genre: string[]
  director: string
  cast: string[]
  duration: string
  rating: string
  poster: string
  videoFile: VideoFile
  subtitles: SubtitleFile[]
  createdAt: Date
  modifiedAt: Date
}

export interface SubtitleTrack {
  languageTitle: string
  lang: string
  label: string
  src: string
}
