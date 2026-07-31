import { describe, it, expect, beforeEach } from 'vitest'
import { createFold } from '@/content/fold'
import { parseShortcut, matchesShortcut } from '@/content/shortcut'

describe('createFold', () => {
  let el: HTMLElement
  beforeEach(() => {
    document.body.innerHTML = '<div id="t" style="color: red">content</div>'
    el = document.getElementById('t') as HTMLElement
  })

  it('collapses via max-height + overflow, never display:none', () => {
    const fold = createFold(el, true)
    expect(fold.isCollapsed()).toBe(true)
    expect(el.style.maxHeight).not.toBe('')
    expect(el.style.overflow).toBe('hidden')
    expect(el.style.display).not.toBe('none')
  })

  it('toggles state', () => {
    const fold = createFold(el, false)
    expect(fold.isCollapsed()).toBe(false)
    fold.setCollapsed(true)
    expect(fold.isCollapsed()).toBe(true)
    fold.setCollapsed(false)
    expect(fold.isCollapsed()).toBe(false)
  })

  it('release() restores original inline styles', () => {
    const fold = createFold(el, true)
    fold.release()
    expect(el.style.maxHeight).toBe('')
    expect(el.style.overflow).toBe('')
    // 元から付いていた他のインラインスタイルは保持される。
    expect(el.style.color).toBe('red')
  })
})

describe('shortcut parsing', () => {
  it('parses modifiers and key', () => {
    expect(parseShortcut('Alt+Shift+F')).toEqual({
      alt: true,
      ctrl: false,
      meta: false,
      shift: true,
      key: 'f',
    })
  })

  it('returns null without a main key', () => {
    expect(parseShortcut('Alt+Shift')).toBeNull()
    expect(parseShortcut('')).toBeNull()
  })

  it('matches a keyboard event', () => {
    const ev = new KeyboardEvent('keydown', { key: 'F', altKey: true, shiftKey: true })
    expect(matchesShortcut(ev, 'Alt+Shift+F')).toBe(true)
    expect(matchesShortcut(ev, 'Ctrl+F')).toBe(false)
  })
})
