import Link from 'next/link'
import Image from 'next/image'
import type { Macro, Class, Spec, Version } from '../payload-types'
import { ClassTag, SpecTag, VersionTag, TierTag } from './Tags'
import { previewUrl } from '../lib/media'
import { extractTagValues } from '../lib/macro-utils'

export function MacroCard({ macro, isExchanged }: { macro: Macro; isExchanged?: boolean }) {
  const img = previewUrl(macro)
  const durationText = (macro.durationDays ?? 0) === 0 ? '永久' : `${macro.durationDays}天`
  const tagValues = extractTagValues(macro.tags)
  const visibleTags = tagValues.slice(0, 3)
  const extraTagCount = Math.max(0, tagValues.length - visibleTags.length)

  return (
    <article className="macro-card" data-tier={macro.tier} data-exchanged={isExchanged}>
      {img ? (
        <Link href={`/macros/${macro.slug}`} className="card-img" aria-label={macro.title}>
          <Image
            src={img}
            alt={macro.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            loading="lazy"
          />
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
        {visibleTags.length > 0 && (
          <div className="tag-chip-list" aria-label="标签">
            {visibleTags.map((t) => (
              <Link
                key={t}
                href={`/macros?tag=${encodeURIComponent(t)}`}
                className="tag-chip"
              >
                #{t}
              </Link>
            ))}
            {extraTagCount > 0 && <span className="tag-chip-more">+{extraTagCount}</span>}
          </div>
        )}
        <div className="card-footer">
          <span className="card-price">{macro.price ?? 0} 积分</span>
          <span className="card-duration">{durationText}</span>
          {isExchanged && <span className="card-status">已拥有</span>}
        </div>
      </div>
    </article>
  )
}
