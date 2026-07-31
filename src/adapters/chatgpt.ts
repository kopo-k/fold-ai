import type { Adapter } from './types'

// ChatGPT (chatgpt.com / chat.openai.com)
// アシスタントメッセージは data-message-author-role="assistant" を持つ。
// ストリーミング中はメッセージ要素に data-message-streaming が付く / 完了で消える。

const ASSISTANT_SELECTOR = '[data-message-author-role="assistant"]'

export const chatgptAdapter: Adapter = {
  id: 'chatgpt',

  matches(host) {
    return host === 'chatgpt.com' || host === 'chat.openai.com'
  },

  findMessages(root) {
    return Array.from(root.querySelectorAll<HTMLElement>(ASSISTANT_SELECTOR))
  },

  isComplete(el) {
    // ストリーミング中フラグが立っている間は未完了扱い。
    if (el.getAttribute('data-message-streaming') === 'true') return false
    // 生成完了後に現れるアクションバー（コピー等）を完了シグナルとして併用する。
    const turn = el.closest('[data-testid^="conversation-turn"]') ?? el
    return turn.querySelector('[data-testid="copy-turn-action-button"]') !== null
  },

  anchorFor(el) {
    // メッセージ本文 (.markdown) の直後にトグルを置く。
    return (
      el.querySelector<HTMLElement>('.markdown') ?? (el.firstElementChild as HTMLElement | null)
    )
  },
}
