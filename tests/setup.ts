// vitest 共通セットアップ。jsdom 環境で不足する API をここで補う。
import { beforeEach, vi } from 'vitest'

// webextension-polyfill が参照する chrome / browser API を最小限モックする。
// storage.sync をメモリ実装にして storage.ts のテストを可能にする。
type Listener = (changes: Record<string, unknown>, area: string) => void

function createStorageMock() {
  const store = new Map<string, unknown>()
  const listeners = new Set<Listener>()
  return {
    store,
    listeners,
    sync: {
      // webextension-polyfill は callback 形式の chrome API を Promise 化する。
      // そのため get/set は末尾 callback を受け取る形にする。
      get: vi.fn((keys: string[] | string, callback: (out: Record<string, unknown>) => void) => {
        const list = Array.isArray(keys) ? keys : [keys]
        const out: Record<string, unknown> = {}
        for (const k of list) if (store.has(k)) out[k] = store.get(k)
        callback(out)
      }),
      set: vi.fn((items: Record<string, unknown>, callback: () => void) => {
        for (const [k, v] of Object.entries(items)) store.set(k, v)
        callback()
      }),
    },
    onChanged: {
      addListener: (fn: Listener) => listeners.add(fn),
      removeListener: (fn: Listener) => listeners.delete(fn),
    },
  }
}

const storage = createStorageMock()

// @ts-expect-error テスト用に最小限の chrome を注入する。
globalThis.chrome = {
  storage,
  runtime: { id: 'test-extension', getManifest: () => ({}) },
}

beforeEach(() => {
  storage.store.clear()
  storage.listeners.clear()
})
