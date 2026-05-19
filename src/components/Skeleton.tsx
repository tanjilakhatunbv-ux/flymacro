export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`skeleton-pulse ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}

export function FilterSkeleton() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: 120, alignItems: 'center' }}>
      <Skeleton className="skeleton-chip" />
      <Skeleton className="skeleton-chip" />
      <Skeleton className="skeleton-chip" />
      <Skeleton className="skeleton-chip-wide" />
      <Skeleton className="skeleton-chip" />
      <Skeleton className="skeleton-chip" />
      <Skeleton className="skeleton-chip-wide" />
    </div>
  )
}

export function MacroGridSkeleton() {
  return (
    <div className="macro-grid" style={{ minHeight: 200 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="macro-card" style={{ opacity: 0.6 }}>
          <Skeleton className="skeleton-img" />
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
              <Skeleton className="skeleton-tag" />
              <Skeleton className="skeleton-tag" />
            </div>
            <Skeleton className="skeleton-title" />
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-line-short" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
              <Skeleton className="skeleton-price" />
              <Skeleton className="skeleton-price-short" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ScriptGridSkeleton() {
  return (
    <div className="script-grid" style={{ minHeight: 200 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="script-card" style={{ opacity: 0.6 }}>
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
            <Skeleton className="skeleton-tag" />
            <Skeleton className="skeleton-tag" />
          </div>
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line-short" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <Skeleton className="skeleton-price-short" />
            <Skeleton className="skeleton-price-short" />
          </div>
        </div>
      ))}
    </div>
  )
}
