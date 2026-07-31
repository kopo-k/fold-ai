import type { Adapter } from './types'

// Claude (claude.ai)
// アシスタント回答の本文は .font-claude-response-body。
// （旧 .font-claude-message は廃止。実 DOM 2026-08 時点。）
// ストリーミング中は祖先に data-is-streaming="true" が付く。

const ASSISTANT_SELECTOR = '.font-claude-response-body'

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
    // 本文全体（.font-claude-response-body）を折りたたみ対象にする。
    return el
  },
}
