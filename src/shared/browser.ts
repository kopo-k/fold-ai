// ブラウザ差分の判定はここに集約する。
// アダプタや content script のロジックに `if (isSafari)` を散らさないこと。

/**
 * Safari (WebKit の Web Extension) 上で動作しているかの判定。
 * UA ベースの緩い判定に留める。分岐が必要な箇所からのみ参照する。
 */
export const isSafari: boolean = /^((?!chrome|android).)*safari/i.test(
  typeof navigator !== 'undefined' ? navigator.userAgent : '',
)

/** iOS / iPadOS Safari の判定。タッチ前提の UI 調整に使う。 */
export const isIOS: boolean =
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) ||
    // iPadOS はデスクトップ UA を名乗るためタッチ有無で補完する。
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1))
