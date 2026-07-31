// Chrome / Firefox 向けの zip を artifacts/ に生成する。
// 外部依存を増やさないため、システムの `zip` を使う。

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const artifacts = join(root, 'artifacts')

if (!existsSync(dist)) {
  console.error('[package] dist/ not found. Run `pnpm build` first.')
  process.exit(1)
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const version = pkg.version

mkdirSync(artifacts, { recursive: true })

const targets = [`fold-ai-${version}-chrome.zip`, `fold-ai-${version}-firefox.zip`]

for (const name of targets) {
  const out = join(artifacts, name)
  rmSync(out, { force: true })
  // dist の中身をアーカイブのルートに置く。
  execFileSync('zip', ['-r', '-q', out, '.'], { cwd: dist, stdio: 'inherit' })
  console.log(`[package] wrote ${join('artifacts', name)}`)
}
