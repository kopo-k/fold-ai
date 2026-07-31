---
name: Site support request / サイト対応リクエスト
about: Request support for a new AI chat site / 新しいサイトへの対応を依頼する
title: '[site] '
labels: site-support
---

<!-- Providing DOM details up front makes adding an adapter much faster. -->
<!-- DOM 構造の情報を添えていただけると、アダプタ追加の負荷が大きく下がります。 -->

## Site / サイト

- Name:
- URL / host (e.g. `example.ai`):

## DOM structure / DOM 構造

To add an adapter we need to know how to identify these in the page's DOM.
Please paste representative snippets (with private text removed).

アダプタ追加には以下を DOM 上でどう見分けるかが必要です。会話内容を伏せた上で、
代表的な要素の抜粋を貼ってください。

- **Assistant (AI) message element / AI 側メッセージ要素:**
  <!-- selector or outerHTML snippet -->

- **How to tell it's finished vs. still streaming / 生成完了と生成中の見分け方:**
  <!-- e.g. an attribute toggles, an action bar appears -->

- **Where the answer body starts / 回答本文の起点となる要素:**
  <!-- selector for the block to collapse -->

## Notes / 補足

<!-- Anything else that would help. -->
