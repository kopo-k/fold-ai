import type { en } from './en'

export const ja: Record<keyof typeof en, string> = {
  toggleFold: '折りたたむ',
  toggleUnfold: '展開する',
  toggleFoldAria: 'この回答を折りたたむ',
  toggleUnfoldAria: 'この回答を展開する',
  collapsedHint: '回答は折りたたまれています',
  optionsTitle: 'fold-ai の設定',
  optionsAutoFold: '長い回答を自動で折りたたむ',
  optionsFoldThreshold: 'この行数を超えたら折りたたむ',
  optionsKeepLastExpanded: '最新の回答は折りたたまない',
  optionsShortcut: '全体の展開／折りたたみショートカット',
  optionsPerSite: '有効にするサイト',
  optionsSaved: '保存しました',
}
