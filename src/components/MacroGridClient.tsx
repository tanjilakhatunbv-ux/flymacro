'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('macroGrid')
  const [exchangedIds, setExchangedIds] = useState<Set<number | string>>(new Set())

  useEffect(() => {
    fetch('/api/macro/my-exchanges', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { exchangedIds: [] }))
      .then((d) => {
        const payload = d.data ?? d
        setExchangedIds(new Set(payload.exchangedIds ?? []))
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <p className="page-content">{t('totalCount', { count: totalDocs })}</p>

      {macros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {t('empty')}
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
