// content script のエントリ。アダプタ・設定・DOM 監視を束ねる。
// フレームワークは持ち込まず素の DOM API のみを使う。

import { resolveAdapter, type Adapter } from '@/adapters'
import { PROCESSED_ATTR } from '@/adapters/types'
import { loadSettings, onSettingsChanged } from '@/shared/storage'
import type { Settings } from '@/shared/settings'
import { observeDocument } from './observer'
import { createFold, exceedsThreshold, type FoldHandle } from './fold'
import { createToggle, type ToggleHandle } from './ui/toggle'
import { createMinimap, type MinimapHandle, type MinimapItem } from './ui/minimap'
import { matchesShortcut } from './shortcut'

interface Entry {
  // ミニマップの現在地ハイライト対象を特定するための一意 ID。
  id: string
  el: HTMLElement
  fold: FoldHandle
  // 回答の先頭に置く単一トグル。
  toggle: ToggleHandle
  // keepLastExpanded のために「最新なので展開のままにした」ものを記録する。
  keptExpanded: boolean
}

const entries = new Map<HTMLElement, Entry>()
let adapter: Adapter | null = null
let settings: Settings | null = null
let minimap: MinimapHandle | null = null
let nextEntryId = 0

function siteEnabled(current: Settings): boolean {
  const host = location.host
  // 未知ホストは既定で有効。既知ホストは設定に従う。
  return current.perSiteEnabled[host] !== false
}

interface ApplyOpts {
  /** 折りたたみ時、先頭が画面外なら先頭へスクロール追従する。 */
  scroll?: boolean
  /** 高さをアニメーションさせる（ユーザー操作時のみ true）。 */
  animate?: boolean
}

/**
 * 折りたたみ状態を適用し、トグルの表示も同期する。
 * scroll 指定かつ折りたたみのときは、回答の先頭が画面外（上方）にあれば
 * 先頭へスクロール追従する（畳んだ後に空白へ取り残されないようにする）。
 */
function applyCollapsed(entry: Entry, collapsed: boolean, opts: ApplyOpts = {}): void {
  entry.fold.setCollapsed(collapsed, opts.animate ?? false)
  entry.toggle.setCollapsed(collapsed)
  if (collapsed && opts.scroll) {
    const rect = entry.toggle.host.getBoundingClientRect()
    if (rect.top < 0) entry.toggle.host.scrollIntoView({ block: 'start' })
  }
  refreshMinimap()
}

/** entries から右端ミニマップを再構築する。切り離された回答は間引く。 */
function refreshMinimap(): void {
  if (!minimap) return
  const items: MinimapItem[] = []
  for (const [el, entry] of entries) {
    if (!el.isConnected) {
      // SPA 遷移などで DOM から消えた回答は取り除く。
      entry.toggle.remove()
      entries.delete(el)
      continue
    }
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    items.push({
      key: entry.id,
      collapsed: entry.fold.isCollapsed(),
      ratio: entry.fold.target.scrollHeight || 0,
      label: text.slice(0, 40),
      preview: text.slice(0, 200),
      // ミニマップからの操作: アニメーションあり・スクロールはしない（その場で開閉）。
      onToggle: (next: boolean) => applyCollapsed(entry, next, { animate: true }),
    })
  }
  minimap.render(items)
  updateActiveEntry()
}

/** 現在ビューポートに表示中の回答をミニマップでハイライトする。 */
function updateActiveEntry(): void {
  if (!minimap) return
  // ビューポート上部 35% 付近の線を「読んでいる位置」とみなす。
  const line = window.innerHeight * 0.35
  let activeId: string | null = null
  for (const [el, entry] of entries) {
    if (!el.isConnected) continue
    const rect = el.getBoundingClientRect()
    if (rect.top <= line) {
      activeId = entry.id // 基準線より上に入った回答を順次更新（最後＝現在地）
    } else {
      break // entries は文書順。基準線より下に来たら打ち切る。
    }
  }
  minimap.setActive(activeId)
}

let activeRaf = 0
function scheduleActiveUpdate(): void {
  if (activeRaf) return
  activeRaf = requestAnimationFrame(() => {
    activeRaf = 0
    updateActiveEntry()
  })
}

/** 完了済み・未処理のメッセージにトグルを取り付ける。 */
function scan(): void {
  if (!adapter || !settings || !siteEnabled(settings)) return

  const messages = adapter.findMessages(document)
  const latest = messages.length > 0 ? messages[messages.length - 1] : null

  let added = false
  for (const el of messages) {
    if (el.hasAttribute(PROCESSED_ATTR)) continue
    if (!adapter.isComplete(el)) continue // ストリーミング中は触らない
    attach(el, el === latest)
    added = true
  }
  if (added) refreshMinimap()
}

function attach(el: HTMLElement, isLatest: boolean): void {
  if (!adapter || !settings) return
  const anchor = adapter.anchorFor(el)
  if (!anchor || !anchor.parentNode) return

  el.setAttribute(PROCESSED_ATTR, adapter.id)

  // 高さ測定のため、まず展開状態で取り付ける。
  const fold = createFold(anchor, false)

  // eslint-disable-next-line prefer-const -- entry は onUserToggle から参照するため先に宣言する
  let entry: Entry
  // 先頭トグルからの操作: アニメーションあり＋スクロール追従。
  const onUserToggle = (next: boolean): void =>
    applyCollapsed(entry, next, { scroll: true, animate: true })

  const toggle = createToggle(false, onUserToggle)
  entry = { id: String(nextEntryId++), el, fold, toggle, keptExpanded: false }

  // 回答の先頭（アンカーの直前）にトグルを差し込む。
  anchor.parentNode.insertBefore(toggle.host, anchor)

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
  applyCollapsed(entry, true)
}

function collapsePreviouslyLatest(current: HTMLElement): void {
  if (!settings) return
  for (const [el, entry] of entries) {
    if (el === current) continue
    if (entry.keptExpanded && !entry.fold.isCollapsed()) {
      applyCollapsed(entry, true)
    }
    entry.keptExpanded = false
  }
}

/** 取り付け済みの全メッセージをまとめて折りたたむ／展開する。 */
function toggleAll(collapse: boolean): void {
  for (const entry of entries.values()) applyCollapsed(entry, collapse)
}

/** すべての取り付けを解除し、ホスト DOM を元へ戻す。無効化時に呼ぶ。 */
function teardownAll(): void {
  for (const [el, entry] of entries) {
    entry.toggle.remove()
    entry.fold.release()
    el.removeAttribute(PROCESSED_ATTR)
  }
  entries.clear()
  refreshMinimap()
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

  minimap = createMinimap()
  const stopObserving = observeDocument(scan)
  document.addEventListener('keydown', onKeydown, true)

  // スクロールで現在地ハイライトを更新（rAF で間引く）。capture で
  // ホスト内のスクロールコンテナも拾う。
  window.addEventListener('scroll', scheduleActiveUpdate, { passive: true, capture: true })

  // ウィンドウ幅の変化でミニマップの表示可否・高さが変わるため再描画する。
  window.addEventListener('resize', () => refreshMinimap())

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
