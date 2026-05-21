'use client'

import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition, useMemo, useState, useEffect } from 'react'

type ClassRef = { id: number | string; slug: string; nameZh?: string; nameEn?: string }
type SpecRef = { id: number | string; slug: string; nameZh?: string; nameEn?: string; classId?: number | string }
type VersionRef = { id: number | string; label: string }

type MacroFiltersProps = {
  classes: ClassRef[]
  specs: SpecRef[]
  versions: VersionRef[]
  tags: string[]
}

export function MacroFilters({ classes, specs, versions, tags }: MacroFiltersProps) {
  const t = useTranslations('macroFilters')
  const tWow = useTranslations('wow')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const tier = (params.get('tier') === 'regular' || params.get('tier') === 'premium')
    ? params.get('tier')!
    : 'all'
  const classSlug = params.get('class') || null
  const specSlug = params.get('spec') || null
  const versionLabel = params.get('version') || null
  const tagValue = params.get('tag') || null
  const initialQ = params.get('q') || ''

  const [qInput, setQInput] = useState(initialQ)
  useEffect(() => setQInput(initialQ), [initialQ])

  const visibleSpecs = useMemo(() => {
    if (!classSlug) return [] as SpecRef[]
    const cls = classes.find((c) => c.slug === classSlug)
    if (!cls) return []
    return specs.filter((s) => s.classId === cls.id)
  }, [classSlug, classes, specs])

  const setParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== 'all') next.set(key, value)
      else next.delete(key)
    }
    next.delete('page')
    const qs = next.toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  const submitSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const value = qInput.trim()
    setParams({ q: value || null })
  }

  return (
    <div aria-busy={isPending} className="macro-filters">
      <div className="filter-top-row">
        <form className="search-bar" onSubmit={submitSearch} role="search">
          <input
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAria')}
          />
          <button type="submit" className="btn">{t('search')}</button>
          {initialQ && (
            <button type="button" className="btn btn-ghost" onClick={() => { setQInput(''); setParams({ q: null }) }}>{t('clear')}</button>
          )}
        </form>

        <div className="filters" role="group" aria-label={t('tierFilter')}>
          <button type="button" className={`filter-btn ${tier === 'all' ? 'active' : ''}`} onClick={() => setParams({ tier: null })} aria-pressed={tier === 'all'}>{t('all')}</button>
          <button type="button" className={`filter-btn ${tier === 'regular' ? 'active' : ''}`} onClick={() => setParams({ tier: 'regular' })} aria-pressed={tier === 'regular'}>{t('regular')}</button>
          <button type="button" className={`filter-btn ${tier === 'premium' ? 'active' : ''}`} onClick={() => setParams({ tier: 'premium' })} aria-pressed={tier === 'premium'}>{t('premium')}</button>
        </div>
      </div>

      <div className="filter-strip">
        <span className="filter-strip-label">{t('classFilter')}</span>
        <div className="filter-strip-tags">
          <button type="button" className={`tag-link ${!classSlug ? 'active' : ''}`} onClick={() => setParams({ class: null, spec: null })} aria-pressed={!classSlug}>{t('all')}</button>
          {classes.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={`tag-link ${classSlug === c.slug ? 'active' : ''}`}
              onClick={() => setParams({ class: c.slug, spec: null })}
              aria-pressed={classSlug === c.slug}
            >
              {(() => { try { return tWow(c.slug) } catch { return locale === 'en' ? (c.nameEn ?? c.slug) : (c.nameZh ?? c.slug) } })()}
            </button>
          ))}
        </div>
      </div>

      {classSlug && visibleSpecs.length > 0 && (
        <div className="filter-strip">
          <span className="filter-strip-label">{t('specFilter')}</span>
          <div className="filter-strip-tags">
            <button type="button" className={`tag-link ${!specSlug ? 'active' : ''}`} onClick={() => setParams({ spec: null })} aria-pressed={!specSlug}>{t('all')}</button>
            {visibleSpecs.map((s) => (
              <button
                key={s.slug}
                type="button"
                className={`tag-link ${specSlug === s.slug ? 'active' : ''}`}
                onClick={() => setParams({ spec: s.slug })}
                aria-pressed={specSlug === s.slug}
              >
                {(() => { try { return tWow(s.slug) } catch { return locale === 'en' ? (s.nameEn ?? s.slug) : (s.nameZh ?? s.slug) } })()}
              </button>
            ))}
          </div>
        </div>
      )}

      {versions.length > 0 && (
        <div className="filter-strip">
          <span className="filter-strip-label">{t('versionFilter')}</span>
          <div className="filter-strip-tags">
            <button type="button" className={`tag-link ${!versionLabel ? 'active' : ''}`} onClick={() => setParams({ version: null })} aria-pressed={!versionLabel}>{t('all')}</button>
            {versions.map((v) => (
              <button
                key={String(v.id)}
                type="button"
                className={`tag-link ${versionLabel === v.label ? 'active' : ''}`}
                onClick={() => setParams({ version: v.label })}
                aria-pressed={versionLabel === v.label}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="filter-strip">
          <span className="filter-strip-label">{t('tagFilter')}</span>
          <div className="filter-strip-tags">
            <button type="button" className={`tag-link ${!tagValue ? 'active' : ''}`} onClick={() => setParams({ tag: null })} aria-pressed={!tagValue}>{t('all')}</button>
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                className={`tag-link ${tagValue === t ? 'active' : ''}`}
                onClick={() => setParams({ tag: t })}
                aria-pressed={tagValue === t}
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ClearFiltersLink() {
  const t = useTranslations('macroFilters')
  return (
    <Link href="/macros" className="btn">
      {t('clearAll')}
    </Link>
  )
}
