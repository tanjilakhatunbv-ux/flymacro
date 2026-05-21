/**
 * 一次性迁移脚本：将 Hugo 内容迁移到 Payload CMS。
 * 迁移范围：
 *   - content/zh/macros/free/priest-heal-starter.md   → macros collection
 *   - content/zh/macros/premium/priest-shadow-dps.md   → macros collection
 *   - content/zh/pages/about.md                        → pages collection
 *
 *   pnpm migrate:content
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../payload.config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const HUGO_ROOT = path.resolve(__dirname, '../../../flymacro/content/zh')

/* ------------------------------------------------------------------ */
/* 轻量 frontmatter + body 解析                                        */

function parseMarkdown(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) return { frontmatter: {}, body: raw.trim() }

  const yaml = m[1]
  const body = m[2].trim()
  const frontmatter: Record<string, unknown> = {}

  let currentKey = ''
  let currentArr: string[] = []

  for (const line of yaml.split(/\r?\n/)) {
    const arrMatch = line.match(/^(\s+)-\s+(.*)$/)
    if (arrMatch && currentKey) {
      currentArr.push(stripQuotes(arrMatch[2]))
      frontmatter[currentKey] = currentArr
      continue
    }

    const kvMatch = line.match(/^(\w+):\s*(.*)$/)
    if (kvMatch) {
      currentKey = kvMatch[1]
      const val = stripQuotes(kvMatch[2].trim())
      if (val === '') {
        currentArr = []
        frontmatter[currentKey] = currentArr
      } else if (val === 'true') {
        frontmatter[currentKey] = true
      } else if (val === 'false') {
        frontmatter[currentKey] = false
      } else if (/^-?\d+$/.test(val)) {
        frontmatter[currentKey] = parseInt(val, 10)
      } else {
        frontmatter[currentKey] = val
      }
    }
  }

  return { frontmatter, body }
}

function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }
  return s
}

/* ------------------------------------------------------------------ */
/* Markdown → Lexical JSON（简化版，覆盖段落/标题/列表/引用/表格）      */

type LexNode =
  | { type: 'root'; children: LexNode[]; direction: 'ltr'; format: string; indent: number; version: number }
  | { type: 'paragraph'; children: InlineNode[]; direction: 'ltr' | null; format: string; indent: number; version: number }
  | { type: 'heading'; tag: 'h2' | 'h3' | 'h4'; children: InlineNode[]; direction: 'ltr' | null; format: string; indent: number; version: number }
  | { type: 'list'; listType: 'bullet' | 'number'; children: LexNode[]; direction: 'ltr' | null; format: string; indent: number; version: number; start: number }
  | { type: 'listitem'; children: LexNode[]; value: number; version: number }
  | { type: 'quote'; children: LexNode[]; direction: 'ltr' | null; format: string; indent: number; version: number }

type InlineNode =
  | { type: 'text'; text: string; bold?: boolean; italic?: boolean; code?: boolean; version?: number }
  | { type: 'link'; fields: { url: string; newTab?: boolean }; children: InlineNode[]; version: number }

function inlineNodes(text: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let remaining = text

  while (remaining.length > 0) {
    const patterns = [
      { re: /^\*\*(.+?)\*\*/, key: 'bold' as const },
      { re: /^__(.+?)__/, key: 'bold' as const },
      { re: /^\*(.+?)\*/, key: 'italic' as const },
      { re: /^_(.+?)_/, key: 'italic' as const },
      { re: /^`(.+?)`/, key: 'code' as const },
      { re: /^\[(.+?)\]\((.+?)\)/, key: 'link' as const },
    ]

    let matched = false
    for (const p of patterns) {
      const m = remaining.match(p.re)
      if (m) {
        if (p.key === 'link') {
          nodes.push({
            type: 'link',
            fields: { url: m[2] },
            children: [{ type: 'text', text: m[1], version: 1 }],
            version: 1,
          })
        } else {
          nodes.push({ type: 'text', text: m[1], [p.key]: true, version: 1 })
        }
        remaining = remaining.slice(m[0].length)
        matched = true
        break
      }
    }

    if (!matched) {
      const nextSpecial = Math.min(
        ...['**', '*', '__', '_', '`', '['].map((s) => {
          const idx = remaining.indexOf(s, 1)
          return idx === -1 ? Infinity : idx
        }),
      )
      const take = nextSpecial === Infinity ? remaining.length : nextSpecial
      nodes.push({ type: 'text', text: remaining.slice(0, take), version: 1 })
      remaining = remaining.slice(take)
    }
  }

  // 合并相邻的普通 text 节点
  const merged: InlineNode[] = []
  for (const n of nodes) {
    if (n.type === 'text' && !n.bold && !n.italic && !n.code) {
      const last = merged[merged.length - 1]
      if (last && last.type === 'text' && !last.bold && !last.italic && !last.code) {
        last.text += n.text
        continue
      }
    }
    merged.push(n)
  }
  return merged
}

function parseTable(lines: string[]): LexNode[] {
  const paragraphs: LexNode[] = []
  for (const line of lines) {
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean)
    if (cells.length > 0 && !cells.every((c) => /^-+$/.test(c))) {
      paragraphs.push({
        type: 'paragraph',
        children: inlineNodes(cells.join(' · ')),
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      })
    }
  }
  return paragraphs
}

function markdownToLexical(md: string): any {
  const lines = md.split(/\r?\n/)
  const rootChildren: LexNode[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    // Heading
    if (line.startsWith('### ')) {
      rootChildren.push({
        type: 'heading',
        tag: 'h3',
        children: inlineNodes(line.slice(4)),
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      })
      i++
      continue
    }
    if (line.startsWith('## ')) {
      rootChildren.push({
        type: 'heading',
        tag: 'h2',
        children: inlineNodes(line.slice(3)),
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      })
      i++
      continue
    }

    // Quote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      rootChildren.push({
        type: 'quote',
        children: [
          {
            type: 'paragraph',
            children: inlineNodes(quoteLines.join(' ')),
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      })
      continue
    }

    // List
    if (line.startsWith('- ')) {
      const listItems: LexNode[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        listItems.push({
          type: 'listitem',
          children: [
            {
              type: 'paragraph',
              children: inlineNodes(lines[i].slice(2)),
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            },
          ],
          value: listItems.length + 1,
          version: 1,
        })
        i++
      }
      rootChildren.push({
        type: 'list',
        listType: 'bullet',
        children: listItems,
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        start: 1,
      })
      continue
    }

    // Table (detected by pipe chars)
    if (line.includes('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i])
        i++
      }
      rootChildren.push(...parseTable(tableLines))
      continue
    }

    // Paragraph
    rootChildren.push({
      type: 'paragraph',
      children: inlineNodes(line),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    })
    i++
  }

  return {
    root: {
      type: 'root',
      children: rootChildren,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

/* ------------------------------------------------------------------ */
/* 辅助查询                                                            */

async function getIdMap(payload: any, collection: string, field: string, values: string[]) {
  const map = new Map<string, number | string>()
  for (const v of values) {
    const r = await payload.find({
      collection,
      where: { [field]: { equals: v } },
      limit: 1,
      depth: 0,
    })
    if (r.docs.length > 0) {
      map.set(v, r.docs[0].id)
    } else {
      console.warn(`[migrate] missing ${collection}.${field}="${v}"`)
    }
  }
  return map
}

/* ------------------------------------------------------------------ */
/* 主流程                                                              */

async function main() {
  const payload = await getPayload({ config })
  console.log('[migrate] starting...')

  // Pre-load reference IDs
  const classMap = await getIdMap(payload, 'classes', 'slug', ['priest'])
  const specMap = await getIdMap(payload, 'specs', 'slug', [
    'priest-holy',
    'priest-discipline',
    'priest-shadow',
  ])
  const versionMap = await getIdMap(payload, 'versions', 'label', ['10.2.7', '10.2'])

  // Fallback: try without minor version (Hugo used "10.2", DB may have "10.2.7")
  if (!versionMap.has('10.2')) {
    const r = await payload.find({
      collection: 'versions',
      where: { label: { equals: '10.2' } },
      limit: 1,
      depth: 0,
    })
    if (r.docs.length > 0) {
      versionMap.set('10.2', r.docs[0].id)
    } else if (versionMap.has('10.2.7')) {
      versionMap.set('10.2', versionMap.get('10.2.7')!)
    }
  }

  /* ----------------- priest-heal-starter (free) ----------------- */
  {
    const file = path.join(HUGO_ROOT, 'macros/free/priest-heal-starter.md')
    const { frontmatter, body } = parseMarkdown(file)
    const slug = 'priest-heal-starter'

    const existing = await payload.find({
      collection: 'macros',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })

    const data: any = {
      title: frontmatter.title as string,
      slug,
      type: 'free',
      summary: '专为新手牧师设计的基础治疗宏，包含快速治疗/强效治疗智能切换、团队框架点击施法、一键驱散魔法等功能。',
      classes: [classMap.get('priest')].filter(Boolean),
      specs: [specMap.get('priest-holy'), specMap.get('priest-discipline')].filter(Boolean),
      versions: [versionMap.get('10.2') ?? versionMap.get('10.2.7')].filter(Boolean),
      body: markdownToLexical(body),
      publishedAt: new Date().toISOString(),
      _status: 'published',
    }

    if (existing.docs.length > 0) {
      await payload.update({ collection: 'macros', id: existing.docs[0].id, data })
      console.log(`[migrate] updated macro: ${slug}`)
    } else {
      await payload.create({ collection: 'macros', data })
      console.log(`[migrate] created macro: ${slug}`)
    }
  }

  /* ----------------- priest-shadow-dps (premium) ---------------- */
  {
    const file = path.join(HUGO_ROOT, 'macros/premium/priest-shadow-dps.md')
    const { frontmatter, body } = parseMarkdown(file)
    const slug = 'priest-shadow-dps'

    const existing = await payload.find({
      collection: 'macros',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })

    // Models hard-coded because the lightweight YAML parser doesn't handle nested object arrays.
    // Values taken from Hugo frontmatter.
    const models = [
      {
        name: '基础版',
        price: 19,
        currency: 'CNY' as const,
        features: [
          { value: '核心循环宏（虚蚀/黑暗福音）' },
          { value: '自动判断目标血量切换技能' },
          { value: '暗影幻灵一键释放' },
        ],
        creemProductId: `PLACEHOLDER_${slug}_0`,
        sort: 0,
      },
      {
        name: '进阶版',
        price: 39,
        currency: 'CNY' as const,
        features: [
          { value: '基础版全部功能' },
          { value: '饰品+种族技能自动开启' },
          { value: '多目标AOE自动切换' },
          { value: '语音提醒关键技能CD' },
        ],
        creemProductId: `PLACEHOLDER_${slug}_1`,
        sort: 1,
      },
      {
        name: '大师版',
        price: 69,
        currency: 'CNY' as const,
        features: [
          { value: '进阶版全部功能' },
          { value: '实时DPS统计面板' },
          { value: 'Boss技能时间轴提醒' },
          { value: '1对1语音配置指导' },
          { value: '终身免费更新' },
        ],
        creemProductId: `PLACEHOLDER_${slug}_2`,
        sort: 2,
      },
    ]

    const data: any = {
      title: frontmatter.title as string,
      slug,
      type: 'premium',
      summary:
        '暗影牧师一键输出宏，经过 200+ 小时实战优化，覆盖团本、大秘境、PVP 全部场景。智能优先级判断，零延迟响应，可视化提示。',
      classes: [classMap.get('priest')].filter(Boolean),
      specs: [specMap.get('priest-shadow')].filter(Boolean),
      versions: [versionMap.get('10.2') ?? versionMap.get('10.2.7')].filter(Boolean),
      body: markdownToLexical(body),
      models,
      publishedAt: new Date().toISOString(),
      _status: 'published',
    }

    if (existing.docs.length > 0) {
      await payload.update({ collection: 'macros', id: existing.docs[0].id, data })
      console.log(`[migrate] updated macro: ${slug}`)
    } else {
      await payload.create({ collection: 'macros', data })
      console.log(`[migrate] created macro: ${slug}`)
    }
  }

  /* ----------------- about page ---------------- */
  {
    const file = path.join(HUGO_ROOT, 'pages/about.md')
    const { frontmatter, body } = parseMarkdown(file)
    const slug = 'about'

    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })

    const data: any = {
      title: frontmatter.title as string,
      slug,
      body: markdownToLexical(body),
      publishedAt: new Date().toISOString(),
      _status: 'published',
    }

    if (existing.docs.length > 0) {
      await payload.update({ collection: 'pages', id: existing.docs[0].id, data })
      console.log(`[migrate] updated page: ${slug}`)
    } else {
      await payload.create({ collection: 'pages', data })
      console.log(`[migrate] created page: ${slug}`)
    }
  }

  console.log('[migrate] done.')
  process.exit(0)
}

main().catch((err) => {
  console.error('[migrate] failed:', err)
  process.exit(1)
})
