import { describe, it, expect } from 'vitest'
import { DEFAULT_SETTINGS, migrateSettings } from '@/shared/settings'

describe('migrateSettings', () => {
  it('returns defaults for null / non-object input', () => {
    expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(migrateSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(migrateSettings(42)).toEqual(DEFAULT_SETTINGS)
  })

  it('fills missing fields with defaults', () => {
    const result = migrateSettings({ autoFold: false })
    expect(result.autoFold).toBe(false)
    expect(result.foldThreshold).toBe(DEFAULT_SETTINGS.foldThreshold)
    expect(result.keepLastExpanded).toBe(DEFAULT_SETTINGS.keepLastExpanded)
  })

  it('clamps foldThreshold into a sane range', () => {
    expect(migrateSettings({ foldThreshold: 0 }).foldThreshold).toBe(1)
    expect(migrateSettings({ foldThreshold: 9999 }).foldThreshold).toBe(500)
    expect(migrateSettings({ foldThreshold: 12.7 }).foldThreshold).toBe(13)
    expect(migrateSettings({ foldThreshold: Number.NaN }).foldThreshold).toBe(
      DEFAULT_SETTINGS.foldThreshold,
    )
  })

  it('merges perSiteEnabled over defaults and drops nothing known', () => {
    const result = migrateSettings({ perSiteEnabled: { 'claude.ai': false } })
    expect(result.perSiteEnabled['claude.ai']).toBe(false)
    expect(result.perSiteEnabled['chatgpt.com']).toBe(true)
  })

  it('falls back to default shortcut for empty strings', () => {
    expect(migrateSettings({ shortcut: '   ' }).shortcut).toBe(DEFAULT_SETTINGS.shortcut)
    expect(migrateSettings({ shortcut: 'Ctrl+K' }).shortcut).toBe('Ctrl+K')
  })

  it('does not mutate DEFAULT_SETTINGS.perSiteEnabled', () => {
    const result = migrateSettings({ perSiteEnabled: { 'claude.ai': false } })
    result.perSiteEnabled['chatgpt.com'] = false
    expect(DEFAULT_SETTINGS.perSiteEnabled['chatgpt.com']).toBe(true)
  })
})
