import { MacroCard } from './MacroCard'
import type { Macro } from '../payload-types'

export function MacroGrid({
  macros,
  exchangedIds,
  totalCountText,
  emptyText,
  clearFilters,
}: {
  macros: Macro[]
  exchangedIds: Set<number | string>
  totalCountText: string
  emptyText: string
  clearFilters: React.ReactNode
}) {
  return (
    <>
      <p className="page-content">{totalCountText}</p>
      {macros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{emptyText}</p>
          {clearFilters}
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
