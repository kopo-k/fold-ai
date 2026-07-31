// MutationObserver は 1 インスタンスに集約し、コールバックは必ず debounce する。
// ノードごとの observer 生成は禁止。

const DEFAULT_DEBOUNCE_MS = 200

/** 単純な trailing debounce。 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  waitMs: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  const wrapped = (...args: Parameters<T>): void => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, waitMs)
  }
  wrapped.cancel = (): void => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  return wrapped
}

/**
 * ドキュメント全体の変化を 1 つの MutationObserver で監視する。
 * onChange は debounce 済み。返り値で監視を停止できる。
 * content script の注入タイミングがずれても拾えるよう、初回スキャンも即時に走らせる。
 */
export function observeDocument(onChange: () => void, waitMs = DEFAULT_DEBOUNCE_MS): () => void {
  const debounced = debounce(onChange, waitMs)
  const observer = new MutationObserver(() => debounced())
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })
  // 既存 DOM を初回走査する（document_idle 前提の決め打ちをしない）。
  onChange()
  return () => {
    debounced.cancel()
    observer.disconnect()
  }
}
