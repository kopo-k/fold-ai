import type { Adapter } from './types'

// Claude (claude.ai) — 実 DOM 2026-08 準拠。
// 構造:
//   .group/message-row[data-is-streaming]
//     .font-claude-response            ← アシスタント応答ラッパ（メッセージ単位・これを折りたたむ）
//       .standard-markdown             ← 本文テキストコンテナ
//         <p class="font-claude-response-body"> …各段落…
//       （図・グラフ(canvas)・成果物などは .standard-markdown の外側に描画されることがある）
// 注意: .font-claude-response-body は「段落ごと」に付くクラスでメッセージ単位ではない。
//       折りたたみは応答ラッパ(.font-claude-response)全体に掛ける。本文だけを対象にすると
//       図(canvas)が外側に残って畳めないため。

const RESPONSE_SELECTOR = '.font-claude-response'
const BODY_SELECTOR = '.standard-markdown'

export const claudeAdapter: Adapter = {
  id: 'claude',

  matches(host) {
    return host === 'claude.ai'
  },

  findMessages(root) {
    // アシスタント応答ラッパ単位で列挙する（ユーザー発言は含まない）。
    const responses = Array.from(root.querySelectorAll<HTMLElement>(RESPONSE_SELECTOR))
    if (responses.length > 0) return responses
    // フォールバック: ラッパが見つからない場合は本文コンテナで代用する。
    return Array.from(root.querySelectorAll<HTMLElement>(BODY_SELECTOR))
  },

  isComplete(el) {
    // ストリーミングフラグを持つ祖先があれば未完了。
    const streaming = el.closest('[data-is-streaming]')
    if (streaming && streaming.getAttribute('data-is-streaming') === 'true') return false
    return true
  },

  anchorFor(el) {
    // 応答ラッパ全体を折りたたみ対象にする（テキストも図(canvas)も一緒に畳む）。
    return el
  },
}
