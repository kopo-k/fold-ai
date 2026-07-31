// 設定ページのロジック。options ページ側はフレームワーク制約なしだが、
// 依存を増やさないため素の DOM で実装する。

import { loadSettings, saveSettings, flushSettings } from '@/shared/storage'
import { KNOWN_HOSTS, type Settings } from '@/shared/settings'
import { t } from '@/shared/i18n'

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`missing element #${id}`)
  return el as T
}

function applyLabels(): void {
  document.title = t('optionsTitle')
  $('title').textContent = t('optionsTitle')
  $('label-autoFold').textContent = t('optionsAutoFold')
  $('label-foldThreshold').textContent = t('optionsFoldThreshold')
  $('label-keepLastExpanded').textContent = t('optionsKeepLastExpanded')
  $('label-shortcut').textContent = t('optionsShortcut')
  $('label-perSite').textContent = t('optionsPerSite')
}

function renderPerSite(settings: Settings): void {
  const container = $('per-site')
  container.replaceChildren()
  for (const host of KNOWN_HOSTS) {
    const label = document.createElement('label')
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = settings.perSiteEnabled[host] !== false
    checkbox.dataset.host = host
    checkbox.addEventListener('change', () => {
      settings.perSiteEnabled[host] = checkbox.checked
      persist(settings)
    })
    const text = document.createElement('span')
    text.textContent = host
    label.append(checkbox, text)
    container.append(label)
  }
}

let statusTimer: ReturnType<typeof setTimeout> | null = null
function flashSaved(): void {
  const status = $('status')
  status.textContent = t('optionsSaved')
  if (statusTimer) clearTimeout(statusTimer)
  statusTimer = setTimeout(() => {
    status.textContent = ''
  }, 1500)
}

function persist(settings: Settings): void {
  saveSettings(settings)
  flashSaved()
}

async function init(): Promise<void> {
  applyLabels()
  const settings = await loadSettings()

  const autoFold = $<HTMLInputElement>('autoFold')
  const foldThreshold = $<HTMLInputElement>('foldThreshold')
  const keepLastExpanded = $<HTMLInputElement>('keepLastExpanded')
  const shortcut = $<HTMLInputElement>('shortcut')

  autoFold.checked = settings.autoFold
  foldThreshold.value = String(settings.foldThreshold)
  keepLastExpanded.checked = settings.keepLastExpanded
  shortcut.value = settings.shortcut

  autoFold.addEventListener('change', () => {
    settings.autoFold = autoFold.checked
    persist(settings)
  })
  foldThreshold.addEventListener('change', () => {
    const parsed = Number.parseInt(foldThreshold.value, 10)
    settings.foldThreshold = Number.isFinite(parsed) ? parsed : settings.foldThreshold
    foldThreshold.value = String(settings.foldThreshold)
    persist(settings)
  })
  keepLastExpanded.addEventListener('change', () => {
    settings.keepLastExpanded = keepLastExpanded.checked
    persist(settings)
  })
  shortcut.addEventListener('change', () => {
    settings.shortcut = shortcut.value.trim() || settings.shortcut
    shortcut.value = settings.shortcut
    persist(settings)
  })

  renderPerSite(settings)

  // 離脱時に debounce 待ちを取りこぼさない。
  window.addEventListener('beforeunload', () => {
    void flushSettings()
  })
}

void init()
