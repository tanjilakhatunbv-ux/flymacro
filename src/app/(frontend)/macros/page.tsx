import type { Metadata } from 'next'
import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { getPayload } from '../../../lib/payload'
import { MacroGridClient } from '../../../components/MacroGridClient'
import { MacroFilters } from '../../../components/MacroFilters'
import type { Macro, Class } from '../../../payload-types'

export const metadata: Metadata = {
  title: '宏库 — FlyMacro',
  description: '浏览全部魔兽世界宏，按职业、专精、版本筛选。',
}

export const revalidate = 300

const getClasses = unstable_cache(
  async () => {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'classes',
      sort: 'sort',
      limit: 50,
      depth: 0,
    })
    return result.docs as Class[]
  },
  ['classes-list'],
  { revalidate: 3600, tags: ['classes'] }
)

const getMacros = unstable_cache(
  async () => {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'macros',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 200,
      depth: 1,
    })
    const macros = result.docs as Macro[]
    // Never leak codeContent from SSR cache
    macros.forEach((m: any) => {
      if (m) m.codeContent = null
    })
    return macros
  },
  ['macros-list-v2'],
  { revalidate: 300, tags: ['macros'] }
)

export default async function MacrosListPage() {
  const [classes, macros] = await Promise.all([getClasses(), getMacros()])

  return (
    <div className="container-page page-list">
      <h1>宏 库</h1>

      <Suspense fallback={<div style={{ minHeight: 120 }} />}>
        <MacroFilters
          classes={classes.map((c) => ({ slug: c.slug, nameZh: c.nameZh }))}
        />
      </Suspense>

      <Suspense fallback={<div style={{ minHeight: 200 }} />}>
        <MacroGridClient
          macros={macros}
          classes={classes.map((c) => ({ slug: c.slug, nameZh: c.nameZh, id: c.id }))}
        />
      </Suspense>
    </div>
  )
}
