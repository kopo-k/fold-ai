// 折りたたみ状態の適用・解除。
// ホストページの DOM を破壊的に変更しない。削除・移動・innerHTML 書き換えは行わず、
// 対象要素へのインラインスタイル付与のみで実現する。
// display:none は使わない（テキスト検索とコピーを壊すため）。max-height + overflow:hidden を使う。

const COLLAPSED_MAX_HEIGHT = '5.5rem'

export interface FoldHandle {
  /** 折りたたみ対象の要素。 */
  readonly target: HTMLElement
  isCollapsed(): boolean
  setCollapsed(collapsed: boolean): void
  /** インラインスタイルを元に戻す。 */
  release(): void
}

/**
 * 対象要素に折りたたみ機構を取り付ける。元のインラインスタイルは保持し、
 * release() で完全に復元できるようにする。
 */
export function createFold(target: HTMLElement, initialCollapsed: boolean): FoldHandle {
  // 復元用に元のインライン値を退避する。
  const original = {
    maxHeight: target.style.maxHeight,
    overflow: target.style.overflow,
    transition: target.style.transition,
  }

  let collapsed = false

  const apply = (next: boolean): void => {
    collapsed = next
    if (next) {
      target.style.overflow = 'hidden'
      target.style.maxHeight = COLLAPSED_MAX_HEIGHT
      target.style.transition = 'max-height 0.15s ease'
    } else {
      target.style.overflow = original.overflow
      target.style.maxHeight = original.maxHeight
      target.style.transition = original.transition
    }
  }

  apply(initialCollapsed)

  return {
    target,
    isCollapsed: () => collapsed,
    setCollapsed: apply,
    release() {
      target.style.maxHeight = original.maxHeight
      target.style.overflow = original.overflow
      target.style.transition = original.transition
    },
  }
}

/**
 * 要素の高さが閾値（行数換算）を超えるかを判定する。自動折りたたみの可否に使う。
 * computed line-height が取れない場合は 1.5em を仮定する。
 */
export function exceedsThreshold(target: HTMLElement, thresholdLines: number): boolean {
  const style = getComputedStyle(target)
  let lineHeight = parseFloat(style.lineHeight)
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
    const fontSize = parseFloat(style.fontSize)
    lineHeight = (Number.isFinite(fontSize) ? fontSize : 16) * 1.5
  }
  return target.scrollHeight > lineHeight * thresholdLines
}
