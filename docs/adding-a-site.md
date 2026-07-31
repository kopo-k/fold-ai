# Adding support for a new site

Everything site-specific lives in `src/adapters/`. Adding a site is four steps
plus tests, and should not touch the content script.

## 1. Capture a DOM snapshot

Open the site, and copy a representative chunk of the conversation DOM into
`tests/fixtures/<site>.html`. Include:

- at least one **completed** AI answer,
- one **streaming / in-progress** answer,
- one **user** message (so we can prove it's excluded).

Strip any private conversation text.

## 2. Implement the adapter

Create `src/adapters/<site>.ts` implementing the `Adapter` interface:

```ts
import type { Adapter } from './types'

export const exampleAdapter: Adapter = {
  id: 'example',
  matches(host) {
    return host === 'example.ai'
  },
  findMessages(root) {
    // AI-side messages only — never user turns.
    return Array.from(root.querySelectorAll<HTMLElement>('[data-role="assistant"]'))
  },
  isComplete(el) {
    // Return false while streaming.
    return el.getAttribute('data-streaming') !== 'true'
  },
  anchorFor(el) {
    // The block to collapse / where the toggle goes.
    return el.querySelector<HTMLElement>('.answer-body') ?? el
  },
}
```

Keep selectors resilient — prefer stable `data-*` attributes over generated class
names where possible.

## 3. Register it

Add it to the `ADAPTERS` array in `src/adapters/index.ts`.

## 4. Update the manifest

Add the host to **both** `host_permissions` and `content_scripts.matches` in
`manifest.config.ts`. Keep permissions minimal — no `<all_urls>`.

If the site should be listed in the options page toggles, add its host to
`KNOWN_HOSTS` in `src/shared/settings.ts`.

## 5. Add tests

Add fixture-based tests in `tests/adapters/` asserting:

- `findMessages` returns only AI answers (correct count),
- `isComplete` is `true` for finished answers and `false` for streaming ones,
- `anchorFor` points at the expected element.

Then run:

```bash
pnpm typecheck && pnpm lint && pnpm test
```
