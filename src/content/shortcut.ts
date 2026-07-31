// "Alt+Shift+F" 形式のショートカット文字列と KeyboardEvent の照合。

interface ParsedShortcut {
  alt: boolean
  ctrl: boolean
  meta: boolean
  shift: boolean
  key: string
}

/** ショートカット文字列を解析する。空・不正なら null。 */
export function parseShortcut(shortcut: string): ParsedShortcut | null {
  const parts = shortcut
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return null

  const parsed: ParsedShortcut = { alt: false, ctrl: false, meta: false, shift: false, key: '' }
  for (const part of parts) {
    const lower = part.toLowerCase()
    if (lower === 'alt' || lower === 'option') parsed.alt = true
    else if (lower === 'ctrl' || lower === 'control') parsed.ctrl = true
    else if (lower === 'meta' || lower === 'cmd' || lower === 'command') parsed.meta = true
    else if (lower === 'shift') parsed.shift = true
    else parsed.key = lower
  }
  return parsed.key ? parsed : null
}

/** KeyboardEvent がショートカットに一致するか。 */
export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut)
  if (!parsed) return false
  return (
    event.altKey === parsed.alt &&
    event.ctrlKey === parsed.ctrl &&
    event.metaKey === parsed.meta &&
    event.shiftKey === parsed.shift &&
    event.key.toLowerCase() === parsed.key
  )
}
