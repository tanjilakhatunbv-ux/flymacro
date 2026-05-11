'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('error')

  useEffect(() => {
    console.error('Frontend error:', error)
  }, [error])

  return (
    <div className="container-page page-single" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1 style={{ fontFamily: 'var(--font-hero)', fontSize: '2.5rem', color: 'var(--gold-bright)', marginBottom: '1rem' }}>
        {t('title')}
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1rem' }}>
        {t('message')}
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={reset}
          className="btn btn-primary"
        >
          {t('retry')}
        </button>
        <Link href="/" className="btn btn-ghost">
          {t('backHome')}
        </Link>
      </div>
    </div>
  )
}
