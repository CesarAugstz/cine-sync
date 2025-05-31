import { useEffect, useRef } from 'react'
import { useSubtitleStore } from '@/stores/subtitle-store'
import { SubtitleTrack } from '@/types/movie'

export function useVideoSubtitles(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  subtitles: SubtitleTrack[],
) {
  const styleRef = useRef<HTMLStyleElement | null>(null)
  const { isEnabled, currentLang, settings, initializeLanguage } =
    useSubtitleStore()

  useEffect(() => {
    if (!subtitles.length) return
    const availableLanguages = subtitles.map(sub => sub.lang)
    initializeLanguage(availableLanguages)
  }, [subtitles, initializeLanguage])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !subtitles.length) return

    const tracks = video.textTracks
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      track.mode =
        track.language === currentLang && isEnabled ? 'showing' : 'hidden'
    }
  }, [isEnabled, currentLang, subtitles, videoRef])

  useEffect(() => {
    if (styleRef.current) {
      document.head.removeChild(styleRef.current)
      styleRef.current = null
    }

    if (!isEnabled) return

    const style = document.createElement('style')
    style.setAttribute('data-subtitle-styles', 'true')

    const alphaHex = Math.round(settings.opacity * 255)
      .toString(16)
      .padStart(2, '0')

    style.textContent = `
    video::cue {
      font-size: ${settings.fontSize}px !important;
      font-family: "${settings.fontFamily}", sans-serif !important;
      color: ${settings.color} !important;
      background-color: ${settings.backgroundColor}${alphaHex} !important;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8) !important;
      white-space: pre-line !important;
    }
    
    video::cue(.speaker) {
      font-size: ${settings.fontSize}px !important;
      font-family: "${settings.fontFamily}", sans-serif !important;
      color: ${settings.color} !important;
      background-color: ${settings.backgroundColor}${alphaHex} !important;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8) !important;
    }
  `

    document.head.appendChild(style)
    styleRef.current = style

    return () => {
      if (styleRef.current && document.head.contains(styleRef.current)) {
        document.head.removeChild(styleRef.current)
        styleRef.current = null
      }
    }
  }, [settings, isEnabled])

  useEffect(() => {
    return () => {
      if (styleRef.current && document.head.contains(styleRef.current)) {
        document.head.removeChild(styleRef.current)
      }
    }
  }, [])

  return {
    isEnabled,
    currentLang,
    settings,
  }
}
