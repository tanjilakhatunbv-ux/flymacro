import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '../../../../lib/payload'
import { ScriptCard } from '../../../../components/ScriptCard'
import { Pagination } from '../../../../components/Pagination'
import { ScriptGridSkeleton } from '../../../../components/Skeleton'
import type { Script } from '../../../../payload-types'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'scripts' })
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  }
}

const PAGE_SIZE = 24

const findScripts = unstable_cache(
  async (page: number): Promise<{ docs: Script[]; totalPages: number; totalDocs: number; page: number }> => {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'scripts',
      where: {
        and: [
          { status: { equals: 'published' } },
          { _status: { equals: 'published' } },
          { type: { equals: 'addon' } },
        ],
      },
      sort: '-publishedAt',
      page,
      limit: PAGE_SIZE,
      depth: 2,
      overrideAccess: true,
    })
    const docs = result.docs as Script[]
    return {
      docs,
      totalPages: result.totalPages ?? 1,
      totalDocs: result.totalDocs ?? 0,
      page: result.page ?? page,
    }
  },
  ['scripts-addon-downloads-v1'],
  { revalidate: 60, tags: ['scripts'] },
)

export default async function ScriptsListPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ page?: string }>
  params: Promise<{ locale: string }>
}) {
  const [{ page: pageParam }, { locale }] = await Promise.all([searchParams, params])
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)

  const t = await getTranslations('scripts')
  const result = await findScripts(page)

  const typeLabel: Record<string, string> = {
    macro: t('typeMacro'),
    addon: t('typeAddon'),
    tool: t('typeTool'),
    other: t('typeOther'),
  }

  return (
    <div className="container-page page-list">
      <h1>{t('pageTitle')}</h1>
      <p className="page-subtitle">{t('pageSubtitle')}</p>

      <Suspense fallback={<ScriptGridSkeleton />}>
        {result.docs.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
            {t('empty')}
          </p>
        ) : (
          <>
            <div className="script-grid">
              {result.docs.map((script) => (
                <ScriptCard
                  key={script.id}
                  script={script}
                  typeLabel={typeLabel}
                  locale={locale}
                  downloadLabel={t('downloadFile')}
                />
              ))}
            </div>
            {result.totalPages > 1 && (
              <Pagination currentPage={result.page} totalPages={result.totalPages} />
            )}
          </>
        )}
      </Suspense>
    </div>
  )
}
