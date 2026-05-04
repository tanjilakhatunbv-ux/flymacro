import type { Metadata } from 'next'
import { getPayload } from '../../../lib/payload'
import { MacroCard } from '../../../components/MacroCard'
import { MacroFilters, ClearFiltersLink } from '../../../components/MacroFilters'
import type { Macro, Class } from '../../../payload-types'

export const metadata: Metadata = {
  title: '宏库 — FlyMacro',
  description: '浏览全部魔兽世界宏，按职业、专精、版本筛选。',
}

export const revalidate = 60

type SearchParams = Promise<{ type?: string; class?: string }>

export default async function MacrosListPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const type = sp.type === 'free' || sp.type === 'premium' ? sp.type : 'all'
  const classSlug = sp.class || null

  const payload = await getPayload()

  const classes = (await payload.find({
    collection: 'classes',
    sort: 'sort',
    limit: 50,
    depth: 0,
  })).docs as Class[]

  const where: Record<string, unknown> = { _status: { equals: 'published' } }
  const conditions: Record<string, unknown>[] = [{ _status: { equals: 'published' } }]
  if (type !== 'all') conditions.push({ type: { equals: type } })
  if (classSlug) {
    const cls = classes.find((c) => c.slug === classSlug)
    if (cls) conditions.push({ classes: { in: [cls.id] } })
  }
  ;(where as { and: typeof conditions }).and = conditions

  const result = await payload.find({
    collection: 'macros',
    where: where as any,
    sort: '-publishedAt',
    limit: 100,
    depth: 2,
  })

  const macros = result.docs as Macro[]

  return (
    <div className="container-page page-list">
      <h1>宏 库</h1>
      <p className="page-content">
        共 {result.totalDocs} 个宏 · 当前筛选：
        {type === 'all' ? '全部' : type === 'free' ? '免费' : '付费'}
        {classSlug && ` · ${classes.find((c) => c.slug === classSlug)?.nameZh ?? classSlug}`}
      </p>

      <MacroFilters
        classes={classes.map((c) => ({ slug: c.slug, nameZh: c.nameZh }))}
        type={type}
        classSlug={classSlug}
      />

      {macros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>当前条件下暂无宏包。</p>
          <ClearFiltersLink />
        </div>
      ) : (
        <div className="macro-grid">
          {macros.map((m) => (
            <MacroCard key={m.id} macro={m} />
          ))}
        </div>
      )}
    </div>
  )
}
