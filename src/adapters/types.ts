// サイトごとの差分を吸収する層の契約。
// セレクタや DOM 構造の前提は必ずこの層 (src/adapters/) の中に閉じ込める。

export interface Adapter {
  /** アダプタの識別子（ログ・テスト用）。 */
  readonly id: string

  /** 対象ホストかどうかの判定。location.host を受け取る。 */
  matches(host: string): boolean

  /**
   * AI 側メッセージ要素を列挙する。ユーザー発言は含めないこと。
   * root は document もしくは MutationObserver が観測するサブツリー。
   */
  findMessages(root: ParentNode): HTMLElement[]

  /**
   * 生成が完了しているかの判定。ストリーミング中の要素は false を返す。
   * 完了判定はアダプタ側の責務。
   */
  isComplete(el: HTMLElement): boolean

  /**
   * トグル UI を挿入する基準位置（アンカー）を返す。
   * 返した要素の前にトグルが挿入される。挿入先が無ければ null。
   */
  anchorFor(el: HTMLElement): HTMLElement | null
}

/** メッセージ要素に付与する識別用データ属性。二重処理を防ぐ。 */
export const PROCESSED_ATTR = 'data-fold-ai'
