import type { Adapter } from './types'
import { chatgptAdapter } from './chatgpt'
import { claudeAdapter } from './claude'
import { geminiAdapter } from './gemini'
import { perplexityAdapter } from './perplexity'

// 登録済みアダプタ。新サイト対応時はここに追加する。
export const ADAPTERS: readonly Adapter[] = [
  chatgptAdapter,
  claudeAdapter,
  geminiAdapter,
  perplexityAdapter,
]

/** location.host に対応するアダプタを解決する。無ければ null。 */
export function resolveAdapter(host: string): Adapter | null {
  return ADAPTERS.find((adapter) => adapter.matches(host)) ?? null
}

export type { Adapter } from './types'
