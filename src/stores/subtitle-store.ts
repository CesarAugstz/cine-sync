import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SubtitleSettings {
  fontSize: number
  fontFamily: string
  color: string
  backgroundColor: string
  opacity: number
}

interface SubtitleStore {
  isEnabled: boolean
  currentLang: string
  settings: SubtitleSettings
  setEnabled: (enabled: boolean) => void
  setCurrentLang: (lang: string) => void
  updateSettings: (settings: Partial<SubtitleSettings>) => void
  initializeLanguage: (availableLanguages: string[]) => void
}

export const useSubtitleStore = create<SubtitleStore>()(
  persist(
    (set, get) => ({
      isEnabled: true,
      currentLang: 'en',
      settings: {
        fontSize: 36,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#000000',
        opacity: 0.7,
      },
      setEnabled: (enabled) => set({ isEnabled: enabled }),
      setCurrentLang: (lang) => set({ currentLang: lang }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      initializeLanguage: (availableLanguages) => {
        const current = get().currentLang
        if (availableLanguages.length > 0 && !availableLanguages.includes(current)) {
          set({ currentLang: availableLanguages[0] })
        }
      },
    }),
    {
      name: 'subtitle-settings',
    }
  )
)
