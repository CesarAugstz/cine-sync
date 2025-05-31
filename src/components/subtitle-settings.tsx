'use client'

import { useState } from 'react'
import { Settings, X, Type, Palette } from 'lucide-react'
import { useSubtitleStore } from '@/stores/subtitle-store'
import { SubtitleTrack } from '@/types/movie'


interface SubtitleSettingsProps {
  tracks: SubtitleTrack[]
}

export default function SubtitleSettings({ tracks }: SubtitleSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { currentLang, settings, setCurrentLang, updateSettings } =
    useSubtitleStore()

  const fontFamilies = [
    'Arial',
    'Times New Roman',
    'Helvetica',
    'Georgia',
    'Verdana',
    'Courier New',
  ]
  const colors = [
    '#ffffff',
    '#ffff00',
    '#00ff00',
    '#ff0000',
    '#0000ff',
    '#ff00ff',
    '#00ffff',
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-white hover:text-gray-300 transition-colors"
        title="Subtitle Settings"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-gray-900 text-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Subtitle Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Language
                </label>
                <select
                  value={currentLang}
                  onChange={e => setCurrentLang(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                >
                  {tracks.map(track => (
                    <option
                      key={track.languageTitle ?? track.lang}
                      value={track.lang}
                    >
                      {track.languageTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Font Size: {settings.fontSize}px
                </label>
                <input
                  type="range"
                  min="16"
                  max="48"
                  value={settings.fontSize}
                  onChange={e =>
                    updateSettings({ fontSize: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Font Family
                </label>
                <select
                  value={settings.fontFamily}
                  onChange={e => updateSettings({ fontFamily: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                >
                  {fontFamilies.map(font => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Text Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => updateSettings({ color })}
                      className={`w-8 h-8 rounded border-2 ${
                        settings.color === color
                          ? 'border-white'
                          : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={settings.color}
                  onChange={e => updateSettings({ color: e.target.value })}
                  className="mt-2 w-full h-8 bg-gray-800 border border-gray-700 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Background Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {['#000000', '#333333', '#666666', '#999999', '#ffffff'].map(
                    color => (
                      <button
                        key={color}
                        onClick={() =>
                          updateSettings({ backgroundColor: color })
                        }
                        className={`w-8 h-8 rounded border-2 ${
                          settings.backgroundColor === color
                            ? 'border-white'
                            : 'border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ),
                  )}
                </div>
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={e =>
                    updateSettings({ backgroundColor: e.target.value })
                  }
                  className="mt-2 w-full h-8 bg-gray-800 border border-gray-700 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Background Opacity: {Math.round(settings.opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.opacity}
                  onChange={e =>
                    updateSettings({ opacity: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Preview:</p>
                <div
                  className="p-3 rounded text-center"
                  style={{
                    fontSize: `${settings.fontSize}px`,
                    fontFamily: settings.fontFamily,
                    color: settings.color,
                    backgroundColor: `${settings.backgroundColor}${Math.round(
                      settings.opacity * 255,
                    )
                      .toString(16)
                      .padStart(2, '0')}`,
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  Sample subtitle text
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
