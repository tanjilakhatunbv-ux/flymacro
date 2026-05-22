import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { getPayload } from '../../../../lib/payload'
import { FALLBACK_GUIDES } from '../../../../lib/guide-fallbacks'
import type { Guide } from '../../../../payload-types'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'guide' })
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  }
}

export const revalidate = 300

export default async function GuideListPage() {
  const t = await getTranslations('guide')
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'guides',
    where: { _status: { equals: 'published' } },
    sort: ['weight', '-publishedAt'],
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const dbGuides = result.docs as Guide[]

  const dbSlugs = new Set(dbGuides.map((g) => g.slug))
  const fallbackEntries = Object.entries(FALLBACK_GUIDES)
    .filter(([slug]) => !dbSlugs.has(slug))
    .map(([slug, data]) => ({
      id: `fallback-${slug}`,
      slug,
      title: data.title,
      summary: data.summary,
      createdAt: '',
      updatedAt: '',
    })) as unknown as Guide[]

  const guides = [...dbGuides, ...fallbackEntries]

  return (
    <div className="container-page page-list">
      <h1>{t('pageTitle')}</h1>
      <p className="page-content">{t('pageSubtitle')}</p>

      {guides.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
          {t('empty')}
        </p>
      ) : (
        <ul className="macro-grid">
          {guides.map((g) => (
            <li key={g.id}>
              <Link href={`/guide/${g.slug}`} className="card" style={{ display: 'block' }}>
                <article className="macro-card">
                  <div className="card-body">
                    <h3>
                      <span style={{ color: 'var(--gold-bright)' }}>{g.title}</span>
                    </h3>
                    {g.summary && <p className="summary">{g.summary}</p>}
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
