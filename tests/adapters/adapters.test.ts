import { describe, it, expect, beforeEach } from 'vitest'
import { mountFixture } from '../helpers'
import { resolveAdapter } from '@/adapters'
import { chatgptAdapter } from '@/adapters/chatgpt'
import { claudeAdapter } from '@/adapters/claude'
import { geminiAdapter } from '@/adapters/gemini'

describe('resolveAdapter', () => {
  it('resolves each known host to the right adapter', () => {
    expect(resolveAdapter('chatgpt.com')?.id).toBe('chatgpt')
    expect(resolveAdapter('chat.openai.com')?.id).toBe('chatgpt')
    expect(resolveAdapter('claude.ai')?.id).toBe('claude')
    expect(resolveAdapter('gemini.google.com')?.id).toBe('gemini')
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

  it('anchors to the whole response wrapper so figures fold too', () => {
    const [done] = claudeAdapter.findMessages(document)
    const anchor = claudeAdapter.anchorFor(done!)
    // 応答ラッパ全体を対象にする（本文だけだと外側の図が畳めない）。
    expect(anchor?.classList.contains('font-claude-response')).toBe(true)
    // テキスト（複数段落）と図(canvas)の両方を含むこと。
    expect(anchor!.querySelectorAll('p').length).toBeGreaterThan(1)
    expect(anchor!.querySelector('canvas')).not.toBeNull()
  })

  it('treats data-is-streaming="true" as incomplete', () => {
    const [done, streaming] = claudeAdapter.findMessages(document)
    expect(claudeAdapter.isComplete(done!)).toBe(true)
    expect(claudeAdapter.isComplete(streaming!)).toBe(false)
  })
})

describe('gemini adapter', () => {
  beforeEach(() => mountFixture('gemini'))

  it('finds one element per model response', () => {
    expect(geminiAdapter.findMessages(document)).toHaveLength(2)
  })

  it('treats a generating response (blinking cursor) as incomplete', () => {
    const [done, streaming] = geminiAdapter.findMessages(document)
    expect(geminiAdapter.isComplete(done!)).toBe(true)
    expect(geminiAdapter.isComplete(streaming!)).toBe(false)
  })

  it('anchors to the model-response-text body', () => {
    const [done] = geminiAdapter.findMessages(document)
    expect(geminiAdapter.anchorFor(done!)?.classList.contains('model-response-text')).toBe(true)
  })
})
