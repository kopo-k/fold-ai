// 注入するトグル UI。ホスト側 CSS と相互影響させないため Shadow DOM に閉じ込める。
// グローバルスタイルシートは追加しない。スタイルは Shadow 内の <style> に限定する。

import { t } from '@/shared/i18n'
import { isIOS } from '@/shared/browser'

export interface ToggleHandle {
  /** Shadow DOM のホスト要素。ホストページへの挿入対象。 */
  readonly host: HTMLElement
  /** 表示状態を折りたたみ/展開へ更新する。 */
  setCollapsed(collapsed: boolean): void
  /** 要素を DOM から取り除く。 */
  remove(): void
}

// iOS Safari のタッチ操作を想定し、ヒット領域は 44x44px 以上を確保する。
const MIN_HIT = 44

const STYLES = `
:host {
  all: initial;
  display: block;
  margin: 4px 0;
  font-family: system-ui, -apple-system, sans-serif;
}
button {
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: ${MIN_HIT}px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.2;
  color: inherit;
  cursor: pointer;
  border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  background: color-mix(in srgb, currentColor 6%, transparent);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
button:hover {
  background: color-mix(in srgb, currentColor 12%, transparent);
}
button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.icon {
  display: inline-block;
  width: 12px;
  text-align: center;
}
/* 折りたたみ中は塗りつぶしで「畳まれている」状態を一目で分かるようにする。 */
:host([data-collapsed='true']) button {
  background: color-mix(in srgb, currentColor 20%, transparent);
  border-color: color-mix(in srgb, currentColor 45%, transparent);
  font-weight: 600;
}
:host([data-collapsed='true']) button:hover {
  background: color-mix(in srgb, currentColor 28%, transparent);
}
${
  // ホバー前提の UI を作らない。タッチ端末では常にヒット領域を広めに。
  isIOS ? 'button { min-width: 44px; }' : ''
}
@media (prefers-reduced-motion: reduce) {
  button {
    transition: none;
  }
}
`

/**
 * トグルボタンを生成する。onToggle は毎クリックで呼ばれ、要求状態を受け取る。
 * 初期状態は collapsed。
 */
export function createToggle(
  collapsed: boolean,
  onToggle: (nextCollapsed: boolean) => void,
): ToggleHandle {
  const host = document.createElement('span')
  host.setAttribute('data-fold-ai-ui', '')
  const shadow = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = STYLES
  shadow.append(style)

  const button = document.createElement('button')
  button.type = 'button'

  const icon = document.createElement('span')
  icon.className = 'icon'
  icon.textContent = '▾'
  icon.setAttribute('aria-hidden', 'true')

  const label = document.createElement('span')
  label.className = 'label'

  button.append(icon, label)
  shadow.append(button)

  let state = collapsed
  const render = (): void => {
    host.setAttribute('data-collapsed', String(state))
    // アイコンの向きで状態を明示する（▾=展開中 / ▸=折りたたみ中）。
    icon.textContent = state ? '▸' : '▾'
    label.textContent = state ? t('toggleUnfold') : t('toggleFold')
    button.setAttribute('aria-expanded', String(!state))
    button.setAttribute('aria-label', state ? t('toggleUnfoldAria') : t('toggleFoldAria'))
  }
  render()

  button.addEventListener('click', (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    state = !state
    render()
    onToggle(state)
  })

  return {
    host,
    setCollapsed(next) {
      state = next
      render()
    },
    remove() {
      host.remove()
    },
  }
}
