import { describe, it, expect } from 'vitest'
import { loadSettings, saveSettings, flushSettings } from '@/shared/storage'
import { DEFAULT_SETTINGS } from '@/shared/settings'

describe('storage round-trip', () => {
  it('loads defaults when nothing is stored', async () => {
    const settings = await loadSettings()
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it('persists and reloads settings after flush', async () => {
    saveSettings({ ...DEFAULT_SETTINGS, autoFold: false, foldThreshold: 42 })
    await flushSettings()
    const settings = await loadSettings()
    expect(settings.autoFold).toBe(false)
    expect(settings.foldThreshold).toBe(42)
  })

  it('normalizes corrupted stored values on load', async () => {
    saveSettings({ ...DEFAULT_SETTINGS, foldThreshold: 100000 })
    await flushSettings()
    const settings = await loadSettings()
    expect(settings.foldThreshold).toBe(500)
  })
})
