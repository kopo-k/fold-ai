import { describe, it, expect, beforeEach } from 'vitest'
import { mountFixture } from '../helpers'
import { resolveAdapter } from '@/adapters'
import { chatgptAdapter } from '@/adapters/chatgpt'
import { claudeAdapter } from '@/adapters/claude'
import { geminiAdapter } from '@/adapters/gemini'
import { perplexityAdapter } from '@/adapters/perplexity'

describe('resolveAdapter', () => {
  it('resolves each known host to the right adapter', () => {
    expect(resolveAdapter('chatgpt.com')?.id).toBe('chatgpt')
    expect(resolveAdapter('chat.openai.com')?.id).toBe('chatgpt')
    expect(resolveAdapter('claude.ai')?.id).toBe('claude')
    expect(resolveAdapter('gemini.google.com')?.id).toBe('gemini')
    expect(resolveAdapter('www.perplexity.ai')?.id).toBe('perplexity')
  })

  it('returns null for unknown hosts', () => {
    expect(resolveAdapter('example.com')).toBeNull()
  })
})

describe('chatgpt adapter', () => {
  beforeEach(() => mountFixture('chatgpt'))

  it('finds only assistant messages (excludes user turns)', () => {
    const messages = chatgptAdapter.findMessages(document)
    expect(messages).toHaveLength(3)
    messages.forEach((m) => expect(m.getAttribute('data-message-author-role')).toBe('assistant'))
  })

  it('detects completion and both streaming signals (flag + result-streaming)', () => {
    const [done, streamingFlag, streamingClass] = chatgptAdapter.findMessages(document)
    expect(chatgptAdapter.isComplete(done!)).toBe(true)
    expect(chatgptAdapter.isComplete(streamingFlag!)).toBe(false)
    expect(chatgptAdapter.isComplete(streamingClass!)).toBe(false)
  })

  it('anchors to the markdown body', () => {
    const [done] = chatgptAdapter.findMessages(document)
    expect(chatgptAdapter.anchorFor(done!)?.classList.contains('markdown')).toBe(true)
  })
})

describe('claude adapter', () => {
  beforeEach(() => mountFixture('claude'))

  it('finds one element per assistant response, not per paragraph', () => {
    const messages = claudeAdapter.findMessages(document)
    // .font-claude-response-body は段落ごとに付くが、拾うのは応答ラッパ単位（2件）。
    expect(messages).toHaveLength(2)
    messages.forEach((m) => expect(m.classList.contains('font-claude-response')).toBe(true))
  })

  it('anchors to the whole markdown body (.standard-markdown), not a paragraph', () => {
    const [done] = claudeAdapter.findMessages(document)
    const anchor = claudeAdapter.anchorFor(done!)
    expect(anchor?.classList.contains('standard-markdown')).toBe(true)
    // 本文コンテナには複数段落が含まれる（＝段落単位ではない）。
    expect(anchor!.querySelectorAll('p').length).toBeGreaterThan(1)
  })

  it('treats data-is-streaming="true" as incomplete', () => {
    const [done, streaming] = claudeAdapter.findMessages(document)
    expect(claudeAdapter.isComplete(done!)).toBe(true)
    expect(claudeAdapter.isComplete(streaming!)).toBe(false)
  })
})

describe('gemini adapter', () => {
  beforeEach(() => mountFixture('gemini'))

  it('finds model responses', () => {
    expect(geminiAdapter.findMessages(document)).toHaveLength(2)
  })

  it('requires data-response-complete="true" for completion', () => {
    const [done, streaming] = geminiAdapter.findMessages(document)
    expect(geminiAdapter.isComplete(done!)).toBe(true)
    expect(geminiAdapter.isComplete(streaming!)).toBe(false)
  })

  it('anchors to message-content', () => {
    const [done] = geminiAdapter.findMessages(document)
    expect(geminiAdapter.anchorFor(done!)?.tagName.toLowerCase()).toBe('message-content')
  })
})

describe('perplexity adapter', () => {
  beforeEach(() => mountFixture('perplexity'))

  it('finds answer blocks', () => {
    expect(perplexityAdapter.findMessages(document)).toHaveLength(2)
  })

  it('treats data-streaming="true" as incomplete', () => {
    const [done, streaming] = perplexityAdapter.findMessages(document)
    expect(perplexityAdapter.isComplete(done!)).toBe(true)
    expect(perplexityAdapter.isComplete(streaming!)).toBe(false)
  })

  it('anchors to the prose body', () => {
    const [done] = perplexityAdapter.findMessages(document)
    expect(perplexityAdapter.anchorFor(done!)?.classList.contains('prose')).toBe(true)
  })
})
