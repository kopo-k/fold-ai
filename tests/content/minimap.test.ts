import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMinimap, type MinimapItem } from '@/content/ui/minimap'

function item(over: Partial<MinimapItem> = {}): MinimapItem {
  return {
    key: 'k',
    collapsed: false,
    ratio: 300,
    label: 'answer text',
    onToggle: vi.fn(),
    ...over,
  }
}

function segments(host: HTMLElement): HTMLElement[] {
  return Array.from(host.shadowRoot!.querySelectorAll<HTMLElement>('button.seg'))
}

describe('minimap', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders one segment per item', () => {
    const map = createMinimap()
    const host = document.querySelector<HTMLElement>('[data-fold-ai-minimap]')!
    map.render([item(), item(), item()])
    expect(segments(host)).toHaveLength(3)
    expect(host.style.display).not.toBe('none')
    map.destroy()
  })

  it('hides itself when there are fewer than 2 answers', () => {
    const map = createMinimap()
    const host = document.querySelector<HTMLElement>('[data-fold-ai-minimap]')!
    map.render([item()])
    expect(host.style.display).toBe('none')
    map.destroy()
  })

  it('marks collapsed segments and toggles on click', () => {
    const map = createMinimap()
    const host = document.querySelector<HTMLElement>('[data-fold-ai-minimap]')!
    const onToggle = vi.fn()
    map.render([item({ collapsed: true, onToggle }), item()])
    const [first] = segments(host)
    expect(first!.dataset.collapsed).toBe('true')
    first!.click()
    // collapsed=true をクリック → 次状態 false を要求する。
    expect(onToggle).toHaveBeenCalledWith(false)
    map.destroy()
  })

  it('destroy removes the host from the document', () => {
    const map = createMinimap()
    expect(document.querySelector('[data-fold-ai-minimap]')).not.toBeNull()
    map.destroy()
    expect(document.querySelector('[data-fold-ai-minimap]')).toBeNull()
  })
})
