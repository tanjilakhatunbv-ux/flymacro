import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getPayload } from '../../../../lib/payload'
import { ClassTag, SpecTag, VersionTag, TierTag } from '../../../../components/Tags'
import { RichText } from '../../../../components/RichText'
import { BackLink } from '../../../../components/BackLink'
import { MacroDetailActions } from '../../../../components/MacroDetailActions'
import { VideoEmbed } from '../../../../components/VideoEmbed'
import { MacroJsonLd } from '../../../../components/MacroJsonLd'
import { isMedia, previewUrl } from '../../../../lib/media'
import { extractTagValues } from '../../../../lib/macro-utils'
import type { Macro, Class, Spec, Version } from '../../../../payload-types'

type Params = Promise<{ slug: string }>

export const revalidate = 3600

function pickSeoOgUrl(macro: Macro): string | null {
  const seo = (macro as unknown as { seo?: { ogImage?: unknown } }).seo
  const ogImage = isMedia(seo?.ogImage) ? seo!.ogImage : null
  if (ogImage) return ogImage.sizes?.og?.url ?? ogImage.url ?? null
  if (isMedia(macro.previewImg)) {
    return macro.previewImg.sizes?.og?.url ?? macro.previewImg.sizes?.hero?.url ?? macro.previewImg.url ?? null
  }
  return null
}

const findMacroBySlugCached = unstable_cache(
  async (slug: string) => {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'macros',
      where: {
        and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
      },
      limit: 1,
      depth: 1,
    })
    const macro = (result.docs[0] as Macro | undefined) ?? null
    // Never leak codeContent from SSR cache — it is always fetched client-side after auth check
    if (macro) {
      ;(macro as Macro & { codeContent?: unknown }).codeContent = null
    }
    return macro
  },
  ['macro-by-slug-v3'],
  { revalidate: 3600, tags: ['macros'] }
)

export async function generateStaticParams() {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'macros',
      where: { _status: { equals: 'published' } },
      limit: 200,
      depth: 0,
    })
    return result.docs.map((m: { slug: string }) => ({ slug: m.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const macro = await findMacroBySlugCached(slug)
  if (!macro) return { title: '宏不存在 — FlyMacro' }

  const seo = (macro as unknown as { seo?: { seoTitle?: string | null; seoDescription?: string | null } }).seo
  const title = seo?.seoTitle?.trim() || `${macro.title} — FlyMacro`
  const description = seo?.seoDescription?.trim() || macro.summary || undefined
  const ogUrl = pickSeoOgUrl(macro)
  const ogImages = ogUrl ? [{ url: ogUrl }] : []

  return {
    title,
    description,
    alternates: { canonical: `/macros/${macro.slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/macros/${macro.slug}`,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogUrl ? [ogUrl] : [],
    },
  }
}

export default async function MacroDetailPage({
  params,
}: {
  params: Params
}) {
  const { slug } = await params
  const macro = await findMacroBySlugCached(slug)
  if (!macro) notFound()

  const img = previewUrl(macro.previewImg ?? undefined)
  const tagValues = extractTagValues(macro.tags)
  const demoVideoUrl =
    typeof macro.demoVideoUrl === 'string' ? macro.demoVideoUrl : null

  return (
    <div className="container-page page-single">
      <BackLink href="/macros">返回宏列表</BackLink>
      <MacroJsonLd macro={macro} />
      <article className="macro-detail" data-tier={macro.tier}>
        <header className="detail-header">
          <h1>{macro.title}</h1>
          <div className="detail-meta">
            {(macro.classes ?? []).map((c, i) => (
              <ClassTag key={`c-${i}`} value={c as number | Class} />
            ))}
            {(macro.specs ?? []).map((s, i) => (
              <SpecTag key={`s-${i}`} value={s as number | Spec} />
            ))}
            {(macro.versions ?? []).map((v, i) => (
              <VersionTag key={`v-${i}`} value={v as number | Version} />
            ))}
            <TierTag tier={macro.tier ?? 'regular'} />
          </div>
          {tagValues.length > 0 && (
            <div className="tag-chip-list" aria-label="标签">
              {tagValues.map((t) => (
                <Link
                  key={t}
                  href={`/macros?tag=${encodeURIComponent(t)}`}
                  className="tag-chip"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </header>

        {img && (
          <div className="detail-preview">
            <Image src={img} alt={macro.title} width={1600} height={900} priority />
          </div>
        )}

        <div className="detail-content">
          {macro.summary && (
            <p style={{ fontFamily: 'var(--font-decor)', fontStyle: 'italic', color: 'var(--text-muted)' }}>
              {macro.summary}
            </p>
          )}
          <RichText content={macro.body} />
          <VideoEmbed url={demoVideoUrl} />
        </div>

        <MacroDetailActions
          macroId={macro.id}
          macroSlug={macro.slug}
          macroTitle={macro.title}
          price={macro.price ?? 0}
          durationDays={macro.durationDays ?? 0}
          autoRenewable={macro.autoRenewable ?? false}
          codeContent={macro.codeContent}
        />
      </article>
    </div>
  )
}
