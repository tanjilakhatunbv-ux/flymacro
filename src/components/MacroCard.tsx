import Link from 'next/link'
import type { Macro, Class, Spec, Version, Media } from '../payload-types'
import { ClassTag, SpecTag, VersionTag, TierTag } from './Tags'

function isMedia(v: unknown): v is Media {
  return !!v && typeof v === 'object' && 'url' in (v as Record<string, unknown>)
}

function previewUrl(macro: Macro): string | null {
  const img = macro.previewImg
  if (!isMedia(img)) return null
  const card = img.sizes?.card?.url
  return card ?? img.url ?? null
}

export function MacroCard({ macro, isExchanged }: { macro: Macro; isExchanged?: boolean }) {
  const img = previewUrl(macro)
  const durationText = (macro.durationDays ?? 0) === 0 ? '永久' : `${macro.durationDays}天`

  return (
    <article className="macro-card" data-tier={macro.tier} data-exchanged={isExchanged}>
      {img ? (
        <Link href={`/macros/${macro.slug}`} className="card-img" aria-label={macro.title}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={macro.title} loading="lazy" />
          {isExchanged && <span className="card-badge owned">已兑换</span>}
        </Link>
      ) : (
        <Link href={`/macros/${macro.slug}`} className="card-img card-img--empty" aria-label={macro.title}>
          <span className="card-img-placeholder">{macro.title.charAt(0)}</span>
          {isExchanged && <span className="card-badge owned">已兑换</span>}
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
          <TierTag tier={macro.tier ?? 'regular'} />
        </div>
        <h3>
          <Link href={`/macros/${macro.slug}`}>{macro.title}</Link>
        </h3>
        {macro.summary && <p className="summary">{macro.summary}</p>}
        <div className="card-footer">
          <span className="card-price">{macro.price ?? 0} 积分</span>
          <span className="card-duration">{durationText}</span>
          {isExchanged && <span className="card-status">已拥有</span>}
        </div>
      </div>
    </article>
  )
}
