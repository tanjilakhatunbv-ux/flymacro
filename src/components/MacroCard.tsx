import Link from 'next/link'
import type { Macro, Class, Spec, Version, Media } from '../payload-types'
import { ClassTag, SpecTag, VersionTag, TypeTag } from './Tags'

function isMedia(v: unknown): v is Media {
  return !!v && typeof v === 'object' && 'url' in (v as Record<string, unknown>)
}

function previewUrl(macro: Macro): string | null {
  const img = macro.previewImg
  if (!isMedia(img)) return null
  const card = img.sizes?.card?.url
  return card ?? img.url ?? null
}

export function MacroCard({ macro }: { macro: Macro }) {
  const img = previewUrl(macro)
  return (
    <article className="macro-card" data-type={macro.type}>
      {img && (
        <Link href={`/macros/${macro.slug}`} className="card-img" aria-label={macro.title}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={macro.title} loading="lazy" />
        </Link>
      )}
      <div className="card-body">
        <div className="meta">
          {(macro.classes ?? []).map((c, i) => (
            <ClassTag key={`c-${i}`} value={c as number | Class} />
          ))}
          {(macro.specs ?? []).map((s, i) => (
            <SpecTag key={`s-${i}`} value={s as number | Spec} />
          ))}
          {(macro.versions ?? []).map((v, i) => (
            <VersionTag key={`v-${i}`} value={v as number | Version} />
          ))}
          <TypeTag type={macro.type} />
        </div>
        <h3>
          <Link href={`/macros/${macro.slug}`}>{macro.title}</Link>
        </h3>
        {macro.summary && <p className="summary">{macro.summary}</p>}
      </div>
    </article>
  )
}
