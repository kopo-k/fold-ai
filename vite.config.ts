import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
  server: {
    // 既定ポートが埋まっていても衝突しないよう自動で空きポートを選ぶ。
    port: 5173,
    strictPort: false,
  },
})
