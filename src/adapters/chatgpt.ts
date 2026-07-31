import type { Adapter } from './types'

// ChatGPT (chatgpt.com / chat.openai.com)
// アシスタントメッセージは data-message-author-role="assistant" を持つ。
// ストリーミング中は本文に .result-streaming クラス、または
// data-message-streaming="true" が付き、完了で消える。

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
    // ストリーミング中は本文に .result-streaming が付く（最も安定したシグナル）。
    if (el.querySelector('.result-streaming')) return false
    // 明示フラグがある場合はそれも尊重する。
    if (el.getAttribute('data-message-streaming') === 'true') return false
    // ここまで来れば生成は完了とみなす。
    // （コピーボタンは hover 遅延描画があるため完了判定には使わない。）
    return true
  },

  anchorFor(el) {
    // メッセージ本文 (.markdown) の直後にトグルを置く。
    return (
      el.querySelector<HTMLElement>('.markdown') ?? (el.firstElementChild as HTMLElement | null)
    )
  },
}
