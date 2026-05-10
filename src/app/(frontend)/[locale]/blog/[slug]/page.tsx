import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getPayload } from '../../../../../lib/payload'
import { RichText } from '../../../../../components/RichText'
import { BackLink } from '../../../../../components/BackLink'
import type { Article } from '../../../../../payload-types'

type Params = Promise<{ slug: string }>

export const revalidate = 300

const findArticleCached = unstable_cache(
  async (slug: string) => {
    const payload = await getPayload()
    const r = await payload.find({
      collection: 'articles',
      where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
      limit: 1,
      depth: 1,
    })
    return (r.docs[0] as Article | undefined) ?? null
  },
  ['article-by-slug'],
  { revalidate: 300, tags: ['articles'] }
)

export async function generateStaticParams() {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'articles',
      where: { _status: { equals: 'published' } },
      limit: 200,
      depth: 0,
    })
    return result.docs.map((a: { slug: string }) => ({ slug: a.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const a = await findArticleCached(slug)
  if (!a) return { title: '文章不存在 — FlyMacro' }
  return { title: `${a.title} — FlyMacro`, description: a.summary ?? undefined }
}

export default async function BlogDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  const article = await findArticleCached(slug)
  if (!article) notFound()
  return (
    <div className="container-page page-single">
      <BackLink href="/blog">返回文章列表</BackLink>
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
