# Privacy Policy — fold-ai

_Last updated: 2026-08-01_

fold-ai is a browser extension that adds collapse/expand controls to answers on
AI chat sites (ChatGPT, Claude, Gemini). This policy explains what it does and
does not do with your data.

## Summary

**fold-ai does not collect, store, transmit, or share any personal data.** It
makes no network requests of any kind. There is no analytics, no telemetry, and
no remote configuration.

## What is stored, and where

The only data fold-ai stores is your **extension settings** — for example:

- whether long answers auto-fold, and the line threshold for it,
- whether the latest answer stays expanded,
- the keyboard shortcut,
- per-site enable/disable.

These settings are stored using the browser's own `storage.sync` API. They stay
within your browser / your browser account's sync storage and are never sent to
the developer or any third party.

**fold-ai does not read, store, or transmit the contents of your conversations.**

## Permissions

- **`storage`** — to save the settings described above.
- **Host access** to `chatgpt.com`, `chat.openai.com`, `claude.ai`, and
  `gemini.google.com` — solely to detect answer elements on those pages and
  insert the fold/unfold UI. No page content is collected or sent anywhere.

## Data sharing

None. Because no data is collected or transmitted, there is nothing to share,
sell, or disclose.

## Contact

Questions or concerns: please open an issue at
<https://github.com/kopo-k/fold-ai/issues>.
