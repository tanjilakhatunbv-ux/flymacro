import { Skeleton } from '../../../../components/Skeleton'

export default function ContactLoading() {
  return (
    <div className="container-page page-single">
      <div style={{ width: '40%', marginBottom: '0.5rem' }}><Skeleton className="skeleton-title" /></div>
      <div style={{ width: '60%', marginBottom: '1.5rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ padding: '1.5rem', borderRadius: '0.5rem', background: 'var(--bg-secondary, #1a1a2e)' }}>
            <div style={{ width: '40%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-title" /></div>
            <div style={{ width: '80%' }}><Skeleton className="skeleton-line" /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
