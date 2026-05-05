import type { Metadata } from 'next'
import { getPayload } from '../../../lib/payload'
import { getCurrentUser } from '../../../lib/auth'
import { MacroCard } from '../../../components/MacroCard'
import { MacroFilters, ClearFiltersLink } from '../../../components/MacroFilters'
import type { Macro, Class } from '../../../payload-types'

export const metadata: Metadata = {
  title: '宏库 — FlyMacro',
  description: '浏览全部魔兽世界宏，按职业、专精、版本筛选。',
}

export const revalidate = 60

type SearchParams = Promise<{ tier?: string; class?: string }>

export default async function MacrosListPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const tier = sp.tier === 'regular' || sp.tier === 'premium' ? sp.tier : 'all'
  const classSlug = sp.class || null

  const payload = await getPayload()
  const user = await getCurrentUser()

  const classes = (await payload.find({
    collection: 'classes',
    sort: 'sort',
    limit: 50,
    depth: 0,
  })).docs as Class[]

  const where: Record<string, unknown> = { _status: { equals: 'published' } }
  const conditions: Record<string, unknown>[] = [{ _status: { equals: 'published' } }]
  if (tier !== 'all') conditions.push({ tier: { equals: tier } })
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

  // Query user's exchanges to show ownership status on cards
  let exchangedMacroIds = new Set<number | string>()
  if (user) {
    const exchanges = await payload.find({
      collection: 'macro-exchanges',
      where: {
        and: [
          { user: { equals: user.id } },
          {
            or: [
              { expiresAt: { exists: false } },
              { expiresAt: { greater_than_equal: new Date().toISOString() } },
            ],
          },
        ],
      },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })
    exchanges.docs.forEach((e: any) => {
      const macroId = typeof e.macro === 'object' ? e.macro.id : e.macro
      if (macroId) exchangedMacroIds.add(macroId)
    })
  }

  const tierLabel = tier === 'all' ? '全部' : tier === 'regular' ? '普通宏' : '高级宏'

  return (
    <div className="container-page page-list">
      <h1>宏 库</h1>
      <p className="page-content">
        共 {result.totalDocs} 个宏 · 当前筛选：{tierLabel}
        {classSlug && ` · ${classes.find((c) => c.slug === classSlug)?.nameZh ?? classSlug}`}
      </p>

      <MacroFilters
        classes={classes.map((c) => ({ slug: c.slug, nameZh: c.nameZh }))}
        tier={tier}
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
            <MacroCard
              key={m.id}
              macro={m}
              isExchanged={exchangedMacroIds.has(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
