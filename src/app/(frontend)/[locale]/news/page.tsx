import Image from 'next/image'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { getPayload } from '../../../../lib/payload'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'news' })
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  }
}

type NewsItem = {
  id: string
  title: string
  slug: string
  summary?: string
  category?: string
  author?: string
  pinned?: boolean
  publishedAt?: string
  cover?: unknown
}

export const revalidate = 300

export default async function NewsListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('news')
  let articles: NewsItem[] = []
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'news' as never,
      where: { _status: { equals: 'published' } },
      sort: ['-pinned', '-publishedAt'],
      limit: 100,
      depth: 1,
      overrideAccess: true,
    })
    articles = result.docs as NewsItem[]
  } catch {
    articles = []
  }

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
          {articles.map((a) => {
            const coverUrl = resolveCoverUrl(a.cover)
            return (
              <Link key={a.id} href={`/news/${a.slug}`} className="macro-card" style={{ display: 'block' }}>
                {coverUrl && (
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '6px 6px 0 0' }}>
                    <Image
                      src={coverUrl}
                      alt={a.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div className="card-body">
                  <div className="meta">
                    {a.pinned && <span className="tag type-premium">{t('pinned')}</span>}
                    {a.category && <span className="tag spec">{getCategoryLabel(t, a.category)}</span>}
                    {a.publishedAt && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {formatDate(a.publishedAt, locale)}
                      </span>
                    )}
                  </div>
                  <h3>
                    <span style={{ color: 'var(--gold-bright)' }}>{a.title}</span>
                  </h3>
                  {a.summary && <p className="summary">{a.summary}</p>}
                  {a.author && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>
                      {a.author}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCategoryLabel(t: any, c: string): string {
  switch (c) {
    case 'addon-dev':
      return t('categoryAddonDev')
    case 'tech-share':
      return t('categoryTechShare')
    case 'industry':
      return t('categoryIndustry')
    case 'version-update':
      return t('categoryVersionUpdate')
    default:
      return c
  }
}

function formatDate(dateStr: string, locale: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function resolveCoverUrl(cover: unknown): string | null {
  if (!cover) return null
  if (typeof cover === 'string') return cover
  if (typeof cover === 'object' && cover !== null) {
    const c = cover as Record<string, unknown>
    if (typeof c.url === 'string') return c.url
    if (c.sizes && typeof c.sizes === 'object') {
      const sizes = c.sizes as Record<string, unknown>
      if (sizes.thumbnail && typeof sizes.thumbnail === 'object') {
        const thumb = sizes.thumbnail as Record<string, unknown>
        if (typeof thumb.url === 'string') return thumb.url
      }
    }
  }
  return null
}
