# Releasing fold-ai

The version is defined once in `package.json` (the manifest reads it via
`manifest.config.ts`). Never edit the version in two places.

## 1. Prepare the release

```bash
# 1. Make sure everything is green.
pnpm typecheck && pnpm lint && pnpm test && pnpm build

# 2. Bump the version (choose one).
npm version patch --no-git-tag-version   # 0.1.0 -> 0.1.1
npm version minor --no-git-tag-version   # 0.1.0 -> 0.2.0
npm version major --no-git-tag-version   # 0.1.0 -> 1.0.0
```

`--no-git-tag-version` just edits `package.json` so we control the commit/tag
ourselves.

Then update `CHANGELOG.md`: move the items under `## [Unreleased]` into a new
`## [x.y.z] - YYYY-MM-DD` section.

## 2. Commit and tag

```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): vX.Y.Z"
git tag vX.Y.Z          # tag name MUST start with "v"
git push origin main
git push origin vX.Y.Z  # pushing the tag triggers the Release workflow
```

## 3. What CI does automatically

Pushing a `v*` tag runs `.github/workflows/release.yml`, which:

1. runs typecheck / lint / test,
2. `pnpm build` + `pnpm package` (creates `artifacts/fold-ai-<version>-chrome.zip`
   and `-firefox.zip`),
3. creates a **GitHub Release** for the tag and attaches both zips.

No third-party actions or secrets are required — it uses the built-in
`GITHUB_TOKEN`.

## 4. Submit to stores (manual)

Store review requires developer accounts, so this step is intentionally manual.
Download the zips from the GitHub Release, then:

- **Chrome Web Store** — upload `…-chrome.zip` in the
  [Developer Dashboard](https://chrome.google.com/webstore/devconsole). Requires a
  one-time registered developer account.
- **Firefox Add-ons (AMO)** — upload `…-firefox.zip` at
  [addons.mozilla.org/developers](https://addons.mozilla.org/developers/).
- **Edge Add-ons** — the Chrome zip works; submit via the Microsoft Partner
  Center.
- **Safari** — distributed through the App Store, so it needs a separate flow:
  run `pnpm build:safari` on macOS, open the Xcode project, archive, and submit
  via App Store Connect (requires an Apple Developer Program membership). Keep
  `MARKETING_VERSION` in sync via `pnpm build:safari` — see
  [safari.md](./safari.md).

## Secrets

Never commit signing certificates, provisioning profiles, or store API keys. If
you later automate store uploads, put credentials in GitHub Secrets and never
echo them into workflow logs.
