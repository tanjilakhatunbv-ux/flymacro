import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '../../../../lib/payload'
import { MacroGridClient } from '../../../../components/MacroGridClient'
import { MacroFilters } from '../../../../components/MacroFilters'
import { Pagination } from '../../../../components/Pagination'
import { FilterSkeleton, MacroGridSkeleton } from '../../../../components/Skeleton'
import type { Macro, Class, Spec, Version } from '../../../../payload-types'

export const revalidate = 60

const PAGE_SIZE = 24

const getLookupTables = unstable_cache(
  async () => {
    const payload = await getPayload()
    const [classesRes, specsRes, versionsRes, allMacrosRes] = await Promise.all([
      payload.find({ collection: 'classes', sort: 'sort', limit: 50, depth: 0, overrideAccess: true }),
      payload.find({ collection: 'specs', sort: 'sort', limit: 100, depth: 0, overrideAccess: true }),
      payload.find({ collection: 'versions', sort: '-releasedAt', limit: 50, depth: 0, overrideAccess: true }),
      payload.find({
        collection: 'macros',
        where: { _status: { equals: 'published' } },
        depth: 0,
        limit: 1000,
        select: { tags: true },
        overrideAccess: true,
      }),
    ])

    const tagSet = new Set<string>()
    for (const m of allMacrosRes.docs as Macro[]) {
      for (const t of m.tags ?? []) {
        const v = t.value?.trim()
        if (v) tagSet.add(v)
      }
    }

    return {
      classes: classesRes.docs as Class[],
      specs: specsRes.docs as Spec[],
      versions: versionsRes.docs as Version[],
      tags: Array.from(tagSet).sort((a, b) => a.localeCompare(b)),
    }
  },
  ['macro-lookup-v3'],
  { revalidate: 60, tags: ['classes', 'specs', 'versions', 'macros'] }
)

type SearchQuery = {
  tier?: string
  class?: string
  spec?: string
  version?: string
  tag?: string
  q?: string
  page?: string
}

const findMacros = unstable_cache(
  async (
    whereJson: string,
    page: number,
  ): Promise<{ docs: Macro[]; totalPages: number; totalDocs: number; page: number }> => {
    const payload = await getPayload()
    const where = JSON.parse(whereJson)
    const result = await payload.find({
      collection: 'macros',
      where,
      sort: '-publishedAt',
      page,
      limit: PAGE_SIZE,
      depth: 1,
      overrideAccess: true,
    })
    const docs = result.docs as Macro[]
    return {
      docs,
      totalPages: result.totalPages ?? 1,
      totalDocs: result.totalDocs ?? 0,
      page: result.page ?? page,
    }
  },
  ['macros-search-v4'],
  { revalidate: 60, tags: ['macros'] },
)

function buildWhere(
  q: SearchQuery,
  lookups: { classes: Class[]; specs: Spec[]; versions: Version[] },
): unknown {
  const conditions: unknown[] = [{ _status: { equals: 'published' } }]

  if (q.tier === 'regular' || q.tier === 'premium') {
    conditions.push({ tier: { equals: q.tier } })
  }

  if (q.class) {
    const cls = lookups.classes.find((c) => c.slug === q.class)
    if (cls) conditions.push({ classes: { in: [cls.id] } })
  }

  if (q.spec) {
    const spec = lookups.specs.find((s) => s.slug === q.spec)
    if (spec) conditions.push({ specs: { in: [spec.id] } })
  }

  if (q.version) {
    const ver = lookups.versions.find((v) => v.label === q.version)
    if (ver) conditions.push({ versions: { in: [ver.id] } })
  }

  if (q.tag) {
    conditions.push({ 'tags.value': { equals: q.tag } })
  }

  if (q.q && q.q.trim()) {
    const term = q.q.trim()
    conditions.push({
      or: [
        { title: { like: term } },
        { summary: { like: term } },
      ],
    })
  }

  return { and: conditions }
}

type Params = Promise<SearchQuery>

export default async function MacrosListPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams
  const t = await getTranslations('macros')
  const lookups = await getLookupTables()
  const where = buildWhere(sp, lookups)
  const page = Math.max(1, Number(sp.page ?? '1') || 1)
  const result = await findMacros(JSON.stringify(where), page)

  return (
    <div className="container-page page-list">
      <h1>{t('pageTitle')}</h1>

      <Suspense fallback={<FilterSkeleton />}>
        <MacroFilters
          classes={lookups.classes.map((c) => ({ id: c.id, slug: c.slug, nameZh: c.nameZh }))}
          specs={lookups.specs.map((s) => ({
            id: s.id,
            slug: s.slug,
            nameZh: s.nameZh,
            classId: typeof s.class === 'object' ? s.class?.id : s.class,
          }))}
          versions={lookups.versions.map((v) => ({ id: v.id, label: v.label }))}
          tags={lookups.tags}
        />
      </Suspense>

      <Suspense fallback={<MacroGridSkeleton />}>
        <MacroGridClient macros={result.docs} totalDocs={result.totalDocs} />
      </Suspense>

      {result.totalPages > 1 && (
        <Pagination currentPage={result.page} totalPages={result.totalPages} />
      )}
    </div>
  )
}
