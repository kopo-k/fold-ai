// 画面右端に置く回答のミニマップ。1 回答 = 1 セグメント（高さは回答の長さに比例）。
// セグメントをクリックするとその回答をその場で折りたたみ／展開できる（スクロール不要）。
// 現在表示中の回答をハイライトし、ホバーで先頭数行のプレビューを出す。
// ホスト CSS と干渉させないため Shadow DOM に閉じ込める。グローバル CSS は追加しない。

export interface MinimapItem {
  /** 一意キー（現在地ハイライトの対象特定に使う）。 */
  key: string
  /** 折りたたみ済みか。 */
  collapsed: boolean
  /** 高さの重み（回答の描画高さ px を想定）。 */
  ratio: number
  /** ツールチップに出す先頭テキスト。 */
  label: string
  /** ホバー時に出す先頭数行のプレビュー。 */
  preview: string
  /** クリック時に呼ぶ。次の折りたたみ状態を受け取る。 */
  onToggle: (nextCollapsed: boolean) => void
}

export interface MinimapHandle {
  render(items: MinimapItem[]): void
  /** 現在表示中の回答（key）をハイライトする。null で解除。 */
  setActive(key: string | null): void
  destroy(): void
}

// 2 件未満・狭い画面では出さない。
const MIN_ITEMS = 2
const MIN_VIEWPORT_WIDTH = 768

const STYLES = `
:host {
  all: initial;
  position: fixed;
  top: 50%;
  /* ブラウザ／サイトのスクロールバーと重ならないよう内側へ寄せる。 */
  right: 18px;
  transform: translateY(-50%);
  z-index: 2147483646;
  font-family: system-ui, -apple-system, sans-serif;
}
.rail {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  padding: 6px 4px;
  border-radius: 10px;
  background: color-mix(in srgb, currentColor 6%, transparent);
  opacity: 0.7;
  transition: opacity 0.15s ease;
}
.rail:hover {
  opacity: 1;
  background: color-mix(in srgb, currentColor 12%, transparent);
}
button.seg {
  all: unset;
  box-sizing: border-box;
  display: block;
  width: 7px;
  border-radius: 4px;
  cursor: pointer;
  background: color-mix(in srgb, currentColor 45%, transparent);
  transition:
    width 0.12s ease,
    background 0.12s ease;
  /* タッチ／クリックのヒット領域を上下左右に広げる（見た目は細いまま）。 */
  position: relative;
}
button.seg::after {
  content: '';
  position: absolute;
  inset: -4px -10px;
}
button.seg[data-collapsed='true'] {
  background: color-mix(in srgb, currentColor 75%, transparent);
}
button.seg:hover,
button.seg:focus-visible {
  width: 16px;
  background: currentColor;
  outline: none;
}
/* 現在表示中の回答を示すハイライト（現在地）。 */
button.seg[data-active='true'] {
  width: 16px;
  background: currentColor;
  box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 35%, transparent);
}
.preview {
  position: fixed;
  max-width: 300px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.45;
  color: canvastext;
  background: canvas;
  border: 1px solid color-mix(in srgb, canvastext 20%, transparent);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s ease;
}
.preview[data-show='true'] {
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .rail,
  button.seg,
  .preview {
    transition: none;
  }
}
`

export function createMinimap(): MinimapHandle {
  const host = document.createElement('div')
  host.setAttribute('data-fold-ai-minimap', '')
  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = STYLES
  const rail = document.createElement('div')
  rail.className = 'rail'
  rail.setAttribute('role', 'group')
  rail.setAttribute('aria-label', 'fold-ai minimap')
  const preview = document.createElement('div')
  preview.className = 'preview'
  shadow.append(style, rail, preview)
  document.body.appendChild(host)

  let segments: HTMLElement[] = []

  const showPreview = (seg: HTMLElement, text: string): void => {
    if (!text) return
    const rect = seg.getBoundingClientRect()
    preview.textContent = text
    // セグメントの左側に、縦位置を揃えて出す。
    preview.style.top = `${Math.max(8, rect.top)}px`
    preview.style.right = `${window.innerWidth - rect.left + 8}px`
    preview.dataset.show = 'true'
  }
  const hidePreview = (): void => {
    preview.dataset.show = 'false'
  }

  const render = (items: MinimapItem[]): void => {
    hidePreview()
    if (items.length < MIN_ITEMS || window.innerWidth < MIN_VIEWPORT_WIDTH) {
      host.style.display = 'none'
      segments = []
      return
    }
    host.style.display = ''

    // 各セグメントの高さを算出し、合計が rail 上限を超えたら比例縮小する。
    const maxRail = window.innerHeight * 0.7
    const gap = 4
    const heights = items.map((it) => clamp(it.ratio * 0.04, 10, 48))
    const total = heights.reduce((a, b) => a + b, 0) + gap * (items.length - 1)
    if (total > maxRail) {
      const f = maxRail / total
      // 縮小時もクリックできる最小高さ(8px)を確保する（フィッツの法則）。
      for (let i = 0; i < heights.length; i++) heights[i] = Math.max(8, heights[i]! * f)
    }

    rail.replaceChildren()
    segments = items.map((it, i) => {
      const seg = document.createElement('button')
      seg.type = 'button'
      seg.className = 'seg'
      seg.style.height = `${heights[i]}px`
      seg.dataset.key = it.key
      seg.dataset.collapsed = String(it.collapsed)
      const action = it.collapsed ? '展開する' : '折りたたむ'
      seg.title = it.label ? `${action}: ${it.label}` : action
      seg.setAttribute('aria-label', seg.title)
      seg.addEventListener('click', (ev) => {
        ev.preventDefault()
        it.onToggle(!it.collapsed)
      })
      seg.addEventListener('mouseenter', () => showPreview(seg, it.preview))
      seg.addEventListener('focus', () => showPreview(seg, it.preview))
      seg.addEventListener('mouseleave', hidePreview)
      seg.addEventListener('blur', hidePreview)
      rail.appendChild(seg)
      return seg
    })
  }

  const setActive = (key: string | null): void => {
    for (const seg of segments) {
      seg.dataset.active = String(key !== null && seg.dataset.key === key)
    }
  }

  return {
    render,
    setActive,
    destroy() {
      host.remove()
    },
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
