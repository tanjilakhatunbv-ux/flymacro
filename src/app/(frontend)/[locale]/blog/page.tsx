import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { getPayload } from '../../../../lib/payload'
import type { Article } from '../../../../payload-types'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  }
}

export const revalidate = 300

export default async function BlogListPage() {
  const t = await getTranslations('blog')
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'articles',
    where: { _status: { equals: 'published' } },
    sort: ['-pinned', '-publishedAt'],
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const articles = result.docs as Article[]

  return (
    <div className="container-page page-list">
      <h1>{t('pageTitle')}</h1>
      <p className="page-content">{t('pageSubtitle')}</p>

      {articles.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
          {t('empty')}
        </p>
      ) : (
        <div className="macro-grid">
          {articles.map((a) => (
            <Link key={a.id} href={`/blog/${a.slug}`} className="macro-card" style={{ display: 'block' }}>
              <div className="card-body">
                <div className="meta">
                  {a.pinned && <span className="tag type-premium">{t('pinned')}</span>}
                  {a.category && <span className="tag spec">{getCategoryLabel(t, a.category)}</span>}
                </div>
                <h3>
                  <span style={{ color: 'var(--gold-bright)' }}>{a.title}</span>
                </h3>
                {a.summary && <p className="summary">{a.summary}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCategoryLabel(t: any, c: NonNullable<string>): string {
  switch (c) {
    case 'announcement':
      return t('categoryAnnouncement')
    case 'blog':
      return t('categoryBlog')
    case 'changelog':
      return t('categoryChangelog')
    default:
      return c
  }
}
