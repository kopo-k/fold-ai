import type { Adapter } from './types'

// Claude (claude.ai)
// アシスタントメッセージは .font-claude-message を持つ。
// ストリーミング中は祖先に data-is-streaming="true" が付く。

const ASSISTANT_SELECTOR = '.font-claude-message'

export const claudeAdapter: Adapter = {
  id: 'claude',

  matches(host) {
    return host === 'claude.ai'
  },

  findMessages(root) {
    return Array.from(root.querySelectorAll<HTMLElement>(ASSISTANT_SELECTOR))
  },

  isComplete(el) {
    // ストリーミングフラグを持つ祖先があれば未完了。
    const streaming = el.closest('[data-is-streaming]')
    if (streaming && streaming.getAttribute('data-is-streaming') === 'true') return false
    return true
  },

  anchorFor(el) {
    return el
  },
}
