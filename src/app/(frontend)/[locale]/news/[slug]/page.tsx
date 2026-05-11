import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '../../../../../lib/payload'
import { RichText } from '../../../../../components/RichText'
import { BackLink } from '../../../../../components/BackLink'

type NewsItem = {
  id: string
  title: string
  slug: string
  summary?: string
  category?: string
  author?: string
  publishedAt?: string
  body?: unknown
}

type Params = Promise<{ slug: string; locale: string }>

export const revalidate = 300

const findNewsCached = unstable_cache(
  async (slug: string) => {
    try {
      const payload = await getPayload()
      const r = await payload.find({
        collection: 'news' as never,
        where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
        limit: 1,
        depth: 1,
      })
      return (r.docs[0] as NewsItem | undefined) ?? null
    } catch {
      return null
    }
  },
  ['news-by-slug'],
  { revalidate: 300, tags: ['news'] }
)

export async function generateStaticParams() {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'news' as never,
      where: { _status: { equals: 'published' } },
      limit: 200,
      depth: 0,
    })
    return result.docs.map((a: never) => ({ slug: (a as { slug: string }).slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const t = await getTranslations('news')
  const a = await findNewsCached(slug)
  if (!a) return { title: t('notFound') }
  return { title: `${a.title} — FlyMacro`, description: a.summary ?? undefined }
}

export default async function NewsDetailPage({ params }: { params: Params }) {
  const { slug, locale } = await params
  const t = await getTranslations('news')
  const article = await findNewsCached(slug)
  if (!article) notFound()

  const categoryText = article.category ? getCategoryLabel(t, article.category) : null

  return (
    <div className="container-page page-single">
      <BackLink href="/news">{t('backToList')}</BackLink>
      <article className="macro-detail">
        <header className="detail-header">
          <div className="meta" style={{ marginBottom: '0.75rem' }}>
            {categoryText && <span className="tag spec">{categoryText}</span>}
            {article.publishedAt && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                {formatDate(article.publishedAt, locale)}
              </span>
            )}
            {article.author && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                · {article.author}
              </span>
            )}
          </div>
          <h1>{article.title}</h1>
        </header>
        <div className="detail-content">
          <RichText content={article.body as Parameters<typeof RichText>[0]['content']} />
        </div>
      </article>
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
