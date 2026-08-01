// 画面右端に置く回答のミニマップ。1 回答 = 1 セグメント（高さは回答の長さに比例）。
// セグメントをクリックするとその回答をその場で折りたたみ／展開できる（スクロール不要）。
// ホスト CSS と干渉させないため Shadow DOM に閉じ込める。グローバル CSS は追加しない。

export interface MinimapItem {
  /** 一意キー（再描画時の識別用。今は未使用だが将来の差分描画向け）。 */
  key: string
  /** 折りたたみ済みか。 */
  collapsed: boolean
  /** 高さの重み（回答の描画高さ px を想定）。 */
  ratio: number
  /** ツールチップに出す先頭テキスト。 */
  label: string
  /** クリック時に呼ぶ。次の折りたたみ状態を受け取る。 */
  onToggle: (nextCollapsed: boolean) => void
}

export interface MinimapHandle {
  render(items: MinimapItem[]): void
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
@media (prefers-reduced-motion: reduce) {
  .rail,
  button.seg {
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
  shadow.append(style, rail)
  document.body.appendChild(host)

  const render = (items: MinimapItem[]): void => {
    if (items.length < MIN_ITEMS || window.innerWidth < MIN_VIEWPORT_WIDTH) {
      host.style.display = 'none'
      return
    }
    host.style.display = ''

    // 各セグメントの高さを算出し、合計が rail 上限を超えたら比例縮小する。
    const maxRail = window.innerHeight * 0.7
    const gap = 3
    const heights = items.map((it) => clamp(it.ratio * 0.04, 10, 48))
    const total = heights.reduce((a, b) => a + b, 0) + gap * (items.length - 1)
    if (total > maxRail) {
      const f = maxRail / total
      // 縮小時もクリックできる最小高さ(8px)を確保する（フィッツの法則）。
      for (let i = 0; i < heights.length; i++) heights[i] = Math.max(8, heights[i]! * f)
    }

    rail.replaceChildren()
    items.forEach((it, i) => {
      const seg = document.createElement('button')
      seg.type = 'button'
      seg.className = 'seg'
      seg.style.height = `${heights[i]}px`
      seg.dataset.collapsed = String(it.collapsed)
      const action = it.collapsed ? '展開する' : '折りたたむ'
      seg.title = it.label ? `${action}: ${it.label}` : action
      seg.setAttribute('aria-label', seg.title)
      seg.addEventListener('click', (ev) => {
        ev.preventDefault()
        it.onToggle(!it.collapsed)
      })
      rail.appendChild(seg)
    })
  }

  return {
    render,
    destroy() {
      host.remove()
    },
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
