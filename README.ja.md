# fold-ai

> AI チャットの長い回答を折りたたむ。スクロールを減らして見返しを速く。

`fold-ai` は、AI チャットサービス上の回答ごとに折りたたみトグルを差し込み、
長い会話を少ないスクロールで見返せるようにするブラウザ拡張機能です。

- **対応サイト:** ChatGPT / Claude / Gemini（アダプタ方式で追加可能）
- **対応ブラウザ:** Chrome / Edge（Manifest V3）、Firefox、Safari 16.4 以降（macOS / iOS）
- **プライバシー:** 外部通信・テレメトリ・リモート設定なし。会話内容はページの外に出ません。
- **ライセンス:** MIT

## 主な機能

- 回答ごとの折りたたみ／展開トグル。Shadow DOM 内に描画するため、ホストページの
  スタイルと干渉しません。
- 指定した行数を超えた回答を自動で折りたたむ（任意）。
- 最新の回答は展開したまま、古い回答だけをたたむ。
- 全体を一括で展開／折りたたむキーボードショートカット。
- サイトごとの有効・無効。

折りたたみは `max-height` + `overflow: hidden` で行い、`display: none` は使いません。
そのため、たたんだ回答でもページ内検索とコピーが引き続き機能します。

## 開発ビルドの導入

```bash
pnpm install
pnpm dev        # dist/ にビルドして watch
```

`dist/` を未パッケージ拡張として読み込みます。

- **Chrome / Edge:** `chrome://extensions` を開き、デベロッパーモードを有効化 →
  「パッケージ化されていない拡張機能を読み込む」で `dist/` を選択。
- **Firefox:** `about:debugging#/runtime/this-firefox` →「一時的なアドオンを読み込む」で
  `dist/manifest.json` を選択。
- **Safari:** [docs/safari.md](./docs/safari.md) を参照。

## スクリプト

```bash
pnpm dev            # 開発ビルド + watch
pnpm build          # 本番ビルド（dist/）
pnpm package        # Chrome / Firefox 向け zip を artifacts/ に生成
pnpm build:safari   # Safari ビルド + Xcode 同期（macOS のみ）
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint + prettier --check
pnpm test           # vitest 単体テスト
pnpm test:e2e       # playwright スモークテスト
```

PR を出す前に `pnpm typecheck && pnpm lint && pnpm test` が通ることを確認してください。

## アーキテクチャ

サイト依存のコードは `src/adapters/` の中だけに置きます。詳細な方針は
[CLAUDE.md](./CLAUDE.md)、概要は [docs/architecture.md](./docs/architecture.md) を参照。

新しいサイトへの対応は 4 ステップです。[docs/adding-a-site.md](./docs/adding-a-site.md)
を参照してください。

## コントリビュート

[CONTRIBUTING.md](./CONTRIBUTING.md) と [行動規範](./CODE_OF_CONDUCT.md) を先にお読みください。
脆弱性の報告は公開 Issue ではなく [SECURITY.md](./SECURITY.md) の窓口へお願いします。

## ライセンス

[MIT](./LICENSE)
