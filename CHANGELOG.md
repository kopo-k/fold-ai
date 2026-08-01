# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project scaffold.
- Per-answer collapse/expand toggle rendered in Shadow DOM.
- Adapters for ChatGPT, Claude, and Gemini.
- Options page with `autoFold`, `foldThreshold`, `keepLastExpanded`, `shortcut`,
  and per-site enable/disable.
- Auto-fold for long answers and a keyboard shortcut to fold/unfold everything.
- A minimap rail on the right edge with one segment per answer (height scaled to
  answer length); click a segment to fold/unfold that answer in place, without
  scrolling. Scroll-follow keeps the answer's top in view when collapsing.
- Vitest unit tests and a Playwright smoke suite against DOM fixtures.
- CI (typecheck / lint / test / build) and packaging scripts.

### Changed

- Scoped support to ChatGPT, Claude, and Gemini (dropped Perplexity for now).
- Lowered the default auto-fold threshold from 20 to 8 lines, and reduced the
  collapsed preview height so folded answers read as clearly collapsed.
- Updated Claude and Gemini adapters to match the sites' current DOM.
