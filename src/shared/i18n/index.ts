// ユーザーに表示する文字列はここを経由する。
// 会話内容やホスト固有の情報は一切扱わない。

import { en } from './en'
import { ja } from './ja'

export type MessageKey = keyof typeof en

const CATALOGS: Record<string, Record<MessageKey, string>> = { en, ja }

function resolveLocale(): string {
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en'
  return lang.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

const catalog = CATALOGS[resolveLocale()] ?? en

/** メッセージキーからローカライズ済み文字列を得る。未定義キーはキー名を返す。 */
export function t(key: MessageKey): string {
  return catalog[key] ?? en[key] ?? key
}
