// 折りたたみ状態の適用・解除。
// ホストページの DOM を破壊的に変更しない。削除・移動・innerHTML 書き換えは行わず、
// 対象要素へのインラインスタイル付与のみで実現する。
// display:none は使わない（テキスト検索とコピーを壊すため）。max-height + overflow:hidden を使う。

// 折りたたみ時に残す高さ。回答を識別できる程度（最初の1行強）だけ見せる。
const COLLAPSED_MAX_HEIGHT = '2.75rem'
// 折りたたみ時、下端をフェードして「続きがある」ことを視覚的に示す（切り詰めのシグニファイア）。
const FADE_MASK = 'linear-gradient(to bottom, #000 55%, transparent 100%)'
// 開閉アニメーションの時間。
const DURATION_MS = 180

export interface FoldHandle {
  /** 折りたたみ対象の要素。 */
  readonly target: HTMLElement
  isCollapsed(): boolean
  /** animate=true で高さをアニメーションさせる（既定は即時）。 */
  setCollapsed(collapsed: boolean, animate?: boolean): void
  /** インラインスタイルを元に戻す。 */
  release(): void
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
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

  let collapsed = false
  // 進行中アニメーションの後片付けを無効化するためのトークン。
  let animToken = 0

  const setMask = (on: boolean): void => {
    if (on) {
      target.style.setProperty('mask-image', FADE_MASK)
      target.style.setProperty('-webkit-mask-image', FADE_MASK)
    } else {
      setOrRemove(target, 'mask-image', original.maskImage)
      setOrRemove(target, '-webkit-mask-image', original.webkitMaskImage)
    }
  }

  // アニメーションなしで最終状態へ直接適用する。
  const applyInstant = (next: boolean): void => {
    if (next) {
      target.style.overflow = 'hidden'
      target.style.maxHeight = COLLAPSED_MAX_HEIGHT
      target.style.transition = original.transition
      setMask(true)
    } else {
      target.style.overflow = original.overflow
      target.style.maxHeight = original.maxHeight
      target.style.transition = original.transition
      setMask(false)
    }
  }

  // 高さをアニメーションさせて開閉する。
  const animateTo = (next: boolean, fullPx: number): void => {
    const token = ++animToken
    const startHeight = next ? `${fullPx}px` : COLLAPSED_MAX_HEIGHT
    const endHeight = next ? COLLAPSED_MAX_HEIGHT : `${fullPx}px`

    target.style.overflow = 'hidden'
    setMask(true) // アニメ中は常にフェードを出す
    target.style.transition = 'none'
    target.style.maxHeight = startHeight
    void target.offsetHeight // リフローで開始値を確定させる

    target.style.transition = `max-height ${DURATION_MS}ms ease`
    requestAnimationFrame(() => {
      if (token !== animToken) return
      target.style.maxHeight = endHeight
    })

    const settle = (): void => {
      if (token !== animToken) return
      target.removeEventListener('transitionend', settle)
      clearTimeout(timer)
      // 展開後は max-height の制限を外し、以降のコンテンツ増加を妨げない。
      applyInstant(next)
    }
    target.addEventListener('transitionend', settle)
    const timer = setTimeout(settle, DURATION_MS + 60)
  }

  const setCollapsed = (next: boolean, animate = false): void => {
    collapsed = next
    const fullPx = target.scrollHeight
    // レイアウト不能（scrollHeight===0）・低モーション・非アニメ指定は即時。
    if (!animate || prefersReducedMotion() || fullPx === 0) {
      animToken++ // 進行中アニメを無効化
      applyInstant(next)
      return
    }
    animateTo(next, fullPx)
  }

  applyInstant(initialCollapsed)
  collapsed = initialCollapsed

  return {
    target,
    isCollapsed: () => collapsed,
    setCollapsed,
    release() {
      animToken++
      target.style.maxHeight = original.maxHeight
      target.style.overflow = original.overflow
      target.style.transition = original.transition
      setMask(false)
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
