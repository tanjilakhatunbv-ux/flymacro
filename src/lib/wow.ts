// WoW class & spec name dictionaries — used as lookup fallbacks before
// the rendering layer fetches the corresponding Class/Spec documents.

export const classNames: Record<string, string> = {
  deathknight: '死亡骑士',
  demonhunter: '恶魔猎手',
  druid: '德鲁伊',
  evoker: '唤魔师',
  hunter: '猎人',
  mage: '法师',
  monk: '武僧',
  paladin: '圣骑士',
  priest: '牧师',
  rogue: '潜行者',
  shaman: '萨满',
  warlock: '术士',
  warrior: '战士',
}

export const classSlugs = Object.keys(classNames)

export const classColors: Record<string, string> = {
  deathknight: '#C41E3A',
  demonhunter: '#A330C9',
  druid: '#FF7C0A',
  evoker: '#33937F',
  hunter: '#AAD372',
  mage: '#3FC7EB',
  monk: '#00FF98',
  paladin: '#F48CBA',
  priest: '#FFFFFF',
  rogue: '#FFF468',
  shaman: '#0070DD',
  warlock: '#8788EE',
  warrior: '#C69B6D',
}

export const specNames: Record<string, string> = {
  blood: '鲜血',
  frost: '冰霜',
  unholy: '邪恶',
  havoc: '浩劫',
  vengeance: '复仇',
  balance: '平衡',
  feral: '野性',
  guardian: '守护',
  restoration: '恢复',
  devastation: '湮灭',
  preservation: '恩护',
  augmentation: '增辉',
  beastmastery: '兽王',
  marksmanship: '射击',
  survival: '生存',
  arcane: '奥术',
  fire: '火焰',
  brewmaster: '酒仙',
  mistweaver: '织雾',
  windwalker: '踏风',
  holy: '神圣',
  protection: '防护',
  retribution: '惩戒',
  discipline: '戒律',
  shadow: '暗影',
  assassination: '刺杀',
  outlaw: '狂徒',
  subtlety: '敏锐',
  elemental: '元素',
  enhancement: '增强',
  affliction: '痛苦',
  demonology: '恶魔学识',
  destruction: '毁灭',
  arms: '武器',
  fury: '狂怒',
}

export function classLabel(slug: string | null | undefined): string {
  if (!slug) return ''
  return classNames[slug] ?? slug
}

export function specLabel(slug: string | null | undefined): string {
  if (!slug) return ''
  return specNames[slug] ?? slug
}
