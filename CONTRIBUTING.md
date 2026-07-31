# Contributing to fold-ai

Thanks for your interest in contributing! This document covers the essentials.
For the full design philosophy, read [CLAUDE.md](./CLAUDE.md) — it is the source
of truth for how this project is built.

Language: if you open an issue or PR in Japanese, we'll reply in Japanese; in
English, we'll reply in English.

## Development setup

```bash
pnpm install
pnpm dev        # build to dist/ + watch, load dist/ as an unpacked extension
```

Requirements: Node.js >= 18.18 and pnpm. No proprietary or internal tooling —
`pnpm install && pnpm build` must work for anyone who forks the repo.

## Before you open a PR

Make sure all of these pass:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## PR guidelines

- **One PR, one purpose.** Keep adapter additions separate from core changes.
- **Conventional Commits** for commit messages: `feat:`, `fix:`, `chore:`,
  `docs:`.
- **Keep permissions minimal.** Do not add `<all_urls>`, `tabs`, or any new
  permission without discussing it in an issue first.
- **No new external traffic.** The extension makes zero network requests. PRs
  that add telemetry, analytics, or remote config will not be accepted.
- **New dependencies** must justify necessity, license (MIT / Apache-2.0 / BSD
  only — no GPL), and bundle-size impact in the PR description.

Reviews prioritize three things above feature merit:

1. Is the blast radius contained to the adapter layer?
2. Does it request any new permission?
3. Does it add any external communication?

A PR that touches any of those three should start with a design discussion in an
issue before code review.

## Adding support for a new site

See [docs/adding-a-site.md](./docs/adding-a-site.md). In short:

1. Add a DOM snapshot to `tests/fixtures/<site>.html`.
2. Implement an `Adapter` in `src/adapters/<site>.ts`.
3. Register it in `src/adapters/index.ts`.
4. Add the host to `manifest.config.ts` (`host_permissions` and
   `content_scripts.matches`).
5. Add fixture-based tests in `tests/adapters/`.
