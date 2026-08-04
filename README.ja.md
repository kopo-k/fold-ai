# fold-ai

> AI チャットの長い回答を折りたたむ。スクロールを減らして見返しを速く。

`fold-ai` は、AI チャットサービス上の回答ごとに折りたたみトグルを差し込み、
長い会話を少ないスクロールで見返せるようにするブラウザ拡張機能です。

- **対応サイト:** ChatGPT / Claude / Gemini（アダプタ方式で追加可能）
- **対応ブラウザ:** Chrome / Edge（Manifest V3）、Firefox、Safari 16.4 以降（macOS / iOS）
- **プライバシー:** 外部通信・テレメトリ・リモート設定なし。会話内容はページの外に出ません。
- **インストール:** [Chrome ウェブストア](https://chromewebstore.google.com/detail/lmhphonmjgjplhimpiipodmlmeefdhgn)
- **ライセンス:** MIT
- **ウェブサイト:** https://kopo-k.github.io/fold-ai/

## 主な機能

- 回答ごとの折りたたみ／展開トグル。Shadow DOM 内に描画するため、ホストページの
  スタイルと干渉しません。
- 指定した行数を超えた回答を自動で折りたたむ（任意）。
- 最新の回答は展開したまま、古い回答だけをたたむ。
- 右端のミニマップ（1回答＝1セグメント）。セグメントをクリックすればスクロールせずに
  その回答を開閉でき、今見ている回答がハイライトされ、ホバーで先頭数行をプレビューします。
- 全体を一括で展開／折りたたむキーボードショートカット。
- サイトごとの有効・無効。

折りたたみは `max-height` + `overflow: hidden` で行い、`display: none` は使いません。
そのため、たたんだ回答でもページ内検索とコピーが引き続き機能します。

## 使い方

導入後、対応サイト（ChatGPT / Claude / Gemini）で会話を開くと、生成が完了した
AI の回答ごとに操作用の UI が追加されます。

- **1つの回答を開閉**：回答の先頭にあるトグルをクリック。矢印で状態が分かります
  （`▾`＝展開中／`▸`＝折りたたみ中）。折りたたみ中も先頭が少しフェード表示されるので
  回答を見分けられます。
- **どこからでも折りたたむ**：右端のミニマップを使います。各セグメントが1回答（長い回答ほど
  高い）で、クリックするとスクロールせずにその場で開閉できます。今見ている回答は
  ハイライトされ、セグメントにホバーすると先頭数行のプレビューが出て、対応するトグルも光ります。
- **全体を一括開閉**：キーボードショートカット（既定 `Alt+Shift+F`）。

### 設定

オプションページ（拡張アイコンを右クリック →「オプション」、または `chrome://extensions`
から）で以下を設定できます。

- 長い回答の**自動折りたたみ**と、その**行数しきい値**
- **最新の回答は折りたたまない**
- **キーボードショートカット**
- **サイトごと**の有効・無効

会話内容がブラウザの外に出ることはありません（通信・解析なし）。

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
