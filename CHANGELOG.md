# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-08-08

### Fixed

- Claude: fold the whole response wrapper so figures and charts (`<canvas>`)
  collapse together with the text, instead of the chart being left visible.

### Changed

- Redesigned the extension icons (rounded indigo with a text-line motif).

## [0.1.0] - 2026-08-01

### Added

- Initial project scaffold.
- Per-answer collapse/expand toggle rendered in Shadow DOM.
- Adapters for ChatGPT, Claude, and Gemini.
- Options page with `autoFold`, `foldThreshold`, `keepLastExpanded`, `shortcut`,
  and per-site enable/disable.
- Auto-fold for long answers and a keyboard shortcut to fold/unfold everything.
- A minimap rail on the right edge with one segment per answer (height scaled to
  answer length); click a segment to fold/unfold that answer in place, without
  scrolling. The segment for the answer you're currently viewing is highlighted,
  and hovering a segment previews its first few lines. Scroll-follow keeps the
  answer's top in view when collapsing.
- Clearer collapse/expand toggle state: a direction arrow (▾ open / ▸ folded), a
  filled style when folded, and a bottom fade on collapsed answers to signal more
  content. Motion respects `prefers-reduced-motion`.
- Vitest unit tests and a Playwright smoke suite against DOM fixtures.
- CI (typecheck / lint / test / build) and packaging scripts.

### Changed

- Scoped support to ChatGPT, Claude, and Gemini (dropped Perplexity for now).
- Lowered the default auto-fold threshold from 20 to 8 lines, and reduced the
  collapsed preview height so folded answers read as clearly collapsed.
- Updated Claude and Gemini adapters to match the sites' current DOM.
