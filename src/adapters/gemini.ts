import type { Adapter } from './types'

// Gemini (gemini.google.com)
// 応答は <model-response> カスタム要素。本文は message-content 内。
// 生成中は <model-response> に data-response-complete が無い / false。

const RESPONSE_SELECTOR = 'model-response'

export const geminiAdapter: Adapter = {
  id: 'gemini',

  matches(host) {
    return host === 'gemini.google.com'
  },

  findMessages(root) {
    return Array.from(root.querySelectorAll<HTMLElement>(RESPONSE_SELECTOR))
  },

  isComplete(el) {
    // 生成完了時に data-response-complete="true" が付与される想定。
    return el.getAttribute('data-response-complete') === 'true'
  },

  anchorFor(el) {
    return el.querySelector<HTMLElement>('message-content') ?? el
  },
}
