import type { Adapter } from './types'

// Perplexity (www.perplexity.ai)
// 回答本文は [data-testid="answer"] のブロック。
// 生成中は同ブロックに data-streaming="true" が付く想定。

const ANSWER_SELECTOR = '[data-testid="answer"]'

export const perplexityAdapter: Adapter = {
  id: 'perplexity',

  matches(host) {
    return host === 'www.perplexity.ai'
  },

  findMessages(root) {
    return Array.from(root.querySelectorAll<HTMLElement>(ANSWER_SELECTOR))
  },

  isComplete(el) {
    return el.getAttribute('data-streaming') !== 'true'
  },

  anchorFor(el) {
    return el.querySelector<HTMLElement>('.prose') ?? el
  },
}
