import { Skeleton } from '../../../../components/Skeleton'

export default function AccountLoading() {
  return (
    <>
      <div style={{ width: '40%', marginBottom: '0.5rem' }}><Skeleton className="skeleton-title" /></div>
      <div style={{ width: '60%', marginBottom: '1.5rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ padding: '1rem', borderRadius: '0.5rem', background: 'var(--bg-secondary, #1a1a2e)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ width: '50%' }}><Skeleton className="skeleton-line" /></div>
              <Skeleton className="skeleton-tag" />
            </div>
            <Skeleton className="skeleton-line-short" />
          </div>
        ))}
      </div>
    </>
  )
}
