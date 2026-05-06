'use client'

import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useMemo, useState, useEffect } from 'react'

type ClassRef = { id: number | string; slug: string; nameZh: string }
type SpecRef = { id: number | string; slug: string; nameZh: string; classId?: number | string }
type VersionRef = { id: number | string; label: string }

type MacroFiltersProps = {
  classes: ClassRef[]
  specs: SpecRef[]
  versions: VersionRef[]
  tags: string[]
}

export function MacroFilters({ classes, specs, versions, tags }: MacroFiltersProps) {
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
            placeholder="搜索宏名称或简介..."
            aria-label="搜索宏"
          />
          <button type="submit" className="btn">搜索</button>
          {initialQ && (
            <button type="button" className="btn btn-ghost" onClick={() => { setQInput(''); setParams({ q: null }) }}>清除</button>
          )}
        </form>

        <div className="filters" role="tablist" aria-label="按档次筛选">
          <button type="button" className={`filter-btn ${tier === 'all' ? 'active' : ''}`} onClick={() => setParams({ tier: null })}>全部</button>
          <button type="button" className={`filter-btn ${tier === 'regular' ? 'active' : ''}`} onClick={() => setParams({ tier: 'regular' })}>普通</button>
          <button type="button" className={`filter-btn ${tier === 'premium' ? 'active' : ''}`} onClick={() => setParams({ tier: 'premium' })}>高级</button>
        </div>
      </div>

      <div className="filter-strip">
        <span className="filter-strip-label">职业</span>
        <div className="filter-strip-tags">
          <button type="button" className={`tag-link ${!classSlug ? 'active' : ''}`} onClick={() => setParams({ class: null, spec: null })}>全部</button>
          {classes.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={`tag-link ${classSlug === c.slug ? 'active' : ''}`}
              onClick={() => setParams({ class: c.slug, spec: null })}
            >
              {c.nameZh}
            </button>
          ))}
        </div>
      </div>

      {classSlug && visibleSpecs.length > 0 && (
        <div className="filter-strip">
          <span className="filter-strip-label">专精</span>
          <div className="filter-strip-tags">
            <button type="button" className={`tag-link ${!specSlug ? 'active' : ''}`} onClick={() => setParams({ spec: null })}>全部</button>
            {visibleSpecs.map((s) => (
              <button
                key={s.slug}
                type="button"
                className={`tag-link ${specSlug === s.slug ? 'active' : ''}`}
                onClick={() => setParams({ spec: s.slug })}
              >
                {s.nameZh}
              </button>
            ))}
          </div>
        </div>
      )}

      {versions.length > 0 && (
        <div className="filter-strip">
          <span className="filter-strip-label">版本</span>
          <div className="filter-strip-tags">
            <button type="button" className={`tag-link ${!versionLabel ? 'active' : ''}`} onClick={() => setParams({ version: null })}>全部</button>
            {versions.map((v) => (
              <button
                key={String(v.id)}
                type="button"
                className={`tag-link ${versionLabel === v.label ? 'active' : ''}`}
                onClick={() => setParams({ version: v.label })}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="filter-strip">
          <span className="filter-strip-label">标签</span>
          <div className="filter-strip-tags">
            <button type="button" className={`tag-link ${!tagValue ? 'active' : ''}`} onClick={() => setParams({ tag: null })}>全部</button>
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                className={`tag-link ${tagValue === t ? 'active' : ''}`}
                onClick={() => setParams({ tag: t })}
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
  return (
    <Link href="/macros" className="btn">
      清除全部筛选
    </Link>
  )
}
