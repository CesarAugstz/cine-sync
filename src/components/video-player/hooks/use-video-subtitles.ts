import { useEffect, useRef } from 'react'
import { useSubtitleStore } from '@/stores/subtitle-store'
import { SubtitleTrack } from '@/types/movie'

export function useVideoSubtitles(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  subtitles: SubtitleTrack[],
) {
  const styleRef = useRef<HTMLStyleElement | null>(null)
  const originalTimingsRef = useRef<Map<string, { start: number; end: number }[]>>(new Map())
  const { isEnabled, currentLang, settings, initializeLanguage } = useSubtitleStore()

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
      track.mode = track.language === currentLang && isEnabled ? 'showing' : 'hidden'
    }
  }, [isEnabled, currentLang, subtitles, videoRef])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isEnabled) return

    const applyDelayToTrack = (track: TextTrack) => {
      if (!track.cues) return
      
      const trackId = track.language || 'default'
      let originalTimings = originalTimingsRef.current.get(trackId)
      
      if (!originalTimings) {
        originalTimings = []
        for (let i = 0; i < track.cues.length; i++) {
          const cue = track.cues[i] as VTTCue
          originalTimings.push({ start: cue.startTime, end: cue.endTime })
        }
        originalTimingsRef.current.set(trackId, originalTimings)
      }

      for (let i = 0; i < track.cues.length; i++) {
        const cue = track.cues[i] as VTTCue
        const original = originalTimings[i]
        if (!original) continue
        
        cue.startTime = Math.max(0, original.start + settings.delay)
        cue.endTime = Math.max(0, original.end + settings.delay)
      }
    }

    const handleTrackLoad = (track: TextTrack) => {
      if (track.language !== currentLang) return
      
      if (track.cues && track.cues.length > 0) {
        applyDelayToTrack(track)
      } else {
        track.addEventListener('load', () => applyDelayToTrack(track), { once: true })
      }
    }

    const tracks = video.textTracks
    for (let i = 0; i < tracks.length; i++) {
      handleTrackLoad(tracks[i])
    }
  }, [settings.delay, currentLang, isEnabled, videoRef])

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
