/**
 * Seed demo macros + test user for end-to-end testing.
 *
 *   npx tsx --env-file=.env src/scripts/seed-demos.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

// ── Reference data (same as seed.ts) ───────────────────────────

const CLASSES = [
  { slug: 'warrior',     nameZh: '战士',       nameEn: 'Warrior',      color: '#C69B6D', sort: 1 },
  { slug: 'paladin',     nameZh: '圣骑士',     nameEn: 'Paladin',      color: '#F48CBA', sort: 2 },
  { slug: 'hunter',      nameZh: '猎人',       nameEn: 'Hunter',       color: '#AAD372', sort: 3 },
  { slug: 'rogue',       nameZh: '潜行者',     nameEn: 'Rogue',        color: '#FFF468', sort: 4 },
  { slug: 'priest',      nameZh: '牧师',       nameEn: 'Priest',       color: '#FFFFFF', sort: 5 },
  { slug: 'shaman',      nameZh: '萨满祭司',   nameEn: 'Shaman',       color: '#0070DD', sort: 6 },
  { slug: 'mage',        nameZh: '法师',       nameEn: 'Mage',         color: '#3FC7EB', sort: 7 },
  { slug: 'warlock',     nameZh: '术士',       nameEn: 'Warlock',      color: '#8788EE', sort: 8 },
  { slug: 'monk',        nameZh: '武僧',       nameEn: 'Monk',         color: '#00FF98', sort: 9 },
  { slug: 'druid',       nameZh: '德鲁伊',     nameEn: 'Druid',        color: '#FF7C0A', sort: 10 },
  { slug: 'demonhunter', nameZh: '恶魔猎手',   nameEn: 'Demon Hunter', color: '#A330C9', sort: 11 },
  { slug: 'deathknight', nameZh: '死亡骑士',   nameEn: 'Death Knight', color: '#C41E3A', sort: 12 },
  { slug: 'evoker',      nameZh: '唤魔师',     nameEn: 'Evoker',       color: '#33937F', sort: 13 },
]

const SPECS = [
  { slug: 'warrior-arms',       nameZh: '武器',   nameEn: 'Arms',         classSlug: 'warrior',     role: 'melee-dps',  sort: 1 },
  { slug: 'warrior-fury',       nameZh: '狂怒',   nameEn: 'Fury',         classSlug: 'warrior',     role: 'melee-dps',  sort: 2 },
  { slug: 'warrior-protection', nameZh: '防护',   nameEn: 'Protection',   classSlug: 'warrior',     role: 'tank',       sort: 3 },
  { slug: 'paladin-holy',         nameZh: '神圣',   nameEn: 'Holy',         classSlug: 'paladin',     role: 'healer',     sort: 1 },
  { slug: 'paladin-protection',   nameZh: '防护',   nameEn: 'Protection',   classSlug: 'paladin',     role: 'tank',       sort: 2 },
  { slug: 'paladin-retribution',  nameZh: '惩戒',   nameEn: 'Retribution',  classSlug: 'paladin',     role: 'melee-dps',  sort: 3 },
  { slug: 'hunter-beast-mastery', nameZh: '兽王',   nameEn: 'Beast Mastery', classSlug: 'hunter',     role: 'ranged-dps', sort: 1 },
  { slug: 'hunter-marksmanship',  nameZh: '射击',   nameEn: 'Marksmanship', classSlug: 'hunter',     role: 'ranged-dps', sort: 2 },
  { slug: 'hunter-survival',      nameZh: '生存',   nameEn: 'Survival',     classSlug: 'hunter',     role: 'melee-dps',  sort: 3 },
  { slug: 'rogue-assassination', nameZh: '刺杀',   nameEn: 'Assassination', classSlug: 'rogue',       role: 'melee-dps',  sort: 1 },
  { slug: 'rogue-outlaw',        nameZh: '狂徒',   nameEn: 'Outlaw',        classSlug: 'rogue',       role: 'melee-dps',  sort: 2 },
  { slug: 'rogue-subtlety',      nameZh: '敏锐',   nameEn: 'Subtlety',      classSlug: 'rogue',       role: 'melee-dps',  sort: 3 },
  { slug: 'priest-discipline', nameZh: '戒律',   nameEn: 'Discipline',     classSlug: 'priest',      role: 'healer',     sort: 1 },
  { slug: 'priest-holy',       nameZh: '神圣',   nameEn: 'Holy',           classSlug: 'priest',      role: 'healer',     sort: 2 },
  { slug: 'priest-shadow',     nameZh: '暗影',   nameEn: 'Shadow',         classSlug: 'priest',      role: 'ranged-dps', sort: 3 },
  { slug: 'shaman-elemental',     nameZh: '元素',   nameEn: 'Elemental',     classSlug: 'shaman',      role: 'ranged-dps', sort: 1 },
  { slug: 'shaman-enhancement',   nameZh: '增强',   nameEn: 'Enhancement',   classSlug: 'shaman',      role: 'melee-dps',  sort: 2 },
  { slug: 'shaman-restoration',   nameZh: '恢复',   nameEn: 'Restoration',   classSlug: 'shaman',      role: 'healer',     sort: 3 },
  { slug: 'mage-arcane', nameZh: '奥术',   nameEn: 'Arcane',         classSlug: 'mage',        role: 'ranged-dps', sort: 1 },
  { slug: 'mage-fire',   nameZh: '火焰',   nameEn: 'Fire',           classSlug: 'mage',        role: 'ranged-dps', sort: 2 },
  { slug: 'mage-frost',  nameZh: '冰霜',   nameEn: 'Frost',          classSlug: 'mage',        role: 'ranged-dps', sort: 3 },
  { slug: 'warlock-affliction',  nameZh: '痛苦',   nameEn: 'Affliction',     classSlug: 'warlock',     role: 'ranged-dps', sort: 1 },
  { slug: 'warlock-demonology',  nameZh: '恶魔学识', nameEn: 'Demonology',   classSlug: 'warlock',     role: 'ranged-dps', sort: 2 },
  { slug: 'warlock-destruction', nameZh: '毁灭',   nameEn: 'Destruction',    classSlug: 'warlock',     role: 'ranged-dps', sort: 3 },
  { slug: 'monk-brewmaster',  nameZh: '酒仙',   nameEn: 'Brewmaster',  classSlug: 'monk',        role: 'tank',       sort: 1 },
  { slug: 'monk-mistweaver',  nameZh: '织雾',   nameEn: 'Mistweaver',  classSlug: 'monk',        role: 'healer',     sort: 2 },
  { slug: 'monk-windwalker',  nameZh: '踏风',   nameEn: 'Windwalker',  classSlug: 'monk',        role: 'melee-dps',  sort: 3 },
  { slug: 'druid-balance',     nameZh: '平衡',   nameEn: 'Balance',     classSlug: 'druid',       role: 'ranged-dps', sort: 1 },
  { slug: 'druid-feral',       nameZh: '野性',   nameEn: 'Feral',       classSlug: 'druid',       role: 'melee-dps',  sort: 2 },
  { slug: 'druid-guardian',    nameZh: '守护',   nameEn: 'Guardian',    classSlug: 'druid',       role: 'tank',       sort: 3 },
  { slug: 'druid-restoration', nameZh: '恢复',   nameEn: 'Restoration', classSlug: 'druid',       role: 'healer',     sort: 4 },
  { slug: 'demonhunter-havoc',     nameZh: '浩劫',   nameEn: 'Havoc',     classSlug: 'demonhunter', role: 'melee-dps',  sort: 1 },
  { slug: 'demonhunter-vengeance', nameZh: '复仇',   nameEn: 'Vengeance', classSlug: 'demonhunter', role: 'tank',       sort: 2 },
  { slug: 'deathknight-blood',   nameZh: '鲜血',   nameEn: 'Blood',   classSlug: 'deathknight', role: 'tank',       sort: 1 },
  { slug: 'deathknight-frost',   nameZh: '冰霜',   nameEn: 'Frost',   classSlug: 'deathknight', role: 'melee-dps',  sort: 2 },
  { slug: 'deathknight-unholy',  nameZh: '邪恶',   nameEn: 'Unholy',  classSlug: 'deathknight', role: 'melee-dps',  sort: 3 },
  { slug: 'evoker-devastation',   nameZh: '湮灭',   nameEn: 'Devastation',   classSlug: 'evoker',     role: 'ranged-dps', sort: 1 },
  { slug: 'evoker-preservation',  nameZh: '恒护',   nameEn: 'Preservation',  classSlug: 'evoker',     role: 'healer',     sort: 2 },
  { slug: 'evoker-augmentation',  nameZh: '增辉',   nameEn: 'Augmentation',  classSlug: 'evoker',     role: 'ranged-dps', sort: 3 },
]

const VERSIONS = [
  { label: '11.0.5', codename: 'The War Within',  releasedAt: '2024-10-22', isCurrent: true },
  { label: '10.2.7', codename: 'Dragonflight',    releasedAt: '2024-05-07', isCurrent: false },
]

// ── Helpers ────────────────────────────────────────────────────

async function upsertBySlug(payload: any, collection: string, slug: string, data: any) {
  const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  if (found.docs.length > 0) {
    return payload.update({ collection, id: found.docs[0].id, data })
  }
  return payload.create({ collection, data })
}

async function upsertVersion(payload: any, label: string, data: any) {
  const found = await payload.find({ collection: 'versions', where: { label: { equals: label } }, limit: 1, depth: 0 })
  if (found.docs.length > 0) {
    return payload.update({ collection: 'versions', id: found.docs[0].id, data })
  }
  return payload.create({ collection: 'versions', data })
}

function lexicalBody(text: string): any {
  return {
    root: {
      type: 'root',
      format: 0,
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: 0,
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            { mode: 'normal', text, type: 'text', style: '', detail: 0, format: 0, version: 1 },
          ],
        },
      ],
    },
  }
}

// ── Demo macros ────────────────────────────────────────────────

const DEMO_MACROS = [
  {
    slug: 'priest-heal-starter',
    title: '牧师神圣入门宏',
    tier: 'regular' as const,
    price: 5,
    durationDays: 0,
    autoRenewable: true,
    summary: '适合新手牧师的神圣治疗宏，包含常用治疗技能一键施放。',
    body: '牧师神圣专精入门宏包，整合了快速治疗、恢复、圣言术等核心技能，让你在治疗团队副本时更加得心应手。',
    codeContent: `#showtooltip\n/cast [@mouseover,help,nodead][@target,help,nodead][@player] 快速治疗\n/script UIErrorsFrame:Clear()`,
    classSlugs: ['priest'],
    specSlugs: ['priest-holy'],
    versionLabels: ['11.0.5'],
  },
  {
    slug: 'warrior-dps-burst',
    title: '战士武器爆发宏',
    tier: 'regular' as const,
    price: 5,
    durationDays: 7,
    autoRenewable: true,
    summary: '武器战士爆发输出宏，7天有效期，适合短期冲层使用。',
    body: '专为武器战士设计的爆发输出循环宏，整合天神下凡、致死打击等核心爆发技能，让你在关键时刻打出最高伤害。',
    codeContent: `#showtooltip 天神下凡\n/cast 天神下凡\n/use 13\n/use 14\n/cast 致死打击\n/script UIErrorsFrame:Clear()`,
    classSlugs: ['warrior'],
    specSlugs: ['warrior-arms'],
    versionLabels: ['11.0.5'],
  },
  {
    slug: 'mage-arcane-rotation',
    title: '法师奥术循环宏',
    tier: 'regular' as const,
    price: 5,
    durationDays: 0,
    autoRenewable: true,
    summary: '奥术法师日常循环宏，永久有效，一键输出无压力。',
    body: '奥术法师的完整输出循环宏，自动管理奥术充能层数，在4层时自动施放奥术弹幕，保持最优DPS。',
    codeContent: `#showtooltip 奥术冲击\n/cast [mod:shift] 奥术弹幕; 奥术冲击\n/script UIErrorsFrame:Clear()`,
    classSlugs: ['mage'],
    specSlugs: ['mage-arcane'],
    versionLabels: ['11.0.5', '10.2.7'],
  },
  {
    slug: 'priest-shadow-advanced',
    title: '牧师暗影进阶宏',
    tier: 'premium' as const,
    price: 100,
    durationDays: 30,
    autoRenewable: true,
    summary: '暗影牧师高阶输出宏，30天有效期，包含DOT管理和爆发时机优化。',
    body: '暗影牧师进阶宏包，包含完整的DOT刷新逻辑、心灵震爆优先级判断、以及虚空形态期间的完美循环。适合冲击高层大秘境和团本。',
    codeContent: `#showtooltip 虚空爆发\n/cast 虚空爆发\n/use 13\n/use 14\n/cast 心灵震爆\n/script UIErrorsFrame:Clear()`,
    classSlugs: ['priest'],
    specSlugs: ['priest-shadow'],
    versionLabels: ['11.0.5'],
  },
  {
    slug: 'demonhunter-havoc-pro',
    title: '恶魔猎手浩劫大师宏',
    tier: 'premium' as const,
    price: 100,
    durationDays: 0,
    autoRenewable: true,
    summary: '浩劫恶魔猎手大师级宏，永久有效，涵盖所有输出场景。',
    body: '浩劫专精大师级宏包，包含单体输出、AOE、爆发和位移整合。自动判断眼棱和刃舞的最佳使用时机，让你在PvE和PvP中都能发挥极致。',
    codeContent: `#showtooltip 眼棱\n/cast 眼棱\n/cast 刃舞\n/use 13\n/script UIErrorsFrame:Clear()`,
    classSlugs: ['demonhunter'],
    specSlugs: ['demonhunter-havoc'],
    versionLabels: ['11.0.5'],
  },
  {
    slug: 'druid-balance-mythic',
    title: '德鲁伊平衡秘境宏',
    tier: 'premium' as const,
    price: 100,
    durationDays: 7,
    autoRenewable: true,
    summary: '平衡德鲁伊大秘境专用宏，7天短期授权，专为冲层设计。',
    body: '平衡德鲁伊大秘境冲层专用宏包，自动管理日月蚀循环，优化星辰坠落和星涌术的施放优先级，附带安抚和缠绕的快捷施放。',
    codeContent: `#showtooltip 超凡之盟\n/cast 超凡之盟\n/use 13\n/use 14\n/cast 星涌术\n/script UIErrorsFrame:Clear()`,
    classSlugs: ['druid'],
    specSlugs: ['druid-balance'],
    versionLabels: ['11.0.5'],
  },
]

// ── Main ───────────────────────────────────────────────────────

async function main() {
  const payload = await getPayload({ config })
  console.log('[seed-demos] starting...')

  // 1. Ensure classes
  for (const c of CLASSES) {
    await upsertBySlug(payload, 'classes', c.slug, c)
  }
  console.log(`[seed-demos] upserted ${CLASSES.length} classes`)

  // 2. Ensure specs
  const classIdBySlug = new Map<string, string | number>()
  const allClasses = await payload.find({ collection: 'classes', limit: 100, depth: 0 })
  allClasses.docs.forEach((c: any) => classIdBySlug.set(c.slug, c.id))

  for (const s of SPECS) {
    const classId = classIdBySlug.get(s.classSlug)
    if (!classId) { console.warn(`[seed-demos] missing class for spec ${s.slug}`); continue }
    await upsertBySlug(payload, 'specs', s.slug, {
      slug: s.slug, nameZh: s.nameZh, nameEn: s.nameEn,
      class: classId, role: s.role, sort: s.sort,
    })
  }
  console.log(`[seed-demos] upserted ${SPECS.length} specs`)

  // 3. Ensure versions
  for (const v of VERSIONS) {
    await upsertVersion(payload, v.label, v)
  }
  console.log(`[seed-demos] upserted ${VERSIONS.length} versions`)

  // 4. Build lookup maps
  const specIdBySlug = new Map<string, string | number>()
  const allSpecs = await payload.find({ collection: 'specs', limit: 100, depth: 0 })
  allSpecs.docs.forEach((s: any) => specIdBySlug.set(s.slug, s.id))

  const versionIdByLabel = new Map<string, string | number>()
  const allVersions = await payload.find({ collection: 'versions', limit: 100, depth: 0 })
  allVersions.docs.forEach((v: any) => versionIdByLabel.set(v.label, v.id))

  // 5. Create demo macros
  let createdMacros = 0
  for (const m of DEMO_MACROS) {
    const existing = await payload.find({
      collection: 'macros',
      where: { slug: { equals: m.slug } },
      limit: 1, depth: 0,
    })
    if (existing.docs.length > 0) {
      console.log(`[seed-demos] macro "${m.slug}" already exists, skipping`)
      continue
    }

    const classIds = m.classSlugs.map((s) => classIdBySlug.get(s)).filter(Boolean) as (string | number)[]
    const specIds = m.specSlugs.map((s) => specIdBySlug.get(s)).filter(Boolean) as (string | number)[]
    const versionIds = m.versionLabels.map((l) => versionIdByLabel.get(l)).filter(Boolean) as (string | number)[]

    await payload.create({
      collection: 'macros',
      data: {
        title: m.title,
        slug: m.slug,
        tier: m.tier,
        price: m.price,
        durationDays: m.durationDays,
        autoRenewable: m.autoRenewable,
        summary: m.summary,
        body: lexicalBody(m.body),
        codeContent: m.codeContent,
        classes: classIds,
        specs: specIds,
        versions: versionIds,
        publishedAt: new Date().toISOString(),
        _status: 'published',
      } as any,
    })
    console.log(`[seed-demos] created macro: ${m.title} (${m.tier}, ${m.price} credits, ${m.durationDays === 0 ? 'permanent' : m.durationDays + ' days'})`)
    createdMacros++
  }
  console.log(`[seed-demos] created ${createdMacros} new macros`)

  // 6. Create test user with credits
  const testEmail = 'test@flymacro.local'
  const testPassword = 'Test123456'
  const existingUser = await payload.find({
    collection: 'users',
    where: { email: { equals: testEmail } },
    limit: 1, depth: 0,
  })
  if (existingUser.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: testEmail,
        password: testPassword,
        name: '测试用户',
        role: 'user',
        credits: 100,
        _verified: true,
      },
    })
    console.log(`[seed-demos] created test user: ${testEmail} / ${testPassword} (100 credits)`)
  } else {
    await payload.update({
      collection: 'users',
      id: existingUser.docs[0].id,
      data: { credits: 100, _verified: true },
    })
    console.log(`[seed-demos] test user already exists, reset credits to 100`)
  }

  console.log('[seed-demos] done.')
  process.exit(0)
}

main().catch((err) => {
  console.error('[seed-demos] failed:', err)
  process.exit(1)
})
