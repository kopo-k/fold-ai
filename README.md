# fold-ai

> Make long AI chat answers collapsible. Less scrolling, faster review.

`fold-ai` is a browser extension that inserts a collapse/expand toggle on each AI
answer in your chat history, so you can skim long conversations without endless
scrolling.

- **Supported sites:** ChatGPT, Claude, Gemini (adapter-based, easy to extend)
- **Browsers:** Chrome / Edge (Manifest V3), Firefox, Safari 16.4+ (macOS / iOS)
- **Privacy:** no external requests, no telemetry, no remote config. Your conversations never leave the page.
- **License:** MIT

日本語版は [README.ja.md](./README.ja.md) を参照してください。

## Features

- Per-answer collapse/expand toggle, rendered inside a Shadow DOM so it never
  clashes with the host page's styles.
- Optional auto-fold for answers longer than a configurable number of lines.
- Keep the latest answer expanded while collapsing older ones.
- A keyboard shortcut to expand/collapse everything at once.
- Per-site enable/disable.

Folding uses `max-height` + `overflow: hidden` — never `display: none` — so page
search and copy keep working on collapsed answers.

## Install (development build)

```bash
pnpm install
pnpm dev        # builds to dist/ and watches
```

Then load `dist/` as an unpacked extension:

- **Chrome / Edge:** open `chrome://extensions`, enable Developer mode, click
  "Load unpacked", and select `dist/`.
- **Firefox:** open `about:debugging#/runtime/this-firefox`, click "Load
  Temporary Add-on", and select `dist/manifest.json`.
- **Safari:** see [docs/safari.md](./docs/safari.md).

## Scripts

```bash
pnpm dev            # dev build + watch
pnpm build          # production build to dist/
pnpm package        # zip Chrome / Firefox builds into artifacts/
pnpm build:safari   # Safari build + Xcode project sync (macOS only)
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint + prettier --check
pnpm test           # vitest unit tests
pnpm test:e2e       # playwright smoke tests against fixtures
```

Before opening a PR, make sure `pnpm typecheck && pnpm lint && pnpm test` passes.

## Architecture

Site-specific knowledge lives only in `src/adapters/`. Everything else is
site-agnostic. See [CLAUDE.md](./CLAUDE.md) for the full design guidelines and
[docs/architecture.md](./docs/architecture.md) for an overview.

Adding a new site is four small steps — see
[docs/adding-a-site.md](./docs/adding-a-site.md).

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) and
our [Code of Conduct](./CODE_OF_CONDUCT.md) first. Security issues should be
reported privately — see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
