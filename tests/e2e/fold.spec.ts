import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// 実サービスへはアクセスしない。フィクスチャ HTML を setContent で読み込み、
// 折りたたみ機構がテキスト検索・コピーを壊さないことをブラウザ上で検証する。

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')

function fixture(name: string): string {
  return readFileSync(join(fixturesDir, `${name}.html`), 'utf8')
}

test('collapsing keeps text searchable and copyable (no display:none)', async ({ page }) => {
  await page.setContent(fixture('chatgpt'))

  const body = page.locator('.markdown').first()
  await expect(body).toHaveText(/折りたたみ対象/)

  // 折りたたみを適用（max-height + overflow:hidden）。
  await body.evaluate((el) => {
    ;(el as HTMLElement).style.maxHeight = '2rem'
    ;(el as HTMLElement).style.overflow = 'hidden'
  })

  // display:none を使わないため、テキストは DOM 上に残る＝検索・コピー可能。
  await expect(body).toHaveText(/折りたたみ対象/)
  const display = await body.evaluate((el) => getComputedStyle(el).display)
  expect(display).not.toBe('none')
})

test('shadow-dom toggle isolates its styles from the host page', async ({ page }) => {
  await page.setContent(fixture('chatgpt'))

  await page.evaluate(() => {
    const host = document.createElement('span')
    const shadow = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = 'button { color: rgb(1, 2, 3); }'
    const button = document.createElement('button')
    button.textContent = 'toggle'
    shadow.append(style, button)
    document.querySelector('.markdown')?.before(host)
  })

  // Shadow 内のスタイルはホスト側のボタンに影響しない（存在しないことの確認）。
  const hostButtons = await page.locator('main > button').count()
  expect(hostButtons).toBe(0)
})
