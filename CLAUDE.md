# CLAUDE.md

このファイルは Claude Code / Claude が本リポジトリで作業するときの前提知識です。
コードを書く前に必ず読み、ここに書かれた方針から外れる変更は事前に理由を提示してください。

## プロジェクト概要

`fold-ai` は、AI チャットサービス上の長い回答を折りたたみ可能にするブラウザ拡張機能です。
回答ごとにトグルを差し込み、閲覧履歴のスクロール量を減らすことを目的にしています。

- ライセンス: MIT
- 対象ブラウザ: Chrome / Edge (Manifest V3)、Firefox、Safari 16.4 以降 (macOS / iOS)
- API 呼び出しは `webextension-polyfill` の `browser.*` に統一する（`chrome.*` を直接使わない）
- 対応サイト: ChatGPT / Claude / Gemini / Perplexity（アダプタ方式で追加可能）
- 外部通信は一切行わない。テレメトリ・解析・リモート設定を追加しないこと

## 開発コマンド

```bash
pnpm install          # 依存関係のインストール
pnpm dev              # 開発ビルド + watch（dist/ を chrome://extensions で読み込む）
pnpm build            # 本番ビルド（dist/）
pnpm package          # Chrome / Firefox 向けの zip を artifacts/ に生成
pnpm build:safari     # Safari 用ビルド + Xcode プロジェクトへの同期（macOS のみ）
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint + prettier --check
pnpm test             # vitest（ロジックの単体テスト）
pnpm test:e2e         # playwright（実サイトを模したフィクスチャに対するスモーク）
```

PR を出す前に `pnpm typecheck && pnpm lint && pnpm test` が通ることを確認してください。

## ディレクトリ構成

```
src/
  content/          content script のエントリと DOM 操作
    observer.ts     MutationObserver によるメッセージ検出
    fold.ts         折りたたみ状態の適用・解除
    ui/             Shadow DOM 内に描画するトグル UI
  adapters/         サイトごとの差分を吸収する層
    types.ts        Adapter インターフェース定義
    chatgpt.ts
    claude.ts
    gemini.ts
    perplexity.ts
    index.ts        location.host からアダプタを解決
  options/          設定ページ（設定項目はここに集約）
  shared/
    storage.ts      chrome.storage.sync のラッパ
    settings.ts     設定の型とデフォルト値
manifest.config.ts  マニフェスト定義（ここを唯一の情報源とする）
safari/             Xcode プロジェクト（生成物。手で編集するのは設定ファイルのみ）
tests/
  fixtures/         各サイトの DOM スナップショット（HTML）
.github/
  workflows/        CI（typecheck / lint / test / build）
  ISSUE_TEMPLATE/   バグ報告・サイト対応リクエストのテンプレート
docs/               利用者向け・コントリビュータ向けドキュメント
```

## アーキテクチャの原則

1. **サイト依存のコードは `src/adapters/` の外に置かない。** セレクタや DOM 構造の前提を
   `content/` に直接書くと、1 サイトの UI 変更で全体が壊れます。
2. **content script にフレームワークを持ち込まない。** ホストページと同一プロセスで動くため、
   React / Vue などは読み込みコストと衝突リスクに見合いません。素の DOM API を使います。
   options ページ側は制約なし。
3. **注入する UI は必ず Shadow DOM に閉じ込める。** ホスト側の CSS と相互に影響させないこと。
   グローバルなスタイルシートの追加は禁止。
4. **ホストページの DOM を破壊的に変更しない。** 既存ノードの削除・移動・innerHTML の書き換えは
   行わず、追加とクラス付与のみで実現します。折りたたみは `max-height` + `overflow: hidden` で行い、
   `display: none` は使わない（テキスト検索とコピーを壊すため）。
5. **ストリーミング中の回答には手を出さない。** 生成完了を検知してからトグルを差し込みます。
   完了判定はアダプタ側の責務です。
6. **MutationObserver は 1 インスタンスに集約し、コールバックは必ず debounce する。**
   ノードごとの observer 生成は禁止。

## 新しいサイトへの対応を追加する手順

1. `tests/fixtures/<site>.html` に実際の DOM スナップショットを追加する。
2. `src/adapters/<site>.ts` に `Adapter` を実装する。実装するのは以下だけです。
   - `matches(host)`: 対象ホストの判定
   - `findMessages(root)`: AI 側メッセージ要素の列挙（ユーザー発言は除外する）
   - `isComplete(el)`: 生成完了の判定
   - `anchorFor(el)`: トグルを挿入する位置
3. `src/adapters/index.ts` に登録する。
4. `manifest.config.ts` の `host_permissions` と `content_scripts.matches` に追記する。
5. フィクスチャに対するテストを `tests/adapters/` に追加する。

権限は必要最小限に保ってください。`<all_urls>` や `tabs` 権限の追加は行わないこと。

## Safari 対応

Safari は同じ Web Extensions API を使いますが、配布形態が Chrome / Firefox と大きく異なります。

- 拡張機能は **macOS / iOS アプリに同梱する形でしか配布できない**。`safari/` の Xcode プロジェクトが
  そのラッパーで、`xcrun safari-web-extension-converter` で生成したものをリポジトリに含めています。
- ビルドには macOS + Xcode が必要。CI の Safari ジョブは `macos-latest` ランナーで動かす。
- `dist/` の内容を `safari/` 配下のリソースへ同期するのが `pnpm build:safari` の役割です。
  Xcode プロジェクト内の JS / CSS を直接編集しないこと（次回ビルドで上書きされます）。

実装時に踏みやすい差分:

- **ホスト権限はユーザーが手動で許可するまで付与されない。** 権限がない状態を正常系として扱い、
  未許可なら何もせず静かに終了する。エラーダイアログを出さないこと。
- **`browser.*` の Promise ベース API のみを使う。** Safari には `chrome.*` のコールバック形式が
  一部存在しないものがあります。polyfill を経由すれば両対応になります。
- **`storage.sync` の容量とレート制限が他ブラウザより厳しい。** 設定は小さく保ち、
  書き込みは debounce する。会話内容を保存しない方針はここでも効いてきます。
- **content script の注入タイミングが Chrome より遅れることがある。** `document_idle` 前提の
  決め打ちをせず、既存 DOM の走査と MutationObserver の両方で拾う実装にする。
- **iOS Safari も同じ拡張が動く。** タッチ操作を想定し、トグルのヒット領域は 44×44 px 以上を確保する。
  ホバー前提の UI を作らないこと。
- 動作確認は macOS Safari の「開発」メニューから未署名の拡張機能を許可して行います。
  手順は `docs/safari.md` を参照。

Safari 固有の分岐が必要になった場合は `src/shared/browser.ts` に判定を置き、
アダプタや content script のロジックに `if (isSafari)` を散らさないでください。

## OSS としての運営方針

本リポジトリは MIT ライセンスで一般公開されています。すべてのコミット・Issue・PR は
第三者から閲覧されることを前提に扱ってください。

- **秘密情報を絶対にコミットしない。** Apple の署名証明書・プロビジョニングプロファイル、
  ストアの API キー、`.env` の類はリポジトリに入れません。CI で必要なものは GitHub Secrets に置き、
  ワークフローのログにも出力しないこと。
- **フォークされて動くことを前提にする。** ビルドに社内固有のツールや非公開パッケージを要求しない。
  `pnpm install && pnpm build` だけで誰でもビルドできる状態を保つ。
- **依存は最小限に。** 新しい依存を追加する PR では、必要性・ライセンス（MIT / Apache-2.0 / BSD 系のみ）・
  バンドルサイズへの影響を説明してもらう。GPL 系は取り込まない。
- **ドキュメントは英語を主、日本語を従とする。** `README.md` は英語。日本語版が必要なら
  `README.ja.md` に分ける。コード内コメントは日本語可。
- Issue / PR での応答も、日本語で来たら日本語、英語で来たら英語で返す。

外部コントリビュータ向けに以下を整備しています。内容を変更する場合はセットで更新してください。

- `LICENSE` — MIT
- `CONTRIBUTING.md` — 開発環境の準備、PR の粒度、レビューの流れ
- `CODE_OF_CONDUCT.md` — Contributor Covenant
- `SECURITY.md` — 脆弱性の非公開報告窓口。拡張機能の性質上、権限周りの報告は
  公開 Issue ではなく Private vulnerability reporting に誘導する
- `.github/ISSUE_TEMPLATE/site-support.md` — サイト対応リクエスト用。DOM 構造の情報を
  添えてもらうことで、アダプタ追加の負荷を下げる

レビューの基準は「壊れる範囲がアダプタ層に閉じているか」「新しい権限を要求していないか」
「外部通信が増えていないか」の 3 点を最優先に見ます。この 3 つに触れる PR は
機能の良し悪し以前に、方針の議論を Issue で先に行ってください。

## 設定項目

設定は `src/shared/settings.ts` の型とデフォルト値を唯一の情報源とします。追加時は
型・デフォルト値・options ページの UI・マイグレーション処理をセットで更新してください。

- `autoFold`: 一定の長さを超えた回答を自動で折りたたむ
- `foldThreshold`: 自動折りたたみの閾値（行数）
- `keepLastExpanded`: 最新の回答は折りたたまない
- `shortcut`: 全体の展開／折りたたみのキーボードショートカット
- `perSiteEnabled`: サイトごとの有効・無効

## テスト方針

- アダプタのセレクタ判定とロジックは、フィクスチャ HTML に対する vitest でカバーする。
- 実サービスへ自動アクセスするテストは書かない（規約とレート制限の問題があるため）。
- UI の挙動は playwright でフィクスチャページに対して検証する。

## コーディング規約

- TypeScript strict モード。`any` を使う場合はコメントで理由を残す。
- 命名は英語、コメントは日本語可。ユーザーに表示する文字列は `src/shared/i18n/` 経由にする。
- コミットメッセージは Conventional Commits（`feat:`, `fix:`, `chore:`, `docs:`）。
- 1 PR = 1 目的。アダプタの追加とコアの変更は分ける。

## やらないこと

- 外部サーバへの通信、解析ツールの導入、リモート設定の取得
- ホストページのネットワークリクエストへの介入や、レスポンス内容の書き換え
- 会話内容の保存（設定以外を `chrome.storage` に書かない）
- 対象サイトのログイン情報・Cookie へのアクセス
- eval / リモートコードの読み込み（MV3 で禁止されており、審査でも落ちます）

## リリース

`manifest.config.ts` のバージョンを上げ、`CHANGELOG.md` を更新してタグを打つと、
CI が `pnpm package` の成果物を GitHub Releases に添付します。ストアへの提出は手動です。

Safari 版は App Store 経由の配布になるため、Apple Developer Program の登録と審査が別途必要です。
バージョン番号は `manifest.config.ts` を正とし、Xcode 側の `MARKETING_VERSION` を
`pnpm build:safari` で同期させます。手で片方だけ上げないこと。