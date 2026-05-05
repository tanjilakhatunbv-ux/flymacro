'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { MacroCard } from './MacroCard'
import { ClearFiltersLink } from './MacroFilters'
import type { Macro, Class } from '../payload-types'

export function MacroGridClient({
  macros,
  classes,
}: {
  macros: Macro[]
  classes: { slug: string; nameZh: string; id: number | string }[]
}) {
  const params = useSearchParams()
  const [exchangedIds, setExchangedIds] = useState<Set<number | string>>(new Set())

  useEffect(() => {
    fetch('/api/macro/my-exchanges', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { exchangedIds: [] }))
      .then((d) => {
        setExchangedIds(new Set(d.exchangedIds ?? []))
      })
      .catch(() => {})
  }, [])

  const tier = (params.get('tier') === 'regular' || params.get('tier') === 'premium')
    ? params.get('tier')!
    : 'all'
  const classSlug = params.get('class') || null

  const filtered = useMemo(() => {
    return macros.filter((m) => {
      if (tier !== 'all' && m.tier !== tier) return false
      if (classSlug) {
        const cls = classes.find((c) => c.slug === classSlug)
        if (cls) {
          const classIds = (m.classes ?? []).map((c) =>
            typeof c === 'object' ? c.id : c
          )
          if (!classIds.includes(cls.id as any)) return false
        }
      }
      return true
    })
  }, [macros, tier, classSlug, classes])

  const tierLabel = tier === 'all' ? '全部' : tier === 'regular' ? '普通宏' : '高级宏'
  const className = classSlug
    ? classes.find((c) => c.slug === classSlug)?.nameZh ?? classSlug
    : null

  return (
    <>
      <p className="page-content">
        共 {filtered.length} 个宏 · 当前筛选：{tierLabel}
        {className && ` · ${className}`}
      </p>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            当前条件下暂无宏包。
          </p>
          <ClearFiltersLink />
        </div>
      ) : (
        <div className="macro-grid">
          {filtered.map((m) => (
            <MacroCard key={m.id} macro={m} isExchanged={exchangedIds.has(m.id)} />
          ))}
        </div>
      )}
    </>
  )
}
