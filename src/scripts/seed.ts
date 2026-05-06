/**
 * Seed reference data: 13 classes, 39 specs, current WoW versions, and a
 * default super-admin account. Idempotent — re-running updates by slug.
 *
 *   pnpm seed
 */
import { getPayload } from 'payload'
import config from '../payload.config'

type ClassSeed = {
  slug: string
  nameZh: string
  nameEn: string
  color: string
  sort: number
}

const CLASSES: ClassSeed[] = [
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

type SpecSeed = {
  slug: string
  nameZh: string
  nameEn: string
  classSlug: string
  role: 'tank' | 'healer' | 'melee-dps' | 'ranged-dps'
  sort: number
}

const SPECS: SpecSeed[] = [
  // Warrior
  { slug: 'warrior-arms',       nameZh: '武器',   nameEn: 'Arms',         classSlug: 'warrior',     role: 'melee-dps',  sort: 1 },
  { slug: 'warrior-fury',       nameZh: '狂怒',   nameEn: 'Fury',         classSlug: 'warrior',     role: 'melee-dps',  sort: 2 },
  { slug: 'warrior-protection', nameZh: '防护',   nameEn: 'Protection',   classSlug: 'warrior',     role: 'tank',       sort: 3 },
  // Paladin
  { slug: 'paladin-holy',         nameZh: '神圣',   nameEn: 'Holy',         classSlug: 'paladin',     role: 'healer',     sort: 1 },
  { slug: 'paladin-protection',   nameZh: '防护',   nameEn: 'Protection',   classSlug: 'paladin',     role: 'tank',       sort: 2 },
  { slug: 'paladin-retribution',  nameZh: '惩戒',   nameEn: 'Retribution',  classSlug: 'paladin',     role: 'melee-dps',  sort: 3 },
  // Hunter
  { slug: 'hunter-beast-mastery', nameZh: '兽王',   nameEn: 'Beast Mastery', classSlug: 'hunter',     role: 'ranged-dps', sort: 1 },
  { slug: 'hunter-marksmanship',  nameZh: '射击',   nameEn: 'Marksmanship', classSlug: 'hunter',     role: 'ranged-dps', sort: 2 },
  { slug: 'hunter-survival',      nameZh: '生存',   nameEn: 'Survival',     classSlug: 'hunter',     role: 'melee-dps',  sort: 3 },
  // Rogue
  { slug: 'rogue-assassination', nameZh: '刺杀',   nameEn: 'Assassination', classSlug: 'rogue',       role: 'melee-dps',  sort: 1 },
  { slug: 'rogue-outlaw',        nameZh: '狂徒',   nameEn: 'Outlaw',        classSlug: 'rogue',       role: 'melee-dps',  sort: 2 },
  { slug: 'rogue-subtlety',      nameZh: '敏锐',   nameEn: 'Subtlety',      classSlug: 'rogue',       role: 'melee-dps',  sort: 3 },
  // Priest
  { slug: 'priest-discipline', nameZh: '戒律',   nameEn: 'Discipline',     classSlug: 'priest',      role: 'healer',     sort: 1 },
  { slug: 'priest-holy',       nameZh: '神圣',   nameEn: 'Holy',           classSlug: 'priest',      role: 'healer',     sort: 2 },
  { slug: 'priest-shadow',     nameZh: '暗影',   nameEn: 'Shadow',         classSlug: 'priest',      role: 'ranged-dps', sort: 3 },
  // Shaman
  { slug: 'shaman-elemental',     nameZh: '元素',   nameEn: 'Elemental',     classSlug: 'shaman',      role: 'ranged-dps', sort: 1 },
  { slug: 'shaman-enhancement',   nameZh: '增强',   nameEn: 'Enhancement',   classSlug: 'shaman',      role: 'melee-dps',  sort: 2 },
  { slug: 'shaman-restoration',   nameZh: '恢复',   nameEn: 'Restoration',   classSlug: 'shaman',      role: 'healer',     sort: 3 },
  // Mage
  { slug: 'mage-arcane', nameZh: '奥术',   nameEn: 'Arcane',         classSlug: 'mage',        role: 'ranged-dps', sort: 1 },
  { slug: 'mage-fire',   nameZh: '火焰',   nameEn: 'Fire',           classSlug: 'mage',        role: 'ranged-dps', sort: 2 },
  { slug: 'mage-frost',  nameZh: '冰霜',   nameEn: 'Frost',          classSlug: 'mage',        role: 'ranged-dps', sort: 3 },
  // Warlock
  { slug: 'warlock-affliction',  nameZh: '痛苦',   nameEn: 'Affliction',     classSlug: 'warlock',     role: 'ranged-dps', sort: 1 },
  { slug: 'warlock-demonology',  nameZh: '恶魔学识', nameEn: 'Demonology',   classSlug: 'warlock',     role: 'ranged-dps', sort: 2 },
  { slug: 'warlock-destruction', nameZh: '毁灭',   nameEn: 'Destruction',    classSlug: 'warlock',     role: 'ranged-dps', sort: 3 },
  // Monk
  { slug: 'monk-brewmaster',  nameZh: '酒仙',   nameEn: 'Brewmaster',  classSlug: 'monk',        role: 'tank',       sort: 1 },
  { slug: 'monk-mistweaver',  nameZh: '织雾',   nameEn: 'Mistweaver',  classSlug: 'monk',        role: 'healer',     sort: 2 },
  { slug: 'monk-windwalker',  nameZh: '踏风',   nameEn: 'Windwalker',  classSlug: 'monk',        role: 'melee-dps',  sort: 3 },
  // Druid
  { slug: 'druid-balance',     nameZh: '平衡',   nameEn: 'Balance',     classSlug: 'druid',       role: 'ranged-dps', sort: 1 },
  { slug: 'druid-feral',       nameZh: '野性',   nameEn: 'Feral',       classSlug: 'druid',       role: 'melee-dps',  sort: 2 },
  { slug: 'druid-guardian',    nameZh: '守护',   nameEn: 'Guardian',    classSlug: 'druid',       role: 'tank',       sort: 3 },
  { slug: 'druid-restoration', nameZh: '恢复',   nameEn: 'Restoration', classSlug: 'druid',       role: 'healer',     sort: 4 },
  // Demon Hunter
  { slug: 'demonhunter-havoc',     nameZh: '浩劫',   nameEn: 'Havoc',     classSlug: 'demonhunter', role: 'melee-dps',  sort: 1 },
  { slug: 'demonhunter-vengeance', nameZh: '复仇',   nameEn: 'Vengeance', classSlug: 'demonhunter', role: 'tank',       sort: 2 },
  // Death Knight
  { slug: 'deathknight-blood',   nameZh: '鲜血',   nameEn: 'Blood',   classSlug: 'deathknight', role: 'tank',       sort: 1 },
  { slug: 'deathknight-frost',   nameZh: '冰霜',   nameEn: 'Frost',   classSlug: 'deathknight', role: 'melee-dps',  sort: 2 },
  { slug: 'deathknight-unholy',  nameZh: '邪恶',   nameEn: 'Unholy',  classSlug: 'deathknight', role: 'melee-dps',  sort: 3 },
  // Evoker
  { slug: 'evoker-devastation',   nameZh: '湮灭',   nameEn: 'Devastation',   classSlug: 'evoker',     role: 'ranged-dps', sort: 1 },
  { slug: 'evoker-preservation',  nameZh: '恒护',   nameEn: 'Preservation',  classSlug: 'evoker',     role: 'healer',     sort: 2 },
  { slug: 'evoker-augmentation',  nameZh: '增辉',   nameEn: 'Augmentation',  classSlug: 'evoker',     role: 'ranged-dps', sort: 3 },
]

const VERSIONS = [
  { label: '11.0.5', codename: 'The War Within',  releasedAt: '2024-10-22', isCurrent: true },
  { label: '10.2.7', codename: 'Dragonflight',    releasedAt: '2024-05-07', isCurrent: false },
  { label: '10.0',   codename: 'Dragonflight',    releasedAt: '2022-11-28', isCurrent: false },
  { label: '3.3.5',  codename: 'WotLK Classic',   releasedAt: '2010-06-22', isCurrent: false },
]

async function upsertBySlug(payload: any, collection: string, slug: string, data: any) {
  const found = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  if (found.docs.length > 0) {
    return payload.update({ collection, id: found.docs[0].id, data })
  }
  return payload.create({ collection, data })
}

async function upsertVersion(payload: any, label: string, data: any) {
  const found = await payload.find({
    collection: 'versions',
    where: { label: { equals: label } },
    limit: 1,
    depth: 0,
  })
  if (found.docs.length > 0) {
    return payload.update({ collection: 'versions', id: found.docs[0].id, data })
  }
  return payload.create({ collection: 'versions', data })
}

async function ensureSuperAdmin(payload: any) {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@flymacro.local'
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!2026'
  const found = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })
  if (found.docs.length > 0) {
    console.log(`[seed] super-admin already exists: ${email}`)
    return
  }
  await payload.create({
    collection: 'users',
    data: { email, password, name: '超级管理员', role: 'super-admin', _verified: true },
  })
  console.log(`[seed] created super-admin: ${email} / ${password}`)
  console.log(`[seed] >>> 请尽快登录 /admin 修改密码 <<<`)
}

async function main() {
  const payload = await getPayload({ config })
  console.log('[seed] starting...')

  for (const c of CLASSES) {
    await upsertBySlug(payload, 'classes', c.slug, c)
  }
  console.log(`[seed] upserted ${CLASSES.length} classes`)

  const classIdBySlug = new Map<string, string | number>()
  const allClasses = await payload.find({ collection: 'classes', limit: 100, depth: 0 })
  allClasses.docs.forEach((c: any) => classIdBySlug.set(c.slug, c.id))

  for (const s of SPECS) {
    const classId = classIdBySlug.get(s.classSlug)
    if (!classId) {
      console.warn(`[seed] missing class for spec ${s.slug}`)
      continue
    }
    await upsertBySlug(payload, 'specs', s.slug, {
      slug: s.slug,
      nameZh: s.nameZh,
      nameEn: s.nameEn,
      class: classId,
      role: s.role,
      sort: s.sort,
    })
  }
  console.log(`[seed] upserted ${SPECS.length} specs`)

  for (const v of VERSIONS) {
    await upsertVersion(payload, v.label, v)
  }
  console.log(`[seed] upserted ${VERSIONS.length} versions`)

  await ensureSuperAdmin(payload)

  await upsertBySlug(payload, 'guides', 'how-to-use-macro', {
    title: '宏命令使用指南',
    slug: 'how-to-use-macro',
    summary: '从复制到粘贴，手把手教你在魔兽世界里使用兑换到的宏命令。',
    weight: 1,
    publishedAt: new Date().toISOString(),
    body: {
      root: {
        children: [
          {
            children: [
              { detail: 0, format: 1, mode: 'normal', style: '', text: '1. 打开宏编辑器', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'heading', version: 1, tag: 'h2'
          },
          {
            children: [
              { detail: 0, format: 0, mode: 'normal', style: '', text: '在游戏中按下 ', type: 'text', version: 1 },
              { detail: 0, format: 1, mode: 'normal', style: '', text: 'ESC', type: 'text', version: 1 },
              { detail: 0, format: 0, mode: 'normal', style: '', text: ' 键打开系统菜单，点击「宏命令设置」，或者在聊天框直接输入 ', type: 'text', version: 1 },
              { detail: 0, format: 1, mode: 'normal', style: '', text: '/macro', type: 'text', version: 1 },
              { detail: 0, format: 0, mode: 'normal', style: '', text: ' 回车。', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1
          },
          {
            children: [
              { detail: 0, format: 1, mode: 'normal', style: '', text: '2. 新建宏', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'heading', version: 1, tag: 'h2'
          },
          {
            children: [
              { detail: 0, format: 0, mode: 'normal', style: '', text: '点击「新建」按钮，选择一个图标并为宏命名（名称不影响功能，只显示在动作条上）。', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1
          },
          {
            children: [
              { detail: 0, format: 1, mode: 'normal', style: '', text: '3. 粘贴代码', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'heading', version: 1, tag: 'h2'
          },
          {
            children: [
              { detail: 0, format: 0, mode: 'normal', style: '', text: '在 FlyMacro 宏详情页点击「复制」按钮，回到游戏宏编辑器的大文本框内，按 ', type: 'text', version: 1 },
              { detail: 0, format: 1, mode: 'normal', style: '', text: 'Ctrl + V', type: 'text', version: 1 },
              { detail: 0, format: 0, mode: 'normal', style: '', text: ' 粘贴全部内容。注意要完整粘贴，不要遗漏行首的 ', type: 'text', version: 1 },
              { detail: 0, format: 1, mode: 'normal', style: '', text: '#showtooltip', type: 'text', version: 1 },
              { detail: 0, format: 0, mode: 'normal', style: '', text: ' 或 ', type: 'text', version: 1 },
              { detail: 0, format: 1, mode: 'normal', style: '', text: '/cast', type: 'text', version: 1 },
              { detail: 0, format: 0, mode: 'normal', style: '', text: ' 等指令。', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1
          },
          {
            children: [
              { detail: 0, format: 1, mode: 'normal', style: '', text: '4. 保存并使用', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'heading', version: 1, tag: 'h2'
          },
          {
            children: [
              { detail: 0, format: 0, mode: 'normal', style: '', text: '点击「保存」后，将宏图标拖拽到动作条上。战斗中或平时点击该图标即可触发宏效果。', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1
          },
          {
            children: [
              { detail: 0, format: 1, mode: 'normal', style: '', text: '常见问题', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'heading', version: 1, tag: 'h2'
          },
          {
            children: [
              { detail: 0, format: 1, mode: 'normal', style: '', text: 'Q: 粘贴后提示「此宏已存在」？', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1
          },
          {
            children: [
              { detail: 0, format: 0, mode: 'normal', style: '', text: 'A: 说明你之前已经创建过同名宏。建议新建一个宏再粘贴，或者删除旧宏后重新创建。', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1
          },
          {
            children: [
              { detail: 0, format: 1, mode: 'normal', style: '', text: 'Q: 宏没有反应或报错？', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1
          },
          {
            children: [
              { detail: 0, format: 0, mode: 'normal', style: '', text: 'A: 检查是否完整复制了全部代码；某些宏依赖特定天赋或装备，请确保你当前处于对应专精。', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1
          },
          {
            children: [
              { detail: 0, format: 1, mode: 'normal', style: '', text: 'Q: 可以修改宏代码吗？', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1
          },
          {
            children: [
              { detail: 0, format: 0, mode: 'normal', style: '', text: 'A: 可以。如果你熟悉宏语法，可以根据自己的习惯修改技能名称或条件判断。但修改后若出现问题，建议恢复原始代码。', type: 'text', version: 1 }
            ],
            direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1
          }
        ],
        direction: 'ltr', format: '', indent: 0, type: 'root', version: 1
      }
    }
  })
  console.log('[seed] upserted guide: how-to-use-macro')

  console.log('[seed] done.')
  process.exit(0)
}

main().catch((err) => {
  console.error('[seed] failed:', err)
  process.exit(1)
})
