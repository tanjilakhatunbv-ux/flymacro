import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from '../../../../lib/payload'
import { RichText } from '../../../../components/RichText'
import type { Article } from '../../../../payload-types'

type Params = Promise<{ slug: string }>

export const revalidate = 60

async function findArticle(slug: string): Promise<Article | null> {
  const payload = await getPayload()
  const r = await payload.find({
    collection: 'articles',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
  })
  return (r.docs[0] as Article | undefined) ?? null
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const a = await findArticle(slug)
  if (!a) return { title: '文章不存在 — FlyMacro' }
  return { title: `${a.title} — FlyMacro`, description: a.summary ?? undefined }
}

export default async function BlogDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  const article = await findArticle(slug)
  if (!article) notFound()
  return (
    <div className="container-page page-single">
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
