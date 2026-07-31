import type { Adapter } from './types'

// Gemini (gemini.google.com) — 実 DOM 2026-08 準拠。
// 構造（アシスタント応答）:
//   <model-response>
//     .presented-response-container
//       .response-container-content
//         .model-response-text   ← 回答本文（これを折りたたむ。1 応答 = 1 つ）
//           .markdown-main-panel > .md-content.markdown > <p> …
// ユーザー発言(<user-query>)は .model-response-text を持たないため自然に除外される。

const BODY_SELECTOR = '.model-response-text'
// 生成中インジケータの候補（実サイトで表記揺れがあるため複数用意）。
const GENERATING_SELECTOR = '.blinking-cursor, [data-is-loading="true"], .loading-indicator'

export const geminiAdapter: Adapter = {
  id: 'gemini',

  matches(host) {
    return host === 'gemini.google.com'
  },

  findMessages(root) {
    return Array.from(root.querySelectorAll<HTMLElement>(BODY_SELECTOR))
  },

  isComplete(el) {
    // 生成中インジケータが応答内にあれば未完了扱い（ストリーミング中は触らない）。
    const container = el.closest('.presented-response-container') ?? el
    if (container.querySelector(GENERATING_SELECTOR)) return false
    // 本文が空でなければ完了とみなす（best-effort）。
    return (el.textContent ?? '').trim().length > 0
  },

  anchorFor(el) {
    // 回答本文（.model-response-text）全体を折りたたみ対象にする。
    // アクションフッタ（コピー等）はこの外側にあるため隠れない。
    return el
  },
}
