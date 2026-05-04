import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from '../../../../lib/payload'
import { RichText } from '../../../../components/RichText'
import type { Guide } from '../../../../payload-types'

type Params = Promise<{ slug: string }>

export const revalidate = 60

async function findGuide(slug: string): Promise<Guide | null> {
  const payload = await getPayload()
  const r = await payload.find({
    collection: 'guides',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
  })
  return (r.docs[0] as Guide | undefined) ?? null
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const g = await findGuide(slug)
  if (!g) return { title: '教程不存在 — FlyMacro' }
  return { title: `${g.title} — 教程 — FlyMacro`, description: g.summary ?? undefined }
}

export default async function GuideDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  const guide = await findGuide(slug)
  if (!guide) notFound()
  return (
    <div className="container-page page-single">
      <article className="macro-detail">
        <header className="detail-header">
          <h1>{guide.title}</h1>
        </header>
        <div className="detail-content">
          <RichText content={guide.body} />
        </div>
      </article>
    </div>
  )
}
