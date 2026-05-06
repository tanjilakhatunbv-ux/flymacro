'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'

export function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number
  totalPages: number
}) {
  const pathname = usePathname()
  const params = useSearchParams()

  const buildHref = (page: number) => {
    const next = new URLSearchParams(params.toString())
    if (page <= 1) next.delete('page')
    else next.set('page', String(page))
    const qs = next.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const pages: number[] = []
  const window = 2
  const start = Math.max(1, currentPage - window)
  const end = Math.min(totalPages, currentPage + window)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <nav className="pagination" aria-label="分页">
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage <= 1}
        className={`page-link ${currentPage <= 1 ? 'is-disabled' : ''}`}
      >
        上一页
      </Link>
      {start > 1 && (
        <>
          <Link href={buildHref(1)} className="page-link">1</Link>
          {start > 2 && <span className="page-ellipsis">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          className={`page-link ${p === currentPage ? 'is-current' : ''}`}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </Link>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="page-ellipsis">…</span>}
          <Link href={buildHref(totalPages)} className="page-link">{totalPages}</Link>
        </>
      )}
      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage >= totalPages}
        className={`page-link ${currentPage >= totalPages ? 'is-disabled' : ''}`}
      >
        下一页
      </Link>
    </nav>
  )
}
