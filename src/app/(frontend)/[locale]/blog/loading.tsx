import { Skeleton } from '../../../../components/Skeleton'

export default function BlogLoading() {
  return (
    <div className="container-page">
      <h1 className="page-title" style={{ minHeight: 40 }}>
        <Skeleton className="skeleton-title" />
      </h1>
      <div style={{ minHeight: 300 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ marginBottom: '1.5rem', opacity: 0.6 }}>
            <Skeleton className="skeleton-title" />
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-line-short" />
          </div>
        ))}
      </div>
    </div>
  )
}
