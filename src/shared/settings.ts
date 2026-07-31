// 設定の型とデフォルト値。ここを設定項目の唯一の情報源とする。
// 追加時は型・デフォルト値・options ページの UI・マイグレーション処理をセットで更新すること。

export interface Settings {
  /** 一定の長さを超えた回答を自動で折りたたむ */
  autoFold: boolean
  /** 自動折りたたみの閾値（行数の目安） */
  foldThreshold: number
  /** 最新の回答は折りたたまない */
  keepLastExpanded: boolean
  /** 全体の展開／折りたたみのキーボードショートカット */
  shortcut: string
  /** サイトごとの有効・無効（キーは host） */
  perSiteEnabled: Record<string, boolean>
}

/** 既知のサイト host。perSiteEnabled のキーとして使う。 */
export const KNOWN_HOSTS = [
  'chatgpt.com',
  'chat.openai.com',
  'claude.ai',
  'gemini.google.com',
] as const

export const DEFAULT_SETTINGS: Settings = {
  autoFold: true,
  // 8 行を超える回答を自動で折りたたむ。旧既定(20)は高すぎて中程度の回答が
  // 畳まれなかったため引き下げた。閾値は options ページで変更できる。
  foldThreshold: 8,
  keepLastExpanded: true,
  shortcut: 'Alt+Shift+F',
  perSiteEnabled: Object.fromEntries(KNOWN_HOSTS.map((h) => [h, true])),
}

/** storage に保存するスキーマのバージョン。破壊的変更時にインクリメントする。 */
export const SETTINGS_VERSION = 1

/**
 * 部分的・未知バージョンの保存値を現行スキーマへ正規化する。
 * 欠けている項目はデフォルトで補完し、未知のキーは捨てる。
 */
export function migrateSettings(raw: unknown): Settings {
  if (raw === null || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS, perSiteEnabled: { ...DEFAULT_SETTINGS.perSiteEnabled } }
  }
  const input = raw as Partial<Settings> & { perSiteEnabled?: Record<string, unknown> }

  const perSiteEnabled: Record<string, boolean> = { ...DEFAULT_SETTINGS.perSiteEnabled }
  if (input.perSiteEnabled && typeof input.perSiteEnabled === 'object') {
    for (const [host, value] of Object.entries(input.perSiteEnabled)) {
      perSiteEnabled[host] = value !== false
    }
  }

  return {
    autoFold: typeof input.autoFold === 'boolean' ? input.autoFold : DEFAULT_SETTINGS.autoFold,
    foldThreshold: normalizeThreshold(input.foldThreshold),
    keepLastExpanded:
      typeof input.keepLastExpanded === 'boolean'
        ? input.keepLastExpanded
        : DEFAULT_SETTINGS.keepLastExpanded,
    shortcut:
      typeof input.shortcut === 'string' && input.shortcut.trim().length > 0
        ? input.shortcut
        : DEFAULT_SETTINGS.shortcut,
    perSiteEnabled,
  }
}

function normalizeThreshold(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_SETTINGS.foldThreshold
  }
  // 極端な値を弾く。1 行未満や巨大値は無意味。
  return Math.min(500, Math.max(1, Math.round(value)))
}
