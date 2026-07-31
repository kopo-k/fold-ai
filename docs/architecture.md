# Architecture

A short tour of how fold-ai is put together. The authoritative design rules live
in [CLAUDE.md](../CLAUDE.md); this doc is the map.

## Layers

```
content script (src/content/)   ← runs in the page, plain DOM only
        │  uses
        ▼
adapters (src/adapters/)        ← the ONLY place with site-specific selectors
        │
shared (src/shared/)            ← settings, storage, i18n, browser detection
```

### `src/content/`

Runs in the host page's process, so no frameworks — just DOM APIs.

- `index.ts` — entry point. Resolves the adapter for `location.host`, loads
  settings, sets up the observer, and wires the keyboard shortcut.
- `observer.ts` — a **single** debounced `MutationObserver`. Never create one per
  node.
- `fold.ts` — applies/removes folding via inline `max-height` + `overflow:
hidden`. Never `display: none` (that breaks find-in-page and copy). Only adds
  styles and toggles; never deletes, moves, or rewrites host nodes.
- `ui/toggle.ts` — the toggle button, rendered in a **Shadow DOM** so host CSS
  and our CSS can't affect each other. No global stylesheet is ever added.
- `shortcut.ts` — parses/matches the `"Alt+Shift+F"`-style shortcut string.

### `src/adapters/`

Each adapter implements the `Adapter` interface (`types.ts`):

- `matches(host)` — is this the right site?
- `findMessages(root)` — AI-side messages only (exclude user turns).
- `isComplete(el)` — has generation finished? (Streaming answers are left alone.)
- `anchorFor(el)` — where to insert the toggle / what to collapse.

`index.ts` resolves the active adapter from `location.host`.

### `src/shared/`

- `settings.ts` — the single source of truth for settings: types, defaults, and
  `migrateSettings()`.
- `storage.ts` — a debounced wrapper over `browser.storage.sync`. Falls back to
  defaults when storage is unavailable (e.g. Safari before host permission is
  granted).
- `browser.ts` — `isSafari` / `isIOS` detection. Keep branching here, not
  scattered through the code.
- `i18n/` — all user-facing strings.

## Data flow

1. Content script loads → resolve adapter → load settings.
2. Observer fires (debounced) → `scan()` walks `findMessages(document)`.
3. For each **complete**, not-yet-processed message: insert a Shadow-DOM toggle
   before the anchor and apply an initial fold state (auto-fold if the answer
   exceeds the threshold, unless it's the latest and `keepLastExpanded` is on).
4. Toggle clicks and the global shortcut flip `max-height`.

## Invariants (do not break)

- No external network traffic, ever.
- Minimal permissions — no `<all_urls>`, no `tabs`.
- Host DOM is only ever _added to_, never mutated destructively.
- Collapsing uses `max-height`, not `display: none`.
- One MutationObserver, always debounced.
