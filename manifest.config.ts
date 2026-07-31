import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

// マニフェスト定義はここを唯一の情報源とする。
// host_permissions / content_scripts.matches は対応サイトと一致させること。
const HOST_MATCHES = [
  'https://chatgpt.com/*',
  'https://chat.openai.com/*',
  'https://claude.ai/*',
  'https://gemini.google.com/*',
  'https://www.perplexity.ai/*',
]

export default defineManifest({
  manifest_version: 3,
  name: 'fold-ai',
  version: pkg.version,
  description: pkg.description,
  // ホスト権限は必要最小限に保つ。<all_urls> や tabs 権限は追加しない。
  permissions: ['storage'],
  host_permissions: HOST_MATCHES,
  content_scripts: [
    {
      matches: HOST_MATCHES,
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  action: {
    default_title: 'fold-ai',
  },
  icons: {
    '16': 'icons/icon-16.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },
})
