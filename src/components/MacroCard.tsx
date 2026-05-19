'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { Macro } from '../payload-types'
import { ClassTag, SpecTag, VersionTag, TierTag } from './Tags'
import { previewUrl } from '../lib/media'
import { extractTagValues } from '../lib/macro-utils'

export function MacroCard({ macro, isExchanged }: { macro: Macro; isExchanged?: boolean }) {
  const t = useTranslations('macroCard')
  const img = previewUrl(macro.previewImg ?? undefined)
  const durationText = (macro.durationDays ?? 0) === 0 ? t('permanent') : t('days', { days: macro.durationDays })
  const tagValues = extractTagValues(macro.tags)
  const visibleTags = tagValues.slice(0, 3)
  const extraTagCount = Math.max(0, tagValues.length - visibleTags.length)

  return (
    <article className="macro-card" data-tier={macro.tier} data-exchanged={isExchanged}>
      {img ? (
        <Link href={`/macros/${encodeURIComponent(macro.slug)}`} className="card-img" aria-hidden="true">
          <Image
            src={img}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            loading="lazy"
          />
          {isExchanged && <span className="card-badge owned">{t('exchanged')}</span>}
        </Link>
      ) : (
        <Link href={`/macros/${macro.slug}`} className="card-img card-img--empty" aria-hidden="true">
          <Image
            src="/images/macro-fallback.svg"
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            loading="lazy"
          />
          {isExchanged && <span className="card-badge owned">{t('exchanged')}</span>}
        </Link>
      )}
      <div className="card-body">
        <div className="meta">
          {(macro.classes ?? []).map((c, i) => (
            <ClassTag key={`c-${i}`} value={c} />
          ))}
          {(macro.specs ?? []).map((s, i) => (
            <SpecTag key={`s-${i}`} value={s} />
          ))}
          {(macro.versions ?? []).map((v, i) => (
            <VersionTag key={`v-${i}`} value={v} />
          ))}
          <TierTag tier={macro.tier ?? 'regular'} />
        </div>
        <h3>
          <Link href={`/macros/${encodeURIComponent(macro.slug)}`}>{macro.title}</Link>
        </h3>
        {macro.summary && <p className="summary">{macro.summary}</p>}
        {visibleTags.length > 0 && (
          <div className="tag-chip-list" aria-label="Tags">
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
          <span className="card-price">{t('credits', { price: macro.price ?? 0 })}</span>
          <span className="card-duration">{durationText}</span>
          {isExchanged && <span className="card-status">{t('owned')}</span>}
        </div>
      </div>
    </article>
  )
}
