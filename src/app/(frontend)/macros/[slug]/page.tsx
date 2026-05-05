import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getPayload } from '../../../../lib/payload'
import { ClassTag, SpecTag, VersionTag, TierTag } from '../../../../components/Tags'
import { RichText } from '../../../../components/RichText'
import { MacroDetailActions } from '../../../../components/MacroDetailActions'
import type { Macro, Class, Spec, Version, Media } from '../../../../payload-types'

type Params = Promise<{ slug: string }>

export const revalidate = 60

function isMedia(v: unknown): v is Media {
  return !!v && typeof v === 'object' && 'url' in (v as Record<string, unknown>)
}

function previewUrl(macro: Macro): string | null {
  const img = macro.previewImg
  if (!isMedia(img)) return null
  return img.sizes?.hero?.url ?? img.url ?? null
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
    return (result.docs[0] as Macro | undefined) ?? null
  },
  ['macro-by-slug'],
  { revalidate: 60, tags: ['macros'] }
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
    return result.docs.map((m: any) => ({ slug: m.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const macro = await findMacroBySlugCached(slug)
  if (!macro) return { title: '宏不存在 — FlyMacro' }
  return {
    title: `${macro.title} — FlyMacro`,
    description: macro.summary ?? undefined,
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

  const img = previewUrl(macro)

  return (
    <div className="container-page page-single">
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
