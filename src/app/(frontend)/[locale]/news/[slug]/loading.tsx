import { Skeleton } from '../../../../../components/Skeleton'

export default function NewsDetailLoading() {
  return (
    <div className="container-page page-single">
      <div style={{ width: '4rem', marginBottom: '1rem' }}><Skeleton className="skeleton-line-short" /></div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Skeleton className="skeleton-tag" />
        <div style={{ width: '5rem' }}><Skeleton className="skeleton-line-short" /></div>
      </div>
      <div style={{ width: '55%', marginBottom: '1.5rem' }}><Skeleton className="skeleton-title" /></div>
      <div style={{ width: '100%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ width: '95%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ width: '90%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ width: '85%' }}><Skeleton className="skeleton-line" /></div>
    </div>
  )
}
