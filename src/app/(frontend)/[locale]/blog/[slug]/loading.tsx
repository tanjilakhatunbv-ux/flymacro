import { Skeleton } from '../../../../../components/Skeleton'

export default function BlogDetailLoading() {
  return (
    <div className="container-page page-single">
      <div style={{ width: '4rem', marginBottom: '1rem' }}><Skeleton className="skeleton-line-short" /></div>
      <div style={{ width: '55%', marginBottom: '1.5rem' }}><Skeleton className="skeleton-title" /></div>
      <div style={{ width: '100%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ width: '95%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ width: '90%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ width: '85%', marginBottom: '0.75rem' }}><Skeleton className="skeleton-line" /></div>
      <div style={{ width: '80%' }}><Skeleton className="skeleton-line" /></div>
    </div>
  )
}
