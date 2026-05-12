import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '../../../../../lib/payload'
import { RichText } from '../../../../../components/RichText'
import { BackLink } from '../../../../../components/BackLink'
import { FALLBACK_GUIDES } from '../../../../../lib/guide-fallbacks'
import type { Guide } from '../../../../../payload-types'

type Params = Promise<{ slug: string }>

export const revalidate = 300

const findGuideCached = unstable_cache(
  async (slug: string) => {
    const payload = await getPayload()
    const r = await payload.find({
      collection: 'guides',
      where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    return (r.docs[0] as Guide | undefined) ?? null
  },
  ['guide-by-slug'],
  { revalidate: 300, tags: ['guides'] }
)

export async function generateStaticParams() {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'guides',
      where: { _status: { equals: 'published' } },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })
    return result.docs.map((g: { slug: string }) => ({ slug: g.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const t = await getTranslations('guide')
  const g = await findGuideCached(slug)
  if (!g) {
    const fallback = FALLBACK_GUIDES[slug]
    if (fallback) return { title: t('metadataWith', { title: fallback.title }), description: fallback.summary }
    return { title: t('notFound') }
  }
  return { title: t('metadataWith', { title: g.title }), description: g.summary ?? undefined }
}

export default async function GuideDetailPage({ params }: { params: Params }) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const t = await getTranslations('guide')
  const guide = await findGuideCached(slug)

  if (!guide) {
    const fallback = FALLBACK_GUIDES[slug]
    if (!fallback) notFound()
    return (
      <div className="container-page page-single">
        <BackLink href="/guide">{t('backToList')}</BackLink>
        <article className="macro-detail">
          <header className="detail-header">
            <h1>{fallback.title}</h1>
          </header>
          <div className="detail-content">
            <RichText content={fallback.body} />
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="container-page page-single">
      <BackLink href="/guide">{t('backToList')}</BackLink>
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
