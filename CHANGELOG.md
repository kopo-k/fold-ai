# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project scaffold.
- Per-answer collapse/expand toggle rendered in Shadow DOM.
- Adapters for ChatGPT, Claude, Gemini, and Perplexity.
- Options page with `autoFold`, `foldThreshold`, `keepLastExpanded`, `shortcut`,
  and per-site enable/disable.
- Auto-fold for long answers and a keyboard shortcut to fold/unfold everything.
- Vitest unit tests and a Playwright smoke suite against DOM fixtures.
- CI (typecheck / lint / test / build) and packaging scripts.
