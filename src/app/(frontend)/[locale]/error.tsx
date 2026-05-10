'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Frontend error:', error)
  }, [error])

  return (
    <div className="container-page page-single" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1 style={{ fontFamily: 'var(--font-hero)', fontSize: '2.5rem', color: 'var(--gold-bright)', marginBottom: '1rem' }}>
        出错了
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1rem' }}>
        页面加载时遇到了问题，请稍后重试或返回首页。
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={reset}
          className="btn btn-primary"
        >
          重试
        </button>
        <Link href="/" className="btn btn-ghost">
          返回首页
        </Link>
      </div>
    </div>
  )
}
