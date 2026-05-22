import { Skeleton } from '../../../../components/Skeleton'

export default function NewsLoading() {
  return (
    <div className="container-page">
      <h1 className="page-title" style={{ minHeight: 40 }}>
        <Skeleton className="skeleton-title" />
      </h1>
      <div className="news-grid" style={{ minHeight: 400 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ opacity: 0.6 }}>
            <Skeleton className="skeleton-img" />
            <Skeleton className="skeleton-title" />
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-line-short" />
          </div>
        ))}
      </div>
    </div>
  )
}
