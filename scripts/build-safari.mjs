// Safari 用ビルド + Xcode プロジェクトへの同期（macOS のみ）。
// dist/ の内容を safari/ 配下のリソースへ同期し、MARKETING_VERSION を合わせる。
// Xcode プロジェクト内の JS / CSS は直接編集しない（このスクリプトが上書きする）。

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

if (process.platform !== 'darwin') {
  console.error('[safari] macOS + Xcode が必要です。このプラットフォームでは実行できません。')
  process.exit(1)
}

const dist = join(root, 'dist')
if (!existsSync(dist)) {
  console.log('[safari] dist/ が無いためビルドします。')
  execSync('pnpm build', { cwd: root, stdio: 'inherit' })
}

const safariDir = join(root, 'safari')
if (!existsSync(safariDir)) {
  // 初回は converter で Xcode プロジェクトを生成する。
  console.log('[safari] safari/ が無いため xcrun safari-web-extension-converter で生成します。')
  execSync(
    `xcrun safari-web-extension-converter "${dist}" --project-location "${safariDir}" --app-name "fold-ai" --bundle-identifier "dev.foldai.extension" --no-open --force`,
    { cwd: root, stdio: 'inherit' },
  )
} else {
  // 既存プロジェクトのリソースへ dist を同期する。
  const resources = join(safariDir, 'fold-ai', 'fold-ai Extension', 'Resources')
  console.log(`[safari] dist/ を ${resources} へ同期します。`)
  execSync(`rsync -a --delete "${dist}/" "${resources}/"`, { cwd: root, stdio: 'inherit' })
}

// バージョンは manifest.config.ts（= package.json）を正として Xcode 側へ反映する。
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
console.log(`[safari] MARKETING_VERSION を ${pkg.version} に合わせてください（Xcode / agvtool）。`)
console.log('[safari] 完了。動作確認は docs/safari.md を参照。')
