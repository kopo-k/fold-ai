// content script のエントリ。アダプタ・設定・DOM 監視を束ねる。
// フレームワークは持ち込まず素の DOM API のみを使う。

import { resolveAdapter, type Adapter } from '@/adapters'
import { PROCESSED_ATTR } from '@/adapters/types'
import { loadSettings, onSettingsChanged } from '@/shared/storage'
import type { Settings } from '@/shared/settings'
import { observeDocument } from './observer'
import { createFold, exceedsThreshold, type FoldHandle } from './fold'
import { createToggle, type ToggleHandle } from './ui/toggle'
import { matchesShortcut } from './shortcut'

interface Entry {
  el: HTMLElement
  fold: FoldHandle
  // 先頭・末尾の 2 つのトグルを持つ。状態は常に同期する。
  toggles: ToggleHandle[]
  // スクロール追従の基準にする先頭トグルのホスト要素。
  topHost: HTMLElement
  // keepLastExpanded のために「最新なので展開のままにした」ものを記録する。
  keptExpanded: boolean
}

const entries = new Map<HTMLElement, Entry>()
let adapter: Adapter | null = null
let settings: Settings | null = null

function siteEnabled(current: Settings): boolean {
  const host = location.host
  // 未知ホストは既定で有効。既知ホストは設定に従う。
  return current.perSiteEnabled[host] !== false
}

/**
 * 折りたたみ状態を適用し、両トグルの表示も同期する。
 * userInitiated かつ折りたたみのときは、回答の先頭が画面外にあれば
 * 先頭へスクロール追従する（末尾のトグルから畳んでも空白に取り残されない）。
 */
function applyCollapsed(entry: Entry, collapsed: boolean, userInitiated: boolean): void {
  entry.fold.setCollapsed(collapsed)
  for (const toggle of entry.toggles) toggle.setCollapsed(collapsed)
  if (collapsed && userInitiated) {
    const rect = entry.topHost.getBoundingClientRect()
    if (rect.top < 0) entry.topHost.scrollIntoView({ block: 'start' })
  }
}

/** 完了済み・未処理のメッセージにトグルを取り付ける。 */
function scan(): void {
  if (!adapter || !settings || !siteEnabled(settings)) return

  const messages = adapter.findMessages(document)
  const latest = messages.length > 0 ? messages[messages.length - 1] : null

  for (const el of messages) {
    if (el.hasAttribute(PROCESSED_ATTR)) continue
    if (!adapter.isComplete(el)) continue // ストリーミング中は触らない
    attach(el, el === latest)
  }
}

function attach(el: HTMLElement, isLatest: boolean): void {
  if (!adapter || !settings) return
  const anchor = adapter.anchorFor(el)
  if (!anchor || !anchor.parentNode) return

  el.setAttribute(PROCESSED_ATTR, adapter.id)

  // 高さ測定のため、まず展開状態で取り付ける。
  const fold = createFold(anchor, false)

  const entry: Entry = {
    el,
    fold,
    toggles: [],
    topHost: document.createElement('span'),
    keptExpanded: false,
  }
  const onUserToggle = (next: boolean): void => applyCollapsed(entry, next, true)

  const topToggle = createToggle(false, onUserToggle)
  const bottomToggle = createToggle(false, onUserToggle)
  entry.toggles = [topToggle, bottomToggle]
  entry.topHost = topToggle.host

  // 先頭（アンカーの直前）と末尾（アンカーの直後）にトグルを差し込む。
  anchor.parentNode.insertBefore(topToggle.host, anchor)
  anchor.parentNode.insertBefore(bottomToggle.host, anchor.nextSibling)

  entries.set(el, entry)

  // レイアウト確定後に自動折りたたみを判定する。
  decideAutoFold(entry, anchor, isLatest)

  // 新しい回答が来たら、直前まで「最新なので展開」にしていたものを折りたたむ。
  if (isLatest && settings.keepLastExpanded) {
    collapsePreviouslyLatest(el)
  }
}

/**
 * 自動折りたたみの判定。未レイアウト（scrollHeight===0）の場合は次フレームで
 * 再試行し、オフスクリーンや描画遅延による取りこぼしを防ぐ。
 */
function decideAutoFold(entry: Entry, anchor: HTMLElement, isLatest: boolean, attempt = 0): void {
  if (!settings || !settings.autoFold) return
  if (anchor.scrollHeight === 0 && attempt < 5) {
    requestAnimationFrame(() => decideAutoFold(entry, anchor, isLatest, attempt + 1))
    return
  }
  if (!exceedsThreshold(anchor, settings.foldThreshold)) return
  if (isLatest && settings.keepLastExpanded) {
    entry.keptExpanded = true // 最新は展開のまま
    return
  }
  applyCollapsed(entry, true, false)
}

function collapsePreviouslyLatest(current: HTMLElement): void {
  if (!settings) return
  for (const [el, entry] of entries) {
    if (el === current) continue
    if (entry.keptExpanded && !entry.fold.isCollapsed()) {
      applyCollapsed(entry, true, false)
    }
    entry.keptExpanded = false
  }
}

/** 取り付け済みの全メッセージをまとめて折りたたむ／展開する。 */
function toggleAll(collapse: boolean): void {
  for (const entry of entries.values()) applyCollapsed(entry, collapse, false)
}

/** すべての取り付けを解除し、ホスト DOM を元へ戻す。無効化時に呼ぶ。 */
function teardownAll(): void {
  for (const [el, entry] of entries) {
    for (const toggle of entry.toggles) toggle.remove()
    entry.fold.release()
    el.removeAttribute(PROCESSED_ATTR)
  }
  entries.clear()
}

function onKeydown(event: KeyboardEvent): void {
  if (!settings || entries.size === 0) return
  if (!matchesShortcut(event, settings.shortcut)) return
  event.preventDefault()
  // 1 つでも展開されていれば全部たたむ。全部たたまれていれば全部開く。
  const anyExpanded = Array.from(entries.values()).some((e) => !e.fold.isCollapsed())
  toggleAll(anyExpanded)
}

async function main(): Promise<void> {
  adapter = resolveAdapter(location.host)
  if (!adapter) return // 対象外ホストでは何もしない

  // 注入が実行され、ホストがアダプタに一致したことを示すパンくず（非破壊・追加のみ）。
  // デバッグ用途: DevTools で `document.documentElement.dataset.foldAi` を確認できる。
  document.documentElement.setAttribute('data-fold-ai', adapter.id)

  settings = await loadSettings()

  // 権限未付与などで設定が取れなくてもデフォルトで動く（loadSettings がフォールバック）。
  if (!siteEnabled(settings)) return

  const stopObserving = observeDocument(scan)
  document.addEventListener('keydown', onKeydown, true)

  onSettingsChanged((next) => {
    const wasEnabled = settings ? siteEnabled(settings) : false
    settings = next
    const nowEnabled = siteEnabled(next)
    if (wasEnabled && !nowEnabled) {
      teardownAll()
    } else if (nowEnabled) {
      scan()
    }
  })

  // ページ遷移（SPA）を跨いでも observer が生き続けるため、明示 teardown は行わない。
  void stopObserving
}

void main()
