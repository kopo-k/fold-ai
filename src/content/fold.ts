// 折りたたみ状態の適用・解除。
// ホストページの DOM を破壊的に変更しない。削除・移動・innerHTML 書き換えは行わず、
// 対象要素へのインラインスタイル付与のみで実現する。
// display:none は使わない（テキスト検索とコピーを壊すため）。max-height + overflow:hidden を使う。

// 折りたたみ時に残す高さ。回答を識別できる程度（最初の1行強）だけ見せる。
const COLLAPSED_MAX_HEIGHT = '2.75rem'
// 折りたたみ時、下端をフェードして「続きがある」ことを視覚的に示す（切り詰めのシグニファイア）。
const FADE_MASK = 'linear-gradient(to bottom, #000 55%, transparent 100%)'

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
  // 復元用に元のインライン値を退避する（mask はベンダープレフィックス両方）。
  const original = {
    maxHeight: target.style.maxHeight,
    overflow: target.style.overflow,
    transition: target.style.transition,
    maskImage: target.style.getPropertyValue('mask-image'),
    webkitMaskImage: target.style.getPropertyValue('-webkit-mask-image'),
  }

  const restoreMask = (): void => {
    setOrRemove(target, 'mask-image', original.maskImage)
    setOrRemove(target, '-webkit-mask-image', original.webkitMaskImage)
  }

  let collapsed = false

  const apply = (next: boolean): void => {
    collapsed = next
    if (next) {
      target.style.overflow = 'hidden'
      target.style.maxHeight = COLLAPSED_MAX_HEIGHT
      target.style.transition = 'max-height 0.15s ease'
      // 下端フェードで続きの存在を示す。
      target.style.setProperty('mask-image', FADE_MASK)
      target.style.setProperty('-webkit-mask-image', FADE_MASK)
    } else {
      target.style.overflow = original.overflow
      target.style.maxHeight = original.maxHeight
      target.style.transition = original.transition
      restoreMask()
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
      restoreMask()
    },
  }
}

/** 値が空なら該当プロパティを削除、非空ならその値を設定する。 */
function setOrRemove(el: HTMLElement, prop: string, value: string): void {
  if (value) el.style.setProperty(prop, value)
  else el.style.removeProperty(prop)
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
