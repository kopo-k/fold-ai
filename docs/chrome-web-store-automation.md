# Automating Chrome Web Store releases

Pushing a `v*` tag already builds, packages, and creates a GitHub Release
(`.github/workflows/release.yml`). If you add four repository **Secrets**, the same
workflow will also **upload the zip to the Chrome Web Store and submit it for
review** — no manual upload needed. Without the secrets, the step is skipped and
only the GitHub Release is produced.

This uses the [Chrome Web Store API](https://developer.chrome.com/docs/webstore/using-api)
via `chrome-webstore-upload-cli`.

## One-time setup

You only do this once. It cannot be fully automated because it requires signing
in with your Google account.

### 1. Enable the API and create OAuth credentials

1. Open the [Google Cloud Console](https://console.cloud.google.com/), create (or
   pick) a project.
2. Enable the **Chrome Web Store API**
   (APIs & Services → Library → "Chrome Web Store API" → Enable).
3. Configure the **OAuth consent screen** (External is fine; add yourself as a
   Test user).
4. Create an **OAuth client ID** of type **Desktop app**. Note the
   **Client ID** and **Client secret**.

### 2. Get a refresh token

Run this locally (Node 18+). It opens a browser once for consent and prints a
refresh token:

```bash
npx --yes @plasmohq/chrome-webstore-upload-keys
# or follow: https://github.com/fregante/chrome-webstore-upload/blob/main/How%20to%20generate%20Google%20API%20keys.md
```

Alternatively, the manual flow (auth code → token) is documented in the link
above. The value you need is the **refresh_token**.

### 3. Find your extension ID

It's on the item's page in the
[Developer Dashboard](https://chrome.google.com/webstore/devconsole) and in the
store URL. For fold-ai it is `lmhphonmjgjplhimpiipodmlmeefdhgn`.

### 4. Add GitHub repository Secrets

Repo → Settings → Secrets and variables → Actions → **New repository secret**,
add all four:

| Secret name         | Value                         |
| ------------------- | ----------------------------- |
| `CWS_EXTENSION_ID`  | the extension ID              |
| `CWS_CLIENT_ID`     | OAuth client ID               |
| `CWS_CLIENT_SECRET` | OAuth client secret           |
| `CWS_REFRESH_TOKEN` | the refresh token from step 2 |

## Releasing after setup

Exactly the normal flow (see [release.md](./release.md)):

```bash
npm version patch --no-git-tag-version   # bump package.json
# update CHANGELOG.md
git commit -am "chore(release): vX.Y.Z"
git push origin main
git tag vX.Y.Z && git push origin vX.Y.Z
```

The tag triggers the workflow, which now also uploads to the Chrome Web Store and
submits for review. `--auto-publish` means it publishes automatically **once
Google approves** the review.

## Notes & caveats

- **Review still applies.** Automation removes the manual upload, not Google's
  review time.
- **Secrets never appear in logs.** Never `echo` them in the workflow.
- **To upload without publishing** (submit manually later), remove
  `--auto-publish` from the workflow step — it will upload a new draft version.
- **Firefox / Edge** can be automated similarly later
  (`web-ext sign` for AMO; Edge has its own API), but are not wired up yet.
