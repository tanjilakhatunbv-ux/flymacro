'use client'

import { useEffect, useState } from 'react'
import { MacroCard } from './MacroCard'
import { ClearFiltersLink } from './MacroFilters'
import type { Macro } from '../payload-types'

export function MacroGridClient({
  macros,
  totalDocs,
}: {
  macros: Macro[]
  totalDocs: number
}) {
  const [exchangedIds, setExchangedIds] = useState<Set<number | string>>(new Set())

  useEffect(() => {
    fetch('/api/macro/my-exchanges', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { exchangedIds: [] }))
      .then((d) => {
        setExchangedIds(new Set(d.exchangedIds ?? []))
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <p className="page-content">共 {totalDocs} 个宏</p>

      {macros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            当前条件下暂无宏包。
          </p>
          <ClearFiltersLink />
        </div>
      ) : (
        <div className="macro-grid">
          {macros.map((m) => (
            <MacroCard key={m.id} macro={m} isExchanged={exchangedIds.has(m.id)} />
          ))}
        </div>
      )}
    </>
  )
}
