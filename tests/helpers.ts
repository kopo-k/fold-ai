import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

/** tests/fixtures/<name>.html を読み込む。 */
export function loadFixture(name: string): string {
  return readFileSync(join(here, 'fixtures', `${name}.html`), 'utf8')
}

/** フィクスチャ HTML を document.body に流し込む。 */
export function mountFixture(name: string): void {
  document.body.innerHTML = loadFixture(name)
}
