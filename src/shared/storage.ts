// browser.storage.sync のラッパ。
// Safari は sync の容量・レート制限が厳しいため、書き込みは debounce する。

import browser from 'webextension-polyfill'
import { DEFAULT_SETTINGS, SETTINGS_VERSION, migrateSettings, type Settings } from './settings'

const STORAGE_KEY = 'settings'
const VERSION_KEY = 'settingsVersion'
const WRITE_DEBOUNCE_MS = 400

let writeTimer: ReturnType<typeof setTimeout> | null = null
let pending: Settings | null = null

/** 現在の設定を読み出す。未保存・壊れた値はデフォルトへ正規化する。 */
export async function loadSettings(): Promise<Settings> {
  try {
    const stored = await browser.storage.sync.get([STORAGE_KEY, VERSION_KEY])
    return migrateSettings(stored[STORAGE_KEY])
  } catch (err) {
    // 権限未付与 (Safari) や storage 無効時は静かにデフォルトへフォールバックする。
    console.warn('[fold-ai] loadSettings failed, using defaults', err)
    return { ...DEFAULT_SETTINGS, perSiteEnabled: { ...DEFAULT_SETTINGS.perSiteEnabled } }
  }
}

/** 設定を保存する。連続呼び出しは debounce して 1 回の書き込みにまとめる。 */
export function saveSettings(settings: Settings): void {
  pending = settings
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    void flushSettings()
  }, WRITE_DEBOUNCE_MS)
}

/** debounce を待たずに即時保存する。options ページの離脱時などに使う。 */
export async function flushSettings(): Promise<void> {
  if (writeTimer) {
    clearTimeout(writeTimer)
    writeTimer = null
  }
  if (!pending) return
  const toWrite = pending
  pending = null
  try {
    await browser.storage.sync.set({
      [STORAGE_KEY]: toWrite,
      [VERSION_KEY]: SETTINGS_VERSION,
    })
  } catch (err) {
    console.warn('[fold-ai] saveSettings failed', err)
  }
}

/** 設定変更を購読する。他タブ・options ページからの変更を content 側に反映するのに使う。 */
export function onSettingsChanged(listener: (settings: Settings) => void): () => void {
  const handler = (
    changes: Record<string, browser.Storage.StorageChange>,
    areaName: string,
  ): void => {
    if (areaName !== 'sync') return
    if (!(STORAGE_KEY in changes)) return
    listener(migrateSettings(changes[STORAGE_KEY]?.newValue))
  }
  browser.storage.onChanged.addListener(handler)
  return () => browser.storage.onChanged.removeListener(handler)
}
