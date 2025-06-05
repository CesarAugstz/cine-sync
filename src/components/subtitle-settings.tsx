'use client'

import { useState } from 'react'
import { Settings, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useSubtitleStore } from '@/stores/subtitle-store'
import { SubtitleTrack } from '@/types/movie'


interface SubtitleSettingsProps {
  tracks: SubtitleTrack[]
}

export default function SubtitleSettings({ tracks }: SubtitleSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const {
    isEnabled,
    currentLang,
    settings,
    setEnabled,
    setCurrentLang,
    updateSettings,
    adjustDelay,
    resetDelay,
  } = useSubtitleStore()

  const fontFamilies = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana']
  const colors = ['#ffffff', '#ffff00', '#00ff00', '#ff0000', '#0000ff', '#ff00ff']
  const backgroundColors = ['#000000', '#ffffff', '#808080', '#ff0000', '#00ff00', '#0000ff']

  const delayButtons = [
    { label: '-2s', value: -2 },
    { label: '-0.5s', value: -0.5 },
    { label: '-0.2s', value: -0.2 },
    { label: '+0.2s', value: 0.2 },
    { label: '+0.5s', value: 0.5 },
    { label: '+2s', value: 2 },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-gray-300 hover:bg-white/10 transition-colors"
        >
          <Settings size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subtitle Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="subtitle-toggle">Enable Subtitles</Label>
            <Switch
              id="subtitle-toggle"
              checked={isEnabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {tracks.length > 0 && (
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={currentLang} onValueChange={setCurrentLang}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {tracks.map((track) => (
                    <SelectItem key={track.lang} value={track.lang}>
                      {track.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Subtitle Timing</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetDelay}
                className="text-gray-400 hover:text-white h-8 px-2"
              >
                <RotateCcw size={14} className="mr-1" />
                Reset
              </Button>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-400">
                Current delay: {settings.delay > 0 ? '+' : ''}{settings.delay}s
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {delayButtons.map((button) => (
                <Button
                  key={button.label}
                  variant="outline"
                  size="sm"
                  onClick={() => adjustDelay(button.value)}
                  className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-xs"
                >
                  {button.label}
                </Button>
              ))}
            </div>
            <div className="text-xs text-gray-500 text-center">
              Negative values advance subtitles, positive values delay them
            </div>
          </div>

          <div className="space-y-2">
            <Label>Font Size: {settings.fontSize}px</Label>
            <Slider
              value={[settings.fontSize]}
              onValueChange={(value) => updateSettings({ fontSize: value[0] })}
              min={16}
              max={48}
              step={2}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select value={settings.fontFamily} onValueChange={(fontFamily) => updateSettings({ fontFamily })}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {fontFamilies.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Text Color</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => updateSettings({ color })}
                  className={`w-8 h-8 rounded border-2 ${
                    settings.color === color ? 'border-white' : 'border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex flex-wrap gap-2">
              {backgroundColors.map((color) => (
                <button
                  key={color}
                  onClick={() => updateSettings({ backgroundColor: color })}
                  className={`w-8 h-8 rounded border-2 ${
                    settings.backgroundColor === color ? 'border-white' : 'border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Background Opacity: {Math.round(settings.opacity * 100)}%</Label>
            <Slider
              value={[settings.opacity * 100]}
              onValueChange={(value) => updateSettings({ opacity: value[0] / 100 })}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <Label className="text-sm text-gray-400 mb-2 block">Preview</Label>
            <div 
              className="text-center p-2 rounded"
              style={{
                fontSize: `${settings.fontSize * 0.5}px`,
                fontFamily: settings.fontFamily,
                color: settings.color,
                backgroundColor: `${settings.backgroundColor}${Math.round(settings.opacity * 255).toString(16).padStart(2, '0')}`,
              }}
            >
              Sample subtitle text
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
