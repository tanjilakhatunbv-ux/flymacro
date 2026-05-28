import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import {
  getPublishedArticleBySlug,
  getPublishedArticleStaticParams,
} from '../../../../../lib/content-data'
import { RichText } from '../../../../../components/RichText'
import { BackLink } from '../../../../../components/BackLink'

type Params = Promise<{ slug: string; locale: string }>

export const revalidate = 300

const findArticleCached = unstable_cache(
  async (slug: string) => {
    return await getPublishedArticleBySlug(slug)
  },
  ['article-by-slug'],
  { revalidate: 300, tags: ['articles'] }
)

export async function generateStaticParams() {
  try {
    return await getPublishedArticleStaticParams()
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug: rawSlug, locale } = await params
  const slug = decodeURIComponent(rawSlug)
  const t = await getTranslations({ locale, namespace: 'blog' })
  const a = await findArticleCached(slug)
  if (!a) return { title: t('notFound') }
  return { title: `${a.title} — FlyMacro`, description: a.summary ?? undefined }
}

export default async function BlogDetailPage({ params }: { params: Params }) {
  const { slug: rawSlug, locale } = await params
  const slug = decodeURIComponent(rawSlug)
  const t = await getTranslations({ locale, namespace: 'blog' })
  const article = await findArticleCached(slug)
  if (!article) notFound()
  return (
    <div className="container-page page-single">
      <BackLink href="/blog">{t('backToList')}</BackLink>
      <article className="macro-detail">
        <header className="detail-header">
          <h1>{article.title}</h1>
        </header>
        <div className="detail-content">
          <RichText content={article.body} />
        </div>
      </article>
    </div>
  )
}
