import { Skeleton } from '../../../../../components/Skeleton'

export default function MacroDetailLoading() {
  return (
    <div className="container-page page-single">
      <div style={{ width: '4rem', marginBottom: '1rem' }}><Skeleton className="skeleton-line-short" /></div>
      <div style={{ width: '60%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-title" /></div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <Skeleton className="skeleton-tag" />
        <Skeleton className="skeleton-tag" />
        <Skeleton className="skeleton-tag" />
      </div>
      <div style={{ width: '100%', height: 300, borderRadius: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-secondary, #1a1a2e)' }} />
      <div style={{ width: '100%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ width: '90%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ width: '95%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ width: '80%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ width: '85%' }}><Skeleton className="skeleton-line" /></div>
    </div>
  )
}
