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
  fold: FoldHandle
  toggle: ToggleHandle
  /** keepLastExpanded のために「最新なので展開のままにした」ものを記録する。 */
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

  const shouldAutoFold = settings.autoFold && exceedsThreshold(anchor, settings.foldThreshold)
  const keptExpanded = isLatest && settings.keepLastExpanded && shouldAutoFold
  const collapsed = shouldAutoFold && !keptExpanded

  const fold = createFold(anchor, collapsed)
  const toggle = createToggle(collapsed, (next) => fold.setCollapsed(next))
  // アンカーの直前にトグルを挿入する（折りたたみでトグル自身が隠れないように）。
  anchor.parentNode.insertBefore(toggle.host, anchor)

  const entry: Entry = { fold, toggle, keptExpanded }
  entries.set(el, entry)

  // 直前まで「最新なので展開」にしていたものは、新しい回答が来た時点で折りたたむ。
  if (isLatest && settings.keepLastExpanded) {
    collapsePreviouslyLatest(el)
  }
}

function collapsePreviouslyLatest(current: HTMLElement): void {
  if (!settings) return
  for (const [el, entry] of entries) {
    if (el === current) continue
    if (entry.keptExpanded && !entry.fold.isCollapsed()) {
      entry.fold.setCollapsed(true)
      entry.toggle.setCollapsed(true)
    }
    entry.keptExpanded = false
  }
}

/** 取り付け済みの全メッセージをまとめて折りたたむ／展開する。 */
function toggleAll(collapse: boolean): void {
  for (const entry of entries.values()) {
    entry.fold.setCollapsed(collapse)
    entry.toggle.setCollapsed(collapse)
  }
}

/** すべての取り付けを解除し、ホスト DOM を元へ戻す。無効化時に呼ぶ。 */
function teardownAll(): void {
  for (const [el, entry] of entries) {
    entry.toggle.remove()
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
